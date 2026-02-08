import { GoogleGenerativeAI } from '@google/generative-ai';
import { deriveReadableTitle, isActionOnlyTitle, isGenericHeadTitle, isTrustedDomain as isTrustedDomainShared, stripGenericHeadPrefix } from '../shared/jobTitle';
import { isAllowedSourceUrl } from './agent-policy';

interface Env {
    DB: D1Database;
    GOOGLE_SEARCH_API_KEY: string;
    GOOGLE_SEARCH_CX: string;
    GEMINI_API_KEY: string;
    SERP_API_KEY: string;
}

interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

interface ParsedJob {
    title: string;
    category: string;
    shortInfo: string;
    importantDates: string; // JSON string
    applicationFee: string; // JSON string
    ageLimit: string;       // JSON string
    vacancyDetails: string; // JSON string
    importantLinks: string; // JSON string
    applyLink: string;
}

export class AutoAgent {
    private env: Env;

    constructor(env: Env) {
        this.env = env;
    }

    private stripHtmlToText(html: string): string {
        return html.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "")
            .replace(/<style[^>]*>([\S\s]*?)<\/style>/gmi, "")
            .replace(/<[^>]+>/g, "\n")
            .replace(/\s+/g, " ")
            .trim();
    }

    private extractCandidateUrlsFromHtml(html: string, baseUrl: string): string[] {
        const out: string[] = [];
        const pushUrl = (raw: string) => {
            const u = (raw || '').trim();
            if (!u) return;
            if (/^(mailto:|tel:|javascript:)/i.test(u)) return;
            if (u.startsWith('#')) return;
            try {
                const abs = new URL(u, baseUrl);
                if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return;
                const href = abs.toString();
                if (/\.(png|jpg|jpeg|gif|svg|webp|css|js)(\?|$)/i.test(href)) return;
                if (/(facebook\.com|instagram\.com|twitter\.com|x\.com|youtube\.com|youtu\.be|t\.me|telegram\.me|whatsapp\.com|wa\.me)/i.test(href)) return;
                out.push(href);
            } catch {}
        };

        const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
        for (let m; (m = hrefRe.exec(html));) {
            pushUrl(m[1]);
        }

        const urlRe = /\bhttps?:\/\/[^\s"'<>]+/gi;
        for (let m; (m = urlRe.exec(html));) {
            pushUrl(m[0]);
        }

        return Array.from(new Set(out));
    }

    private rankCandidateUrls(urls: string[], baseUrl: string): string[] {
        let baseHost = '';
        try { baseHost = new URL(baseUrl).hostname; } catch {}
        const scored = urls.map(u => {
            let score = 0;
            try {
                const parsed = new URL(u);
                if (baseHost && parsed.hostname === baseHost) score += 20;
                if (isTrustedDomainShared(u)) score += 30;
            } catch {}
            if (/\.(pdf)(\?|$)/i.test(u)) score += 60;
            if (/(notification|advertisement|adv\b|recruitment|corrigendum|notice|press\s*release)/i.test(u)) score += 35;
            if (/(apply|application|registration|online\s*form|portal)/i.test(u)) score += 20;
            if (/(login|captcha|share|redirect|downloadmanager)/i.test(u)) score -= 40;
            if (/(tender|auction|geM|eproc|e\-proc)/i.test(u)) score -= 30;
            return { u, score };
        }).sort((a, b) => b.score - a.score);
        return scored.map(s => s.u);
    }

    private extractTextFromPdf(buffer: ArrayBuffer): string {
        try {
            const bytes = new Uint8Array(buffer);
            const text = new TextDecoder('latin1', { fatal: false }).decode(bytes);
            const parts: string[] = [];

            const unescapePdfString = (s: string) => s
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')')
                .replace(/\\\\/g, '\\');

            const tjRe = /\(((?:\\.|[^\\)]){3,})\)\s*Tj/g;
            for (let m; (m = tjRe.exec(text));) {
                const v = unescapePdfString(m[1]);
                if (v) parts.push(v);
            }

            const tjArrayRe = /\[((?:.|\n|\r)*?)\]\s*TJ/g;
            for (let m; (m = tjArrayRe.exec(text));) {
                const inner = m[1] || '';
                const innerRe = /\(((?:\\.|[^\\)]){3,})\)/g;
                for (let n; (n = innerRe.exec(inner));) {
                    const v = unescapePdfString(n[1]);
                    if (v) parts.push(v);
                }
            }

            const joined = parts.join(' ')
                .replace(/\s+/g, ' ')
                .replace(/[^\S\r\n]+/g, ' ')
                .trim();
            return joined.slice(0, 30000);
        } catch {
            return '';
        }
    }

    private async fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8'
                },
                signal: controller.signal
            });
            clearTimeout(timeout);
            return res;
        } catch {
            return null;
        }
    }

    private tokenizeForMatch(text: string): string[] {
        const raw = (text || '').toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim();
        const stop = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'view', 'download', 'notification', 'recruitment', 'dated', 'date', 'start', 'end', 'application', 'apply', 'online', 'form']);
        const tokens = raw.split(' ')
            .map(t => t.trim())
            .filter(t => t.length >= 4 && !stop.has(t));
        return Array.from(new Set(tokens)).slice(0, 20);
    }

    private scoreMatch(haystack: string, tokens: string[]): number {
        const h = (haystack || '').toLowerCase();
        let score = 0;
        for (const t of tokens) {
            if (h.includes(t)) score += 1;
        }
        return score;
    }

    private extractDateHintsFromText(text: string): string[] {
        const t = (text || '').replace(/\s+/g, ' ').trim();
        const lower = t.toLowerCase();
        const dateRe = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
        const dates = Array.from(new Set((t.match(dateRe) || []).map(d => d.trim()))).slice(0, 6);
        if (dates.length === 0) return [];
        if (lower.includes('start date') && lower.includes('end date') && dates.length >= 2) {
            return [`Start Date: ${dates[0]}`, `End Date: ${dates[1]}`];
        }
        return dates.map(d => `Date: ${d}`);
    }

    private extractListingRowCandidates(html: string, baseUrl: string, title: string, snippet: string): Array<{ url: string; rowText: string; score: number; dateHints: string[] }> {
        const tokens = this.tokenizeForMatch(`${title} ${snippet}`);
        const rows = (html.match(/<tr[\s\S]*?<\/tr>/gi) || []).slice(0, 200);
        const out: Array<{ url: string; rowText: string; score: number; dateHints: string[] }> = [];
        for (const rowHtml of rows) {
            const rowText = this.stripHtmlToText(rowHtml);
            if (!rowText) continue;
            const rowScore = this.scoreMatch(rowText, tokens);
            if (rowScore <= 0) continue;
            const urls = this.extractCandidateUrlsFromHtml(rowHtml, baseUrl);
            if (urls.length === 0) continue;
            const dateHints = this.extractDateHintsFromText(rowText);
            const ranked = this.rankCandidateUrls(urls, baseUrl);
            const chosen = ranked[0];
            if (!chosen) continue;
            let score = rowScore * 10;
            if (/\.(pdf)(\?|$)/i.test(chosen)) score += 80;
            if (/(view|download)/i.test(rowText)) score += 15;
            if (dateHints.length) score += 10;
            out.push({ url: chosen, rowText, score, dateHints });
        }
        return out.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    private async buildDeepContext(baseUrl: string, title: string, snippet: string): Promise<{ context: string; candidateLinks: string[]; dateHints: string[] }> {
        const pieces: string[] = [];
        pieces.push(`Snippet: ${snippet}`);

        const primaryRes = await this.fetchWithTimeout(baseUrl, 12000);
        if (!primaryRes || !primaryRes.ok) {
            return { context: pieces.join('\n\n'), candidateLinks: [baseUrl], dateHints: [] };
        }

        const primaryType = (primaryRes.headers.get('content-type') || '').toLowerCase();
        if (primaryType.includes('application/pdf') || /\.(pdf)(\?|$)/i.test(baseUrl)) {
            const buf = await primaryRes.arrayBuffer();
            const pdfText = this.extractTextFromPdf(buf);
            pieces.push(`PDF Content (Truncated): ${pdfText ? pdfText.slice(0, 12000) : ''}`);
            const dateHints = this.extractDateHintsFromText(pdfText);
            return { context: pieces.join('\n\n'), candidateLinks: [baseUrl], dateHints };
        }

        if (!primaryType.includes('text/html')) {
            return { context: pieces.join('\n\n'), candidateLinks: [baseUrl], dateHints: [] };
        }

        const html = await primaryRes.text();
        const primaryText = this.stripHtmlToText(html).slice(0, 12000);
        pieces.push(`Primary Page Text (Truncated): ${primaryText}`);

        const rowCandidates = this.extractListingRowCandidates(html, baseUrl, title, snippet);
        const rowBest = rowCandidates[0] || null;
        if (rowBest) {
            pieces.push(`Matched Listing Row (Truncated): ${rowBest.rowText.slice(0, 1200)}`);
            if (rowBest.dateHints.length) pieces.push(`Listing Dates: ${rowBest.dateHints.join(' | ')}`);
            pieces.push(`Listing View Link: ${rowBest.url}`);
        }

        const candidates = this.rankCandidateUrls(this.extractCandidateUrlsFromHtml(html, baseUrl), baseUrl)
            .slice(0, 5);

        const candidateLinks = Array.from(new Set([baseUrl, ...(rowBest ? [rowBest.url] : []), ...candidates])).slice(0, 6);
        if (candidates.length) {
            pieces.push(`Candidate Official Links: ${candidates.slice(0, 3).join(' | ')}`);
        }

        const deepUrls = Array.from(new Set([...(rowBest ? [rowBest.url] : []), ...candidates])).slice(0, 2);
        const deepParts: string[] = [];
        const dateHints: string[] = [];
        if (rowBest?.dateHints?.length) dateHints.push(...rowBest.dateHints);
        const primaryDateHints = this.extractDateHintsFromText(primaryText);
        if (primaryDateHints.length) dateHints.push(...primaryDateHints);
        for (const u of deepUrls) {
            const res = await this.fetchWithTimeout(u, 12000);
            if (!res || !res.ok) {
                deepParts.push(`Linked Source: ${u}`);
                continue;
            }
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            if (ct.includes('application/pdf') || /\.(pdf)(\?|$)/i.test(u)) {
                const buf = await res.arrayBuffer();
                const pdfText = this.extractTextFromPdf(buf);
                const pdfDateHints = this.extractDateHintsFromText(pdfText);
                if (pdfDateHints.length) dateHints.push(...pdfDateHints);
                if (pdfText) deepParts.push(`PDF Extract (${u}): ${pdfText.slice(0, 12000)}`);
                else deepParts.push(`PDF Link: ${u}`);
                continue;
            }
            if (ct.includes('text/html')) {
                const deepHtml = await res.text();
                const deepText = this.stripHtmlToText(deepHtml).slice(0, 12000);
                const deepDateHints = this.extractDateHintsFromText(deepText);
                if (deepDateHints.length) dateHints.push(...deepDateHints);
                deepParts.push(`Linked Page Text (${u}): ${deepText}`);
            } else {
                deepParts.push(`Linked Source: ${u}`);
            }
        }

        if (deepParts.length) {
            pieces.push(`Deep Extraction:\n${deepParts.join('\n\n')}`.slice(0, 20000));
        }

        const uniqueDateHints = Array.from(new Set(dateHints)).slice(0, 6);
        if (uniqueDateHints.length) {
            pieces.push(`Extracted Date Hints: ${uniqueDateHints.join(' | ')}`);
        }
        return { context: pieces.join('\n\n').slice(0, 26000), candidateLinks, dateHints: uniqueDateHints };
    }

    private isClaritySufficient(job: ParsedJob): boolean {
        const title = (job.title || '').toLowerCase().replace(/\s{2,}/g, ' ').trim();
        const info = (job.shortInfo || '').toLowerCase().replace(/\s{2,}/g, ' ').trim();
        const titleLen = title.length;
        const infoLen = info.length;
        const rawTitle = String(job.title || '');
        const genericHead = isGenericHeadTitle(rawTitle);
        const strippedTitle = stripGenericHeadPrefix(rawTitle);
        const genericHeadBad = genericHead && strippedTitle.length < 12;
        const looksLikeUrl = /https?:\/\//i.test(rawTitle) || /https?:\/\//i.test(info) || /\bwww\./i.test(rawTitle) || /\bwww\./i.test(info);
        const hasQueryNoise = /(\bkey=|utm_|ref=)/i.test(rawTitle) || /(\bkey=|utm_|ref=)/i.test(info);
        const keywords = ['ssc', 'upsc', 'railway', 'rrb', 'nhm', 'police', 'constable', 'group d', 'bank', 'ibps', 'sbi', 'rbi', 'teacher', 'engineer', 'clerk', 'apprentice',
            'uppsc','upsssc','rpsc','rsmssb','mppsc','bpsc','wbpsc','jkpsc','jpsc','mpsc','kpsc','gpsc','hpsc','hppsc','opsc','tnpsc','tspsc','appsc','ossc','hssc','uksssc','bssc','dsssb','psssb','jssc','cgpsc','mpesb'
        ];
        const hasKeyword = keywords.some(k => title.includes(k) || info.includes(k));
        const domainOk = isTrustedDomainShared(job.applyLink);
        const hasLink = !!(job.applyLink && job.applyLink.trim().length > 0);
        const actionOnly = isActionOnlyTitle(rawTitle);
        const noticeLike = /\bno\.\s*\d|\bdated\b/i.test(rawTitle) || /\bno\.\s*\d|\bdated\b/i.test(info);
        const likelyNotExam = noticeLike && !hasKeyword && !domainOk;
        const normalizedTitle = deriveReadableTitle({
            title: rawTitle,
            shortInfo: job.shortInfo,
            importantDates: (() => { try { return JSON.parse(job.importantDates || '[]'); } catch { return []; } })(),
            importantLinks: (() => { try { return JSON.parse(job.importantLinks || '[]'); } catch { return []; } })(),
            applyLink: job.applyLink
        });
        const normalizedBad = normalizedTitle.toLowerCase() === 'job notification' || /\(\s*\)/.test(normalizedTitle) || normalizedTitle.length < 16;
        return (
            !genericHeadBad &&
            !looksLikeUrl &&
            !hasQueryNoise &&
            !actionOnly &&
            !likelyNotExam &&
            !normalizedBad &&
            (titleLen >= 20 || infoLen >= 40 || hasKeyword) &&
            hasLink
        );
    }

    async run(): Promise<{ success: boolean; message: string; jobsAdded: number; debug?: any }> {
        try {
            console.log('Starting AutoAgent run...');
            const currentYear = new Date().getFullYear();

            const query = `(site:gov.in OR site:nic.in) recruitment notification ${currentYear}`;

            const { results, debug } = await this.searchSerpApi(query);

            if (results.length === 0) {
                return {
                    success: true,
                    message: `No new jobs found.`,
                    jobsAdded: 0,
                    debug
                };
            }

            // Process results
            let jobsAdded = 0;
            const uniqueResults = await this.filterExistingJobs(results);

            console.log(`Found ${uniqueResults.length} unique results to analyze.`);

            const skippedReasons: string[] = [];

            for (const result of uniqueResults) {
                console.log(`Analyzing: ${result.title}`);
                try {
                    if (!isAllowedSourceUrl(result.link, result.title, result.snippet)) {
                        skippedReasons.push(`Blocked source: ${result.title.substring(0, 40)}... from ${result.link}`);
                        continue;
                    }
                    const job = await this.analyzeWithGemini(result);
                    if (job) {
                        if (this.isClaritySufficient(job)) {
                            console.log(`Saving job: ${job.title}`);
                            await this.saveJobToDb(job);
                            jobsAdded++;
                        } else {
                            skippedReasons.push(`Unclear: ${job.title.substring(0, 40)}... from ${result.link}`);
                        }
                    } else {
                        skippedReasons.push(`Skipped: ${result.title.substring(0, 30)}... (Returned null)`);
                    }
                } catch (e) {
                    skippedReasons.push(`Error: ${result.title.substring(0, 30)}... (${e instanceof Error ? e.message : String(e)})`);
                }
            }

            return {
                success: true,
                message: `Processed ${results.length} results. Added ${jobsAdded} new jobs.`,
                jobsAdded,
                debug: {
                    ...debug,
                    uniqueResults: uniqueResults.length,
                    skippedReasons
                }
            };

        } catch (error) {
            // Log error but strict check to return JSON not crash
            console.error('AutoAgent Error:', error);
            return { success: false, message: `Error: ${(error as Error).message || error}`, jobsAdded: 0 };
        }
    }

    private async searchSerpApi(query: string): Promise<{ results: SearchResult[]; debug: any }> {
        console.log('searchSerpApi called with query:', query);

        const debug = {
            keysConfigured: {
                serpKey: !!this.env.SERP_API_KEY && !this.env.SERP_API_KEY.includes('REPLACE')
            },
            query,
            url: '',
            status: 0,
            dataSnippet: ''
        };

        if (!debug.keysConfigured.serpKey) {
            console.warn('SerpAPI Key missing or invalid.');
            return { results: [], debug: { ...debug, error: 'Missing SERP_API_KEY' } };
        }

        // SerpAPI Endpoint
        // Engine: google, google_domain: google.co.in, gl: in (India)
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${this.env.SERP_API_KEY}&num=10&google_domain=google.co.in&gl=in&tbs=qdr:w`;
        debug.url = url.replace(this.env.SERP_API_KEY, 'HIDDEN_KEY');

        console.log('Fetching SerpAPI...');
        const response = await fetch(url);
        debug.status = response.status;

        const data = await response.json() as any;
        debug.dataSnippet = JSON.stringify(data).substring(0, 500); // Capture start of response (error or items)

        console.log('SerpAPI Response status:', response.status);

        if (data.error) {
            console.error('SerpAPI Error:', JSON.stringify(data.error));
        }

        // SerpAPI returns results in 'organic_results'
        if (!data.organic_results) return { results: [], debug };

        const results = data.organic_results.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));

        return { results, debug };
    }

    private async filterExistingJobs(results: SearchResult[]): Promise<SearchResult[]> {
        const uniqueResults: SearchResult[] = [];
        for (const result of results) {
            const byLink = await this.env.DB.prepare('SELECT id FROM job_details WHERE apply_link = ?')
                .bind(result.link)
                .first();
            const byTitle = await this.env.DB.prepare('SELECT id FROM job_details WHERE title = ?')
                .bind(result.title)
                .first();
            const exists = byLink || byTitle;
            console.log(`Dedup check: title="${result.title}" link="${result.link}" exists=${!!exists}`);
            if (!exists) {
                uniqueResults.push(result);
            }
        }
        return uniqueResults;
    }

    private async analyzeWithGemini(result: SearchResult): Promise<ParsedJob | null> {
        if (!this.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in environment");
        }

        // 1. Dynamically fetch available models to avoid 404s
        let targetModel = 'gemini-1.5-flash'; // Default fallback
        try {
            const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.env.GEMINI_API_KEY}`;
            const response = await fetch(listUrl);
            if (response.ok) {
                const data = await response.json() as any;
                const models = data.models.map((m: any) => m.name.split('/')[1]);
                // Prefer Pro if available, else Flash
                if (models.includes('gemini-1.5-pro-latest')) targetModel = 'gemini-1.5-pro-latest';
                else if (models.includes('gemini-1.5-pro')) targetModel = 'gemini-1.5-pro';
                else if (models.includes('gemini-1.5-flash-latest')) targetModel = 'gemini-1.5-flash-latest';
            }
        } catch (e) {
            console.warn('Failed to fetch Gemini model list, using default:', targetModel);
        }

        // 2. Fetch Page Content + Deep Extraction (Truncated)
        let pageContext = `Snippet: ${result.snippet}`;
        let candidateLinks: string[] = [result.link];
        let dateHints: string[] = [];
        try {
            const built = await this.buildDeepContext(result.link, result.title, result.snippet);
            pageContext = built.context;
            candidateLinks = built.candidateLinks;
            dateHints = built.dateHints || [];
        } catch (err) {
            console.warn(`Failed to fetch ${result.link}, using snippet only.`);
        }

        try {
            console.log(`Trying Gemini Model: ${targetModel} for ${result.title.substring(0, 20)}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${this.env.GEMINI_API_KEY}`;

            const promptText = `
            You are an expert job data extractor.
            Task: Extract structured job details from the provided text.
            
            Source 1 (Title): ${result.title}
            Source 2 (Link): ${result.link}
            Source 3 (Content): ${pageContext}

            RULES:
            1. **DO NOT GUESS**: If exact dates/fees are missing, use "Check Notification" / "See Notification" (do not invent values).
            2. **DO NOT FAIL**: Mispelled words or partial data is OKAY. Return the best possible JSON.
            3. **Categories**: Choose matching category from [SSC, Railway, Banking, Police, Teaching, Defence, UPSC, Medical, Engineering, Other].
            
            Return ONLY a valid JSON object with this schema:
            {
                "title": "Clean Job Title",
                "category": "Category Name",
                "shortInfo": "2-3 sentences summary",
                "importantDates": ["Application Begin: DD/MM/YYYY", "Last Date: DD/MM/YYYY"], 
                "applicationFee": ["General/OBC: ₹000", "SC/ST: ₹000"],
                "ageLimit": ["Min: 18 Years", "Max: 30 Years"],
                "vacancyDetails": [{"postName": "Post Name", "totalPost": "Number", "eligibility": "Degree/10th/12th"}],
                "importantLinks": [
                    {"label": "Apply Online", "url": "${result.link}"},
                    {"label": "Official Website", "url": "Find in text or use ${result.link}"}
                ]
            }
            `;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error (${targetModel}) ${response.status}: ${errorText}`);
            }

            const data: any = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawText) throw new Error("Empty response from Gemini");

            const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);

            // Normalize fields to ensure strings for DB
            const sanitizeUrl = (u: string) => {
                const cleaned = (u || '').replace(/`/g, '').trim();
                if (!cleaned) return '';
                if (cleaned.startsWith('https://') || cleaned.startsWith('http://')) return cleaned;
                return '';
            };
            const links = Array.isArray(parsed.importantLinks)
                ? parsed.importantLinks.map((l: any) => ({
                    label: String(l.label || 'Link'),
                    url: sanitizeUrl(String(l.url || '')) || sanitizeUrl(result.link)
                }))
                : [{ label: "Apply Link", url: sanitizeUrl(result.link) }];
            let importantDatesArr = Array.isArray(parsed.importantDates)
                ? parsed.importantDates.map((d: any) => String(d))
                : ["Check Notification"];
            if (dateHints.length) {
                const isGeneric = importantDatesArr.length === 0 || importantDatesArr.some(d => /check notification|see notification/i.test(String(d)));
                if (isGeneric) {
                    importantDatesArr = dateHints;
                } else {
                    const merged = Array.from(new Set([...importantDatesArr, ...dateHints])).slice(0, 8);
                    importantDatesArr = merged;
                }
            }
            const derivedTitle = deriveReadableTitle({
                title: String(parsed.title || result.title || ''),
                shortInfo: String(parsed.shortInfo || result.snippet || ''),
                importantDates: importantDatesArr,
                importantLinks: links,
                applyLink: sanitizeUrl(result.link)
            });
            const inferredApplyLink =
                links.find(l => /apply|registration|online\s*form/i.test(l.label) || /apply|registration/i.test(l.url))?.url ||
                links.find(l => isTrustedDomainShared(l.url))?.url ||
                sanitizeUrl(result.link);
            return {
                title: derivedTitle,
                category: parsed.category || 'Other',
                shortInfo: parsed.shortInfo || result.snippet,
                importantDates: JSON.stringify(importantDatesArr),
                applicationFee: JSON.stringify(parsed.applicationFee || ["See Notification"]),
                ageLimit: JSON.stringify(parsed.ageLimit || ["See Notification"]),
                vacancyDetails: JSON.stringify(parsed.vacancyDetails || []),
                importantLinks: JSON.stringify(links),
                applyLink: inferredApplyLink
            };

        } catch (e) {
            console.warn(`Gemini Failed for ${result.title}. Using SMART FALLBACK. Error: ${e}`);

            // === SMART FALLBACK (Regex Extraction) ===
            const snippet = result.snippet || "";
            const currentYear = new Date().getFullYear();

            // Extract Dates (DD/MM/YYYY or DD-MM-YYYY)
            const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g;
            const datesFound = snippet.match(dateRegex) || [];
            const importantDates = datesFound.length > 0
                ? datesFound.map(d => `Date: ${d}`)
                : [`Expected: ${currentYear}`];

            // Extract Fees (₹ followed by digits)
            const feeRegex = /(₹\s?\d+)/g;
            const feesFound = snippet.match(feeRegex) || [];
            const applicationFee = feesFound.length > 0
                ? feesFound.map(f => `Fee: ${f}`)
                : ["See Notification"];

            const ageMinMatch = snippet.match(/(?:Min(?:imum)?\s*Age)\s*[:\-]?\s*(\d{1,2})/i);
            const ageMaxMatch = snippet.match(/(?:Max(?:imum)?\s*Age)\s*[:\-]?\s*(\d{1,2})/i);
            const ageLimitArr: string[] = [];
            if (ageMinMatch) ageLimitArr.push(`Minimum Age: ${ageMinMatch[1]} Years`);
            if (ageMaxMatch) ageLimitArr.push(`Maximum Age: ${ageMaxMatch[1]} Years`);
            if (ageLimitArr.length === 0) ageLimitArr.push("As per rules");

            const postName =
                (snippet.match(/(?:post(?:s)?\s+of|recruitment\s+for|engagement\s+of|for\s+the\s+post\s+of)\s+([A-Za-z][A-Za-z\s\-\/&]+)/i)?.[1] || '')
                    .trim() ||
                (snippet.match(/\b(Jeep Driver|Driver|Clerk|Officer|Assistant|Engineer|Teacher|Nurse|Police|Constable|Inspector|Stenographer|Typist|Analyst|Apprentice|Junior|Senior)\b/i)?.[0] || 'Various Posts');
            const totalPost =
                (snippet.match(/total\s*posts?\s*[:\-]?\s*(\d{1,4})/i)?.[1] ||
                 snippet.match(/\b(\d{1,4})\s+posts?\b/i)?.[1] || 'N/A');
            const eligibilityKeywords = [
                '10th', '12th', 'Matric', 'Intermediate', 'Graduate', 'Bachelor', 'Diploma', 'ITI',
                'BTech', 'MTech', 'B.Sc', 'M.Sc', 'MBA', 'CA', 'LLB', 'BE', 'ME'
            ];
            const foundEligibility = eligibilityKeywords.filter(k => new RegExp(k.replace('.', '\\.'), 'i').test(snippet));
            const eligibility = foundEligibility.length > 0 ? foundEligibility.join(' / ') : 'See Details';
            const vacancyDetails = [{ postName, totalPost, eligibility }];

            const fallbackLinks = Array.from(new Set([
                ...candidateLinks.filter(u => !!u).slice(0, 3),
                result.link
            ])).map((u, idx) => ({ label: idx === 0 ? "Official Link" : "Source Link", url: u }));
            const fallbackTitle = deriveReadableTitle({
                title: String(result.title || ''),
                shortInfo: String(snippet || ''),
                importantDates,
                importantLinks: fallbackLinks,
                applyLink: String(result.link || '')
            });
            return {
                title: fallbackTitle,
                category: 'Other',
                shortInfo: snippet.length > 50 ? snippet : `${result.title} - Click to read more.`,
                importantDates: JSON.stringify(importantDates),
                applicationFee: JSON.stringify(applicationFee),
                ageLimit: JSON.stringify(ageLimitArr),
                vacancyDetails: JSON.stringify(vacancyDetails),
                importantLinks: JSON.stringify(fallbackLinks),
                applyLink: fallbackLinks.find(l => /Official/i.test(l.label))?.url || result.link
            };
        }
    }

    private async fetchPageContent(url: string): Promise<string | null> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8'
                },
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) return null;
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            if (contentType.includes('application/pdf')) return null;

            const html = await response.text();
            return this.stripHtmlToText(html);
        } catch (e) {
            return null;
        }
    }

    private async saveJobToDb(job: ParsedJob) {
        const dateStr = job.importantDates;

        const existingPost = await this.env.DB.prepare('SELECT id FROM job_posts WHERE apply_link = ?')
            .bind(job.applyLink)
            .first();
        if (!existingPost) {
            await this.env.DB.prepare(`
                INSERT INTO job_posts (title, category, short_info, important_dates, apply_link)
                VALUES (?, ?, ?, ?, ?)
            `).bind(job.title, job.category, job.shortInfo, dateStr, job.applyLink).run();
        }

        const id = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

        await this.env.DB.prepare(`
             INSERT INTO job_details (
                id, title, category, post_date, short_info, 
                important_dates, application_fee, age_limit, 
                vacancy_details, important_links, apply_link, is_active
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).bind(
            id,
            job.title,
            job.category,
            new Date().toLocaleDateString(),
            job.shortInfo,
            job.importantDates,   // Now stored as proper JSON string
            job.applicationFee,   // New
            job.ageLimit,         // New
            job.vacancyDetails,   // New
            job.importantLinks,   // New
            job.applyLink
        ).run();

        try {
            const host = new URL(job.applyLink).hostname;
            await this.env.DB.prepare(`UPDATE job_details SET source_url = ?, source_domain = ?, updated_at = datetime('now') WHERE id = ?`)
                .bind(job.applyLink, host, id)
                .run();
        } catch {}

        try {
            await this.env.DB.prepare(`UPDATE job_details SET created_by = ?, quality_score = ?, updated_at = datetime('now') WHERE id = ?`)
                .bind('agent', 100, id)
                .run();
        } catch {}
    }
}

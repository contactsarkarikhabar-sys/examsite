import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Priority domains for authentic info
    private readonly TRUSTED_SITES = [
        'ssc.gov.in', 'upsc.gov.in', 'indianrailways.gov.in', 'ibps.in',
        'rbi.org.in', 'drdo.gov.in', 'isro.gov.in', 'joinindianarmy.nic.in',
        'joinindiannavy.gov.in', 'agnipathvayu.cdac.in'
    ];

    constructor(env: Env) {
        this.env = env;
    }

    async run(): Promise<{ success: boolean; message: string; jobsAdded: number; debug?: any }> {
        try {
            console.log('Starting AutoAgent run...');
            const currentYear = new Date().getFullYear();

            // Strategy: Specific query for official government notifications
            const query = `site:gov.in recruitment notification ${currentYear}`;

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
                    const job = await this.analyzeWithGemini(result);
                    if (job) {
                        console.log(`Saving job: ${job.title}`);
                        await this.saveJobToDb(job);
                        jobsAdded++;
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
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${this.env.SERP_API_KEY}&num=5&google_domain=google.co.in&gl=in`;
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
        const uniqueResults = [];
        for (const result of results) {
            let exists: any = null;
            try {
                exists = await this.env.DB.prepare('SELECT id FROM job_details WHERE apply_link = ?')
                    .bind(result.link)
                    .first();
            } catch (e) {
                exists = await this.env.DB.prepare('SELECT id FROM job_posts WHERE apply_link = ?')
                    .bind(result.link)
                    .first();
            }
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

        // 2. Fetch Page Content (Truncated)
        let pageContext = `Snippet: ${result.snippet}`;
        try {
            // console.log(`Fetching content for: ${result.link}`);
            const pageContent = await this.fetchPageContent(result.link);
            if (pageContent) {
                pageContext = `Full Page Content (Truncated to 10k chars): ${pageContent.slice(0, 10000)}`;
            }
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
            1. **EXTRACT ANYTHING**: If exact dates/fees are missing, INFER them from context or use "Check Notification".
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
            return {
                title: parsed.title || result.title,
                category: parsed.category || 'Other',
                shortInfo: parsed.shortInfo || result.snippet,
                importantDates: JSON.stringify(parsed.importantDates || ["Check Notification"]),
                applicationFee: JSON.stringify(parsed.applicationFee || ["See Notification"]),
                ageLimit: JSON.stringify(parsed.ageLimit || ["See Notification"]),
                vacancyDetails: JSON.stringify(parsed.vacancyDetails || []),
                importantLinks: JSON.stringify(parsed.importantLinks || [{ label: "Apply Link", url: result.link }]),
                applyLink: result.link
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

            return {
                title: result.title,
                category: 'Other',
                shortInfo: snippet.length > 50 ? snippet : `${result.title} - Click to read more.`,
                importantDates: JSON.stringify(importantDates),
                applicationFee: JSON.stringify(applicationFee),
                ageLimit: JSON.stringify(["As per rules"]),
                vacancyDetails: JSON.stringify([{ postName: "Various Posts", totalPost: "N/A", eligibility: "See Details" }]),
                importantLinks: JSON.stringify([{ label: "Source Link", url: result.link }]),
                applyLink: result.link
            };
        }
    }

    private async fetchPageContent(url: string): Promise<string | null> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) return null;

            const html = await response.text();
            // Simple strip tags to get text content
            return html.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "")
                .replace(/<style[^>]*>([\S\s]*?)<\/style>/gmi, "")
                .replace(/<[^>]+>/g, "\n")
                .replace(/\s+/g, " ")
                .trim();
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
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
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
    }
}

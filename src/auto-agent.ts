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
            const query = `site:gov.in recruitment notification 2026`;

            const { results, debug } = await this.searchSerpApi(query);

            const debugInfo = {
                ...debug,
                apiKeys: {
                    serp: !!this.env.SERP_API_KEY,
                    gemini: !!this.env.GEMINI_API_KEY
                },
                skippedReasons: [] as string[]
            };

            if (results.length === 0) {
                return {
                    success: true,
                    message: `No new jobs found.`,
                    jobsAdded: 0,
                    debug: debugInfo
                };
            }

            // Process results
            let jobsAdded = 0;
            const uniqueResults = await this.filterExistingJobs(results);

            console.log(`Found ${uniqueResults.length} unique results to analyze.`);

            for (const result of uniqueResults) {
                console.log(`Analyzing: ${result.title}`);
                try {
                    const job = await this.analyzeWithGemini(result);
                    if (job) {
                        console.log(`Saving job: ${job.title}`);
                        await this.saveJobToDb(job);
                        jobsAdded++;
                    } else {
                        debugInfo.skippedReasons.push(`Skipped: ${result.title.substring(0, 30)}... (Returned null, reason unknown)`);
                    }
                } catch (e) {
                    debugInfo.skippedReasons.push(`Error: ${result.title.substring(0, 30)}... (${e instanceof Error ? e.message : String(e)})`);
                }
            }

            return {
                success: true,
                message: `Processed ${results.length} results. Added ${jobsAdded} new jobs.`,
                jobsAdded,
                debug: debugInfo
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
            // Check if link exists in DB
            const existing = await this.env.DB.prepare('SELECT id FROM job_posts WHERE apply_link = ?')
                .bind(result.link)
                .first();

            if (!existing) {
                uniqueResults.push(result);
            }
        }
        return uniqueResults;
    }

    private async analyzeWithGemini(result: SearchResult): Promise<ParsedJob | null> {
        if (!this.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in environment");
        }

        const genAI = new GoogleGenerativeAI(this.env.GEMINI_API_KEY);

        // 1. Deep Fetch: Try to get actual page content
        let pageContext = `Snippet: ${result.snippet}`;
        try {
            console.log(`Fetching content for: ${result.link}`);
            const pageContent = await this.fetchPageContent(result.link);
            if (pageContent) {
                // Truncate to avoid excessive tokens (approx 15k chars is safe for Flash model)
                pageContext = `Full Page Content (Truncated): ${pageContent.slice(0, 15000)}`;
            }
        } catch (err) {
            console.warn(`Failed to fetch ${result.link}, using snippet only.`);
        }

        // try { <--- Removed try/catch
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const prompt = `
            Analyze this job notification to extract structured data.
            
            Source-1: Title: ${result.title}
            Link: ${result.link}
            Source-2: ${pageContext}

            STRICTLY FOLLOW THESE RULES:
            1. **Extraction Goal**: Extract whatever information is available. If specific details (like Fee/Dates) are missing, use "Check Notification" or "N/A".
            2. **Do NOT return null**: Always try to return a JSON object, even if data is sparse.
            
            Return a JSON object with this exact schema:
            {
                "title": "Clean Job Title (e.g., SSC CGL 2025 Notification)",
                "category": "One of [SSC, Railway, Banking, Police, Teaching, Defence, UPSC, Other]",
                "shortInfo": "A detailed 2-3 line summary. If missing, summarize the title.",
                "importantDates": ["Application Begin: Available Soon", "Last Date: Check Notification"], 
                "applicationFee": ["See Notification"],
                "ageLimit": ["See Notification"],
                "vacancyDetails": [{"postName": "Various Posts", "totalPost": "See Notification", "eligibility": "See Notification"}],
                "importantLinks": [
                    {"label": "Apply Online", "url": "${result.link}"},
                     {"label": "Official Website", "url": "Extract from text if available"}
                ]
            }

            Output strictly JSON.
            `;

        const resultGen = await model.generateContent(prompt);
        const response = await resultGen.response;
        const text = response.text();

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        if (cleanText === 'null' || cleanText.toLowerCase() === 'null') {
            // Fallback: If Gemini still returns null, create a basic entry from snippet
            const fallbackJob = {
                title: result.title,
                category: 'Other',
                shortInfo: result.snippet,
                importantDates: JSON.stringify([]),
                applicationFee: JSON.stringify([]),
                ageLimit: JSON.stringify([]),
                vacancyDetails: JSON.stringify([]),
                importantLinks: JSON.stringify([{ label: 'Source Link', url: result.link }]),
                applyLink: result.link
            };
            // Log fallback usage as error to see it in debug
            throw new Error(`Gemini returned '${cleanText}', using fallback (simulated)`);
        }

        const data = JSON.parse(cleanText);

        if (!data.title) throw new Error("Gemini returned JSON without title");

        // Normalize fields to ensure they are strings for the simple DB columns, 
        // but for 'job_details' we can store rich JSON.
        return {
            title: data.title,
            category: data.category || 'Other',
            shortInfo: data.shortInfo || result.snippet,
            importantDates: JSON.stringify(data.importantDates || []),
            applicationFee: JSON.stringify(data.applicationFee || []),
            ageLimit: JSON.stringify(data.ageLimit || []),
            vacancyDetails: JSON.stringify(data.vacancyDetails || []),
            importantLinks: JSON.stringify(data.importantLinks || []),
            applyLink: data.importantLinks?.find((l: any) => l.label.includes('Apply'))?.url || result.link
        };

        /* } catch (e) {
            console.error("Gemini Parse Error", e);
            return null;
        } */
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
        // 1. Insert into job_posts
        // Convert JSON string back to array-string for job_posts table (legacy compatibility if needed)
        // Or just use the string directly if schema supports text.
        // Assuming job_posts.important_dates is TEXT.
        const dateStr = job.importantDates;

        await this.env.DB.prepare(`
            INSERT INTO job_posts (title, category, short_info, important_dates, apply_link)
            VALUES (?, ?, ?, ?, ?)
        `).bind(job.title, job.category, job.shortInfo, dateStr, job.applyLink).run();

        // 2. Insert into job_details
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

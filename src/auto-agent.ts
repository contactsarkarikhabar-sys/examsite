import { GoogleGenerativeAI } from '@google/genai';

interface Env {
    DB: D1Database;
    GOOGLE_SEARCH_API_KEY: string;
    GOOGLE_SEARCH_CX: string;
    GEMINI_API_KEY: string;
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

    async run(): Promise<{ success: boolean; message: string; jobsAdded: number }> {
        try {
            console.log('Starting AutoAgent run...');
            let totalJobsAdded = 0;
            const currentYear = new Date().getFullYear();

            // Strategy: Run specific targeted queries for better quality
            const queries = [
                `site:gov.in "recruitment" "notification" "${currentYear}" apply online`, // General Govt
                `site:ssc.gov.in OR site:upsc.gov.in "notification" "${currentYear}"`,   // Top Commissions
                `"railway recruitment board" "notification" "${currentYear}" site:gov.in` // Railways
            ];

            // Normalize results map to avoid duplicates across queries
            const allResults = new Map<string, SearchResult>();

            for (const q of queries) {
                const results = await this.searchGoogle(q);
                results.forEach(r => allResults.set(r.link, r));
            }

            const uniqueResults = Array.from(allResults.values());

            if (uniqueResults.length === 0) {
                return { success: true, message: 'No new jobs found from search.', jobsAdded: 0 };
            }

            // Filter out already existing links
            const newResults = await this.filterExistingJobs(uniqueResults);

            if (newResults.length === 0) {
                return { success: true, message: 'All found jobs already exist.', jobsAdded: 0 };
            }

            // Process with Gemini (Apply limit to manage tokens)
            for (const result of newResults.slice(0, 5)) {
                const jobData = await this.analyzeWithGemini(result);
                if (jobData) {
                    await this.saveJobToDb(jobData);
                    totalJobsAdded++;
                }
            }

            return { success: true, message: `Agent run complete. Added ${totalJobsAdded} jobs.`, jobsAdded: totalJobsAdded };

        } catch (error) {
            console.error('AutoAgent Error:', error);
            return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`, jobsAdded: 0 };
        }
    }

    private async searchGoogle(query: string): Promise<SearchResult[]> {
        if (!this.env.GOOGLE_SEARCH_API_KEY || !this.env.GOOGLE_SEARCH_CX || this.env.GOOGLE_SEARCH_API_KEY.includes('REPLACE')) {
            console.warn('Google Search API Key missing or invalid.');
            return [];
        }

        const url = `https://www.googleapis.com/customsearch/v1?key=${this.env.GOOGLE_SEARCH_API_KEY}&cx=${this.env.GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}&num=5&dateRestrict=d2`; // Last 2 days

        const response = await fetch(url);
        const data = await response.json() as any;

        if (!data.items) return [];

        return data.items.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));
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
        if (!this.env.GEMINI_API_KEY) return null;

        const genAI = new GoogleGenerativeAI(this.env.GEMINI_API_KEY);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
            Analyze this job search result to extract unstructured job data into JSON.
            
            Title: ${result.title}
            Snippet: ${result.snippet}
            Link: ${result.link}

            STRICTLY FOLLOW THESE RULES:
            - Only extract if this is a verifiable Government Job Notification.
            - If it looks like a private coaching ad or generic news spam, return null.
            
            Return a JSON object with:
            - title: A clean, professional job title (e.g., "SSC CGL 2024 Notification").
            - category: One of [SSC, Railway, Banking, Police, Teaching, Defence, UPSC, Other].
            - shortInfo: A 2-line professional summary.
            - importantDates: specific dates mentioned.
            - applyLink: Use the provided link.

            Output strictly JSON.
            `;

            const resultGen = await model.generateContent(prompt);
            const response = await resultGen.response;
            const text = response.text();

            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            if (cleanText === 'null') return null;

            const data = JSON.parse(cleanText);

            if (!data.title || !data.category) return null;

            return {
                title: data.title,
                category: data.category,
                shortInfo: data.shortInfo || result.snippet,
                importantDates: data.importantDates || "See Notification",
                applyLink: data.applyLink || result.link
            };

        } catch (e) {
            console.error("Gemini Parse Error", e);
            return null;
        }
    }

    private async saveJobToDb(job: ParsedJob) {
        // 1. Insert into job_posts
        const dateStr = JSON.stringify([job.importantDates]);

        await this.env.DB.prepare(`
            INSERT INTO job_posts (title, category, short_info, important_dates, apply_link)
            VALUES (?, ?, ?, ?, ?)
        `).bind(job.title, job.category, job.shortInfo, dateStr, job.applyLink).run();

        // 2. Insert into job_details
        const id = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

        await this.env.DB.prepare(`
             INSERT INTO job_details (id, title, category, post_date, short_info, important_dates, apply_link, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(
            id,
            job.title,
            job.category,
            new Date().toLocaleDateString(),
            job.shortInfo,
            dateStr,
            job.applyLink
        ).run();
    }
}

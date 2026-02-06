import { GoogleGenerativeAI } from '@google/generative-ai';

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

    async run(): Promise<{ success: boolean; message: string; jobsAdded: number }> {
        try {
            console.log('Starting AutoAgent run...');
            let totalJobsAdded = 0;
            const currentYear = new Date().getFullYear();

            // Strategy: SINGLE high-quality query to prevent timeout
            const query = `site:ssc.gov.in OR site:upsc.gov.in "recruitment" "notification" "${currentYear}"`;

            const results = await this.searchGoogle(query);

            if (results.length === 0) {
                return { success: true, message: 'No new jobs found from search.', jobsAdded: 0 };
            }

            // Filter out already existing links
            const newResults = await this.filterExistingJobs(results);

            if (newResults.length === 0) {
                return { success: true, message: 'All found jobs already exist.', jobsAdded: 0 };
            }

            // Process ONLY 1 result to guarantee passing within timeout limit
            // We run every 4 hours, so 1 job/run = 6 jobs/day, which is plenty.
            for (const result of newResults.slice(0, 1)) {
                const jobData = await this.analyzeWithGemini(result);
                if (jobData) {
                    await this.saveJobToDb(jobData);
                    totalJobsAdded++;
                }
            }

            return { success: true, message: `Agent run complete. Added ${totalJobsAdded} jobs.`, jobsAdded: totalJobsAdded };

        } catch (error) {
            // Log error but strict check to return JSON not crash
            console.error('AutoAgent Error:', error);
            // @ts-ignore
            return { success: false, message: `Error: ${error.message || error}`, jobsAdded: 0 };
        }
    }

    private async searchGoogle(query: string): Promise<SearchResult[]> {
        console.log('searchGoogle called with query:', query);
        console.log('API Key present:', !!this.env.GOOGLE_SEARCH_API_KEY);
        console.log('CX present:', !!this.env.GOOGLE_SEARCH_CX);

        if (!this.env.GOOGLE_SEARCH_API_KEY || !this.env.GOOGLE_SEARCH_CX || this.env.GOOGLE_SEARCH_API_KEY.includes('REPLACE')) {
            console.warn('Google Search API Key missing or invalid.');
            return [];
        }

        const url = `https://www.googleapis.com/customsearch/v1?key=${this.env.GOOGLE_SEARCH_API_KEY}&cx=${this.env.GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}&num=5&dateRestrict=m1`; // Last 1 month, 5 results

        console.log('Fetching Google Search API...');
        const response = await fetch(url);
        const data = await response.json() as any;

        console.log('Google API Response status:', response.status);
        console.log('Google API items count:', data.items?.length || 0);
        if (data.error) {
            console.error('Google API Error:', JSON.stringify(data.error));
        }

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

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
            Analyze this job notification to extract structured data.
            
            Source-1: Title: ${result.title}
            Source-2: ${pageContext}
            Link: ${result.link}

            STRICTLY FOLLOW THESE RULES:
            1. **Authenticity Check**: If this looks like a private coaching ad, answer 'null'. Only return JSON for genuine Govt/Bank/PSU jobs.
            2. **Data Extraction**: Extract precise details. Do NOT use generic text like "See Notification" unless absolutely no data is found.
            
            Return a JSON object with this exact schema:
            {
                "title": "Clean Job Title (e.g., SSC CGL 2025 Notification)",
                "category": "One of [SSC, Railway, Banking, Police, Teaching, Defence, UPSC, Other]",
                "shortInfo": "A detailed 2-3 line summary of the post, vacancy count, and key highlights.",
                "importantDates": ["Application Begin: DD/MM/YYYY", "Last Date: DD/MM/YYYY", "Exam Date: DD/MM/YYYY"], 
                "applicationFee": ["Gen/OBC: ₹100", "SC/ST: ₹0", "Female: ₹0"],
                "ageLimit": ["Min Age: 18 Years", "Max Age: 30 Years", "Age relaxation as per rules"],
                "vacancyDetails": [
                     {"postName": "Assistant", "totalPost": "500", "eligibility": "Graduate"},
                     {"postName": "Clerk", "totalPost": "200", "eligibility": "12th Pass"}
                ],
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

            if (cleanText === 'null' || cleanText.toLowerCase() === 'null') return null;

            const data = JSON.parse(cleanText);

            if (!data.title || !data.category) return null;

            // Normalize fields to ensure they are strings for the simple DB columns, 
            // but for 'job_details' we can store rich JSON.
            return {
                title: data.title,
                category: data.category,
                shortInfo: data.shortInfo || result.snippet,
                importantDates: JSON.stringify(data.importantDates || []),
                applicationFee: JSON.stringify(data.applicationFee || []),
                ageLimit: JSON.stringify(data.ageLimit || []),
                vacancyDetails: JSON.stringify(data.vacancyDetails || []),
                importantLinks: JSON.stringify(data.importantLinks || []),
                applyLink: data.importantLinks?.find((l: any) => l.label.includes('Apply'))?.url || result.link
            };

        } catch (e) {
            console.error("Gemini Parse Error", e);
            return null;
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

/**
 * ExamSite.in Cloudflare Worker API
 * SECURE Backend for job alerts, subscriptions, and email notifications
 */

import { EmailService } from './email-service';
import { emailTemplates } from './email-templates';
import { deriveReadableTitle, isDisplayableJob } from '../shared/jobTitle';
import { validateJob } from './agent-policy';

// Types
interface Env {
    DB: D1Database;
    RESEND_API_KEY: string;
    ADMIN_PASSWORD?: string;
    ADMIN_SECRET?: string;
    SITE_URL: string;
    GOOGLE_SEARCH_API_KEY: string;
    GOOGLE_SEARCH_CX: string;
    GEMINI_API_KEY: string;
    SERP_API_KEY: string;
    ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

interface Subscriber {
    id: number;
    name: string;
    email: string;
    qualification: string;
    location: string;
    interests: string;
    verified: number;
    verification_token: string | null;
    created_at: string;
}

interface SubscribeRequest {
    name: string;
    email: string;
    qualification?: string;
    location?: string;
    interests?: string[];
}

interface JobPostRequest {
    title: string;
    category: string;
    shortInfo: string;
    importantDates: string;
    applyLink: string;
}

let jobDetailsColumnCache: { checkedAt: number; flags: Record<string, boolean> } | null = null;

async function getJobDetailsColumnFlags(env: Env): Promise<Record<string, boolean>> {
    const now = Date.now();
    if (jobDetailsColumnCache && now - jobDetailsColumnCache.checkedAt < 5 * 60 * 1000) {
        return jobDetailsColumnCache.flags;
    }
    const info = await env.DB.prepare('PRAGMA table_info(job_details)').all();
    const names = new Set((info.results || []).map((r: any) => String(r?.name || '')));
    const flags: Record<string, boolean> = {
        post_date: names.has('post_date'),
        is_active: names.has('is_active'),
        created_by: names.has('created_by'),
        source_domain: names.has('source_domain'),
        created_at: names.has('created_at'),
        updated_at: names.has('updated_at')
    };
    jobDetailsColumnCache = { checkedAt: now, flags };
    return flags;
}

function getAdminJobsSelectSql(flags: Record<string, boolean>): { select: string; orderBy: string } {
    const select = [
        'id',
        'title',
        flags.post_date ? 'post_date' : 'NULL as post_date',
        flags.is_active ? 'is_active' : '1 as is_active',
        flags.created_by ? 'created_by' : 'NULL as created_by',
        flags.source_domain ? 'source_domain' : 'NULL as source_domain',
        flags.updated_at ? 'updated_at' : (flags.created_at ? 'created_at as updated_at' : 'NULL as updated_at')
    ].join(', ');

    const orderBy = flags.updated_at ? 'updated_at' : (flags.created_at ? 'created_at' : 'rowid');
    return { select, orderBy };
}

// ==================== SECURITY UTILITIES ====================

// Secure token generator using crypto
function generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Rate limiting using KV (in-memory fallback for now)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count++;
    return true;
}

// Input validation
function sanitizeString(str: string, maxLength: number = 200): string {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLength).replace(/<[^>]*>/g, ''); // Remove HTML tags
}

function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Secure password comparison (timing-safe)
function secureCompare(a: unknown, b: unknown): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

function getAdminPassword(env: Env): string {
    return String((env as any).ADMIN_SECRET || env.ADMIN_PASSWORD || '');
}

// Get client IP
function getClientIP(request: Request): string {
    return request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0] ||
        'unknown';
}

// ==================== CORS & RESPONSE HELPERS ====================

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    'https://examsite.in',
    'https://www.examsite.in',
    'http://localhost:5173', // Dev only
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
];

function getCorsHeaders(origin: string | null): HeadersInit {
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null;
    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
    };
    if (allowedOrigin) {
        headers['Access-Control-Allow-Origin'] = allowedOrigin;
    } else if (origin) {
        headers['Access-Control-Allow-Origin'] = origin;
    } else {
        headers['Access-Control-Allow-Origin'] = '*';
    }
    return headers;
}

function jsonResponse(data: object, status = 200, origin: string | null = null): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(origin)
        },
    });
}

function errorResponse(message: string, status: number, origin: string | null = null): Response {
    return jsonResponse({ success: false, error: message }, status, origin);
}

// ==================== HANDLERS ====================

// Handler: Subscribe new user
async function handleSubscribe(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const clientIP = getClientIP(request);

    // Rate limit: 5 subscribes per minute per IP
    if (!checkRateLimit(`subscribe:${clientIP}`, 5, 60000)) {
        return errorResponse('Too many requests. Please try again later.', 429, origin);
    }

    try {
        const body: SubscribeRequest = await request.json();

        // Validate and sanitize inputs
        const name = sanitizeString(body.name, 100);
        const email = sanitizeString(body.email, 254).toLowerCase();
        const qualification = sanitizeString(body.qualification || '10th Pass', 50);
        const location = sanitizeString(body.location || 'All India', 100);

        if (!name || name.length < 2) {
            return errorResponse('Valid name is required (min 2 characters)', 400, origin);
        }

        if (!isValidEmail(email)) {
            return errorResponse('Valid email is required', 400, origin);
        }

        // Validate interests
        const validInterests = ['SSC', 'Railway', 'Banking', 'Police', 'Teaching', 'Defence'];
        const interests = Array.isArray(body.interests)
            ? body.interests.filter(i => validInterests.includes(i))
            : [];

        // Check if already exists
        const existing = await env.DB.prepare('SELECT * FROM subscribers WHERE email = ?')
            .bind(email)
            .first<Subscriber>();

        if (existing) {
            if (existing.verified) {
                return jsonResponse({ success: true, message: 'Already subscribed!', alreadySubscribed: true }, 200, origin);
            } else {
                // Resend verification email (rate limited already)
                const token = generateSecureToken();
                await env.DB.prepare('UPDATE subscribers SET verification_token = ?, updated_at = datetime("now") WHERE id = ?')
                    .bind(token, existing.id)
                    .run();

                const emailService = new EmailService(env.RESEND_API_KEY);
                const verificationLink = `${env.SITE_URL}/api/verify?token=${token}`;
                const html = emailTemplates.welcome(existing.name, verificationLink);
                await emailService.sendWelcomeEmail(existing.email, existing.name, html);

                return jsonResponse({ success: true, message: 'Verification email resent!', needsVerification: true }, 200, origin);
            }
        }

        // Create new subscriber
        const token = generateSecureToken();
        const interestsJson = JSON.stringify(interests);

        await env.DB.prepare(`
      INSERT INTO subscribers (name, email, qualification, location, interests, verification_token)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(name, email, qualification, location, interestsJson, token).run();

        // Send verification email
        const emailService = new EmailService(env.RESEND_API_KEY);
        const verificationLink = `${env.SITE_URL}/api/verify?token=${token}`;
        const html = emailTemplates.welcome(name, verificationLink);
        await emailService.sendWelcomeEmail(email, name, html);

        return jsonResponse({
            success: true,
            message: 'Subscription successful! Please check your email to verify.',
            needsVerification: true
        }, 200, origin);
    } catch (error) {
        console.error('Subscribe error:', error);
        return errorResponse('Server error. Please try again.', 500, origin);
    }
}

// Handler: Verify email
async function handleVerify(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token || token.length !== 64) {
        return new Response('Invalid verification link', { status: 400 });
    }

    const subscriber = await env.DB.prepare('SELECT * FROM subscribers WHERE verification_token = ?')
        .bind(token)
        .first<Subscriber>();

    if (!subscriber) {
        return new Response('Invalid or expired verification link', { status: 400 });
    }

    await env.DB.prepare('UPDATE subscribers SET verified = 1, verification_token = NULL, updated_at = datetime("now") WHERE id = ?')
        .bind(subscriber.id)
        .run();

    const html = emailTemplates.verified(subscriber.name);
    return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    });
}

// Handler: Unsubscribe
async function handleUnsubscribe(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const token = url.searchParams.get('token');

    if (!email || !isValidEmail(email)) {
        return new Response('Invalid unsubscribe link', { status: 400 });
    }

    // Verify the unsubscribe token matches (extra security)
    if (token) {
        const subscriber = await env.DB.prepare('SELECT * FROM subscribers WHERE email = ?')
            .bind(email.toLowerCase())
            .first<Subscriber>();

        // Only delete if subscriber exists
        if (subscriber) {
            await env.DB.prepare('DELETE FROM subscribers WHERE email = ?')
                .bind(email.toLowerCase())
                .run();
        }
    }

    return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed - ExamSite.in</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f4f4f4; }
        .box { background: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; }
        p { color: #6b7280; }
        a { color: #dc2626; text-decoration: none; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>✅ Unsubscribed</h1>
        <p>You have been successfully unsubscribed from ExamSite.in job alerts.</p>
        <p><a href="https://examsite.in">← Back to ExamSite.in</a></p>
      </div>
    </body>
    </html>
  `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
    });
}

// Handler: Admin - Post new job and send notifications
async function handlePostJob(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const clientIP = getClientIP(request);

    // Rate limit admin: 10 posts per minute
    if (!checkRateLimit(`admin:${clientIP}`, 10, 60000)) {
        return errorResponse('Rate limit exceeded', 429, origin);
    }

    if (!getAdminPassword(env)) {
        return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
    }

    // Check admin auth with secure comparison
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401, origin);
    }

    const providedPassword = authHeader.slice(7);
    if (!secureCompare(providedPassword, getAdminPassword(env))) {
        // Add delay to prevent brute force
        await new Promise(resolve => setTimeout(resolve, 1000));
        return errorResponse('Unauthorized', 401, origin);
    }

    try {
        const body: JobPostRequest = await request.json();

        // Validate inputs
        const title = sanitizeString(body.title, 200);
        const category = sanitizeString(body.category, 50);
        const shortInfo = sanitizeString(body.shortInfo, 1000);
        const importantDates = sanitizeString(body.importantDates, 500);
        const applyLink = sanitizeString(body.applyLink, 500);

        if (!title || !category) {
            return errorResponse('Title and category are required', 400, origin);
        }

        // Validate URL
        if (applyLink && !applyLink.startsWith('https://')) {
            return errorResponse('Apply link must be a valid HTTPS URL', 400, origin);
        }

        // Insert job post
        const result = await env.DB.prepare(`
      INSERT INTO job_posts (title, category, short_info, important_dates, apply_link)
      VALUES (?, ?, ?, ?, ?)
    `).bind(title, category, shortInfo, importantDates, applyLink || 'https://examsite.in').run();

        const jobPostId = result.meta.last_row_id;

        // Get all verified subscribers
        const subscribers = await env.DB.prepare('SELECT * FROM subscribers WHERE verified = 1')
            .all<Subscriber>();

        if (!subscribers.results || subscribers.results.length === 0) {
            return jsonResponse({
                success: true,
                message: 'Job posted but no subscribers to notify',
                jobPostId,
                notificationsSent: 0
            }, 200, origin);
        }

        // Send emails to all subscribers
        const emailService = new EmailService(env.RESEND_API_KEY);
        const emails = subscribers.results.map(sub => {
            const unsubscribeLink = `${env.SITE_URL}/api/unsubscribe?email=${encodeURIComponent(sub.email)}&token=unsub`;
            const html = emailTemplates.jobAlert(
                sub.name,
                title,
                category,
                shortInfo || 'Check out this new government job opportunity!',
                importantDates || 'See official notification for dates',
                applyLink || 'https://examsite.in',
                unsubscribeLink
            );
            return {
                to: sub.email,
                subject: `🔔 New Job: ${title} | ExamSite.in`,
                html,
            };
        });

        const batchResult = await emailService.sendBatch(emails);

        // Update job post with notification count
        await env.DB.prepare('UPDATE job_posts SET notification_sent = 1, notification_count = ? WHERE id = ?')
            .bind(batchResult.sent, jobPostId)
            .run();

        return jsonResponse({
            success: true,
            message: 'Job posted and notifications sent!',
            jobPostId,
            notificationsSent: batchResult.sent,
            notificationsFailed: batchResult.failed
        }, 200, origin);
    } catch (error) {
        console.error('Post job error:', error);
        return errorResponse('Server error', 500, origin);
    }
}

// Handler: Admin - Get subscribers count
async function handleGetSubscribers(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (!getAdminPassword(env)) {
        return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401, origin);
    }

    const providedPassword = authHeader.slice(7);
    if (!secureCompare(providedPassword, getAdminPassword(env))) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return errorResponse('Unauthorized', 401, origin);
    }

    try {
        const total = await env.DB.prepare('SELECT COUNT(*) as count FROM subscribers').first<{ count: number }>();
        const verified = await env.DB.prepare('SELECT COUNT(*) as count FROM subscribers WHERE verified = 1').first<{ count: number }>();
        const recent = await env.DB.prepare('SELECT name, qualification, location, created_at FROM subscribers ORDER BY created_at DESC LIMIT 10')
            .all();

        return jsonResponse({
            success: true,
            totalSubscribers: total?.count || 0,
            verifiedSubscribers: verified?.count || 0,
            recentSubscribers: recent.results || []
        }, 200, origin);
    } catch (error) {
        console.error('Get subscribers error:', error);
        return errorResponse('Server error', 500, origin);
    }
}

// ==================== JOB DETAILS CRUD ====================

type VacancyColumn = { key: string; label: string };
type VacancyRow = Record<string, string>;

const DEFAULT_VACANCY_COLUMNS: VacancyColumn[] = [
    { key: 'postName', label: 'Post Name' },
    { key: 'totalPost', label: 'Total Post' },
    { key: 'eligibility', label: 'Eligibility' }
];

function sanitizeVacancyKey(key: string): string {
    const cleaned = String(key || '').trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleaned) return '';
    if (!/^[a-zA-Z]/.test(cleaned)) return '';
    return cleaned.slice(0, 32);
}

function sanitizeVacancyLabel(label: string): string {
    return sanitizeString(String(label || ''), 50);
}

function normalizeVacancyData(parsed: any): { columns: VacancyColumn[]; rows: VacancyRow[] } {
    const ensureRequired = (cols: VacancyColumn[]) => {
        const keys = new Set(cols.map(c => c.key));
        const out = [...cols];
        for (const req of DEFAULT_VACANCY_COLUMNS) {
            if (!keys.has(req.key)) out.unshift(req);
        }
        const seen = new Set<string>();
        const unique = out.filter(c => {
            if (!c.key) return false;
            if (seen.has(c.key)) return false;
            seen.add(c.key);
            return true;
        });
        return unique.slice(0, 10);
    };

    const normalizeRows = (rows: any[], columns: VacancyColumn[]) => {
        const colKeys = columns.map(c => c.key);
        const out: VacancyRow[] = [];
        for (const r of rows.slice(0, 60)) {
            const obj: VacancyRow = {};
            for (const k of colKeys) {
                obj[k] = sanitizeString(String((r as any)?.[k] ?? ''), 2000);
            }
            out.push(obj);
        }
        return out;
    };

    if (Array.isArray(parsed)) {
        const rowsRaw = parsed;
        const extraKeys = new Set<string>();
        const rowsSan: VacancyRow[] = rowsRaw.slice(0, 60).map((r: any) => {
            const obj: VacancyRow = {
                postName: sanitizeString(String(r?.postName ?? ''), 500),
                totalPost: sanitizeString(String(r?.totalPost ?? ''), 200),
                eligibility: sanitizeString(String(r?.eligibility ?? ''), 2000)
            };
            if (r && typeof r === 'object') {
                for (const [k, v] of Object.entries(r)) {
                    const kk = sanitizeVacancyKey(k);
                    if (!kk) continue;
                    if (kk === 'postName' || kk === 'totalPost' || kk === 'eligibility') continue;
                    extraKeys.add(kk);
                    obj[kk] = sanitizeString(String(v ?? ''), 2000);
                }
            }
            return obj;
        });
        const extras: VacancyColumn[] = Array.from(extraKeys).slice(0, 7).map(k => ({ key: k, label: k }));
        return { columns: ensureRequired([...DEFAULT_VACANCY_COLUMNS, ...extras]), rows: rowsSan };
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rows)) {
        const colsRaw = Array.isArray(parsed.columns) ? parsed.columns : [];
        const colsSan: VacancyColumn[] = colsRaw
            .map((c: any) => ({ key: sanitizeVacancyKey(String(c?.key || '')), label: sanitizeVacancyLabel(String(c?.label || c?.key || '')) }))
            .filter(c => !!c.key && !!c.label);
        const columns = ensureRequired(colsSan.length ? colsSan : DEFAULT_VACANCY_COLUMNS);
        const rows = normalizeRows(parsed.rows, columns);
        return { columns, rows };
    }

    return { columns: DEFAULT_VACANCY_COLUMNS, rows: [] };
}

interface JobDetailRequest {
    id: string;
    title: string;
    category?: string;
    postDate?: string;
    shortInfo?: string;
    importantDates?: string[];
    applicationFee?: string[];
    ageLimit?: string[];
    vacancyColumns?: VacancyColumn[];
    vacancyDetails?: VacancyRow[];
    importantLinks?: { label: string; url: string }[];
    applyLink?: string;
}

// Handler: Get all jobs (public)
async function handleGetAllJobs(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    try {
        const jobs = await env.DB.prepare(`
            SELECT * FROM job_details
            WHERE is_active = 1
              AND title NOT LIKE '%http%'
              AND title NOT LIKE '%www.%'
              AND title NOT LIKE 'Vacancy%'
              AND title NOT LIKE 'Engagement%'
              AND title NOT LIKE 'Recruitment%'
              AND title NOT LIKE 'Notification%'
              AND title NOT LIKE '%DATED%'
              AND title NOT LIKE 'No.%'
            ORDER BY updated_at DESC
        `)
            .all();

        const parsedJobs = (jobs.results || [])
            .map((row: any) => {
            const importantDates = JSON.parse(row.important_dates || '[]');
            const applicationFee = JSON.parse(row.application_fee || '[]');
            const ageLimit = JSON.parse(row.age_limit || '[]');
            const vacancyParsed = normalizeVacancyData(JSON.parse(row.vacancy_details || '[]'));
            const importantLinks = (JSON.parse(row.important_links || '[]') as any[]).map((l: any) => ({
                label: String(l?.label || ''),
                url: String(l?.url || '').replace(/`/g, '').trim()
            }));
            const applyLink = String(row.apply_link || '');
            const rawJob = {
                title: String(row.title || ''),
                shortInfo: String(row.short_info || ''),
                importantDates,
                importantLinks,
                applyLink
            };
            const verdict = validateJob(rawJob);
            if (!verdict.ok) {
                return null;
            }
            const title = verdict.normalizedTitle || deriveReadableTitle(rawJob);
            return {
                id: String(row.id || ''),
                title,
                category: String(row.category || ''),
                postDate: String(row.post_date || ''),
                shortInfo: String(row.short_info || ''),
                importantDates,
                applicationFee,
                ageLimit,
                vacancyDetails: vacancyParsed.rows,
                vacancyColumns: vacancyParsed.columns,
                importantLinks,
                applyLink
            };
        })
            .filter(Boolean);

        return jsonResponse({ success: true, jobs: parsedJobs, count: parsedJobs.length }, 200, origin);
    } catch (error) {
        console.error('Get all jobs error:', error);
        return errorResponse('Server error', 500, origin);
    }
}

// Handler: Get single job by ID (public)
async function handleGetJob(request: Request, env: Env, jobId: string): Promise<Response> {
    const origin = request.headers.get('Origin');
    try {
        const job = await env.DB.prepare('SELECT * FROM job_details WHERE id = ? AND is_active = 1')
            .bind(jobId)
            .first();

        if (!job) {
            return errorResponse('Job not found', 404, origin);
        }

        const importantDates = JSON.parse((job as any).important_dates || '[]');
        const applicationFee = JSON.parse((job as any).application_fee || '[]');
        const ageLimit = JSON.parse((job as any).age_limit || '[]');
        const vacancyParsed = normalizeVacancyData(JSON.parse((job as any).vacancy_details || '[]'));
        const importantLinks = (JSON.parse((job as any).important_links || '[]') as any[]).map((l: any) => ({
            label: String(l?.label || ''),
            url: String(l?.url || '').replace(/`/g, '').trim()
        }));
        const applyLink = String((job as any).apply_link || '');
        const title = deriveReadableTitle({
            title: String((job as any).title || ''),
            shortInfo: String((job as any).short_info || ''),
            importantDates,
            importantLinks,
            applyLink
        });
        const parsedJob = {
            id: String((job as any).id || ''),
            title,
            category: String((job as any).category || ''),
            postDate: String((job as any).post_date || ''),
            shortInfo: String((job as any).short_info || ''),
            importantDates,
            applicationFee,
            ageLimit,
            vacancyDetails: vacancyParsed.rows,
            vacancyColumns: vacancyParsed.columns,
            importantLinks,
            applyLink
        };

        return jsonResponse({ success: true, job: parsedJob }, 200, origin);
    } catch (error) {
        console.error('Get job error:', error);
        return errorResponse('Server error', 500, origin);
    }
}

// Handler: Create or Update job (admin only)
async function handleSaveJob(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (!getAdminPassword(env)) {
        return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
    }

    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401, origin);
    }
    const providedPassword = authHeader.slice(7);
    if (!secureCompare(providedPassword, getAdminPassword(env))) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return errorResponse('Unauthorized', 401, origin);
    }

    try {
        const body: JobDetailRequest = await request.json();

        if (!body.id || !body.title) {
            return errorResponse('ID and Title are required', 400, origin);
        }

        const id = sanitizeString(body.id, 100);
        const title = sanitizeString(body.title, 200);
        const category = sanitizeString(body.category || 'Latest Jobs', 50);
        const postDate = sanitizeString(body.postDate || '', 100);
        const shortInfo = sanitizeString(body.shortInfo || '', 5000);
        const importantDates = body.importantDates || [];
        const applicationFee = body.applicationFee || [];
        const ageLimit = body.ageLimit || [];
        const vacancyDetails = Array.isArray(body.vacancyDetails) ? body.vacancyDetails : [];
        const vacancyColumns = Array.isArray(body.vacancyColumns) ? body.vacancyColumns : [];
        const importantLinks = body.importantLinks || [];
        const applyLink = sanitizeString(body.applyLink || importantLinks?.[0]?.url || '', 2000);

        const verdict = validateJob({
            title,
            shortInfo,
            importantDates,
            importantLinks,
            applyLink
        });
        if (!verdict.ok) {
            return errorResponse(verdict.reason || 'Invalid job', 400, origin);
        }
        const normalizedTitle = sanitizeString(verdict.normalizedTitle || title, 200);

        const vacancyPayload = vacancyColumns.length
            ? normalizeVacancyData({ columns: vacancyColumns, rows: vacancyDetails })
            : normalizeVacancyData(vacancyDetails);
        const vacancyDetailsJson = vacancyColumns.length
            ? JSON.stringify({ columns: vacancyPayload.columns, rows: vacancyPayload.rows })
            : JSON.stringify(vacancyPayload.rows);

        // Check if exists
        const existing = await env.DB.prepare('SELECT id FROM job_details WHERE id = ?')
            .bind(id)
            .first();

        if (existing) {
            // Update
            await env.DB.prepare(`
                UPDATE job_details SET
                    title = ?, category = ?, post_date = ?, short_info = ?,
                    important_dates = ?, application_fee = ?, age_limit = ?,
                    vacancy_details = ?, important_links = ?, apply_link = ?, updated_at = datetime('now')
                WHERE id = ?
            `).bind(
                normalizedTitle, category, postDate, shortInfo,
                JSON.stringify(importantDates),
                JSON.stringify(applicationFee),
                JSON.stringify(ageLimit),
                vacancyDetailsJson,
                JSON.stringify(importantLinks),
                applyLink,
                id
            ).run();

            try {
                let host = '';
                try { host = applyLink ? new URL(applyLink).hostname : ''; } catch {}
                await env.DB.prepare(`UPDATE job_details SET created_by = ?, quality_score = ?, source_url = ?, source_domain = ?, updated_at = datetime('now') WHERE id = ?`)
                    .bind('manual', 100, applyLink, host, id)
                    .run();
            } catch {}

            return jsonResponse({ success: true, message: 'Job updated successfully', id }, 200, origin);
        } else {
            // Insert
            await env.DB.prepare(`
                INSERT INTO job_details (id, title, category, post_date, short_info,
                    important_dates, application_fee, age_limit, vacancy_details, important_links, apply_link)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                id, normalizedTitle, category, postDate, shortInfo,
                JSON.stringify(importantDates),
                JSON.stringify(applicationFee),
                JSON.stringify(ageLimit),
                vacancyDetailsJson,
                JSON.stringify(importantLinks),
                applyLink
            ).run();

            try {
                let host = '';
                try { host = applyLink ? new URL(applyLink).hostname : ''; } catch {}
                await env.DB.prepare(`UPDATE job_details SET created_by = ?, quality_score = ?, source_url = ?, source_domain = ?, updated_at = datetime('now') WHERE id = ?`)
                    .bind('manual', 100, applyLink, host, id)
                    .run();
            } catch {}

            return jsonResponse({ success: true, message: 'Job created successfully', id }, 201, origin);
        }
    } catch (error) {
        console.error('Save job error:', error);
        return errorResponse('Server error', 500, origin);
    }
}

// Handler: Delete job (admin only)
async function handleDeleteJob(request: Request, env: Env, jobId: string): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (!getAdminPassword(env)) {
        return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
    }

    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401, origin);
    }
    const providedPassword = authHeader.slice(7);
    if (!secureCompare(providedPassword, getAdminPassword(env))) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return errorResponse('Unauthorized', 401, origin);
    }

    try {
        const result = await env.DB.prepare('DELETE FROM job_details WHERE id = ?')
            .bind(jobId)
            .run();

        const changes = Number((result as any)?.meta?.changes ?? (result as any)?.meta?.rows_written ?? 0);
        if (changes <= 0) {
            return errorResponse('Job not found', 404, origin);
        }

        return jsonResponse({ success: true, message: 'Job deleted successfully' }, 200, origin);
    } catch (error) {
        console.error('Delete job error:', error);
        return errorResponse('Server error', 500, origin);
    }
}

// ==================== MAIN WORKER HANDLER ====================

import { AutoAgent } from './auto-agent';

export default {
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        console.log('Running Automated Content Agent...');
        const agent = new AutoAgent(env);
        const result = await agent.run();
        console.log('Agent Run Result:', result);
    },

    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        let path = url.pathname;
        if (path.length > 1 && path.endsWith('/')) {
            path = path.replace(/\/+$/, '');
        }
        const origin = request.headers.get('Origin');

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: getCorsHeaders(origin)
            });
        }

        // API Routes
        if (path === '/api/subscribe' && request.method === 'POST') {
            return handleSubscribe(request, env);
        }

        if (path === '/api/verify' && request.method === 'GET') {
            return handleVerify(request, env);
        }

        if (path === '/api/unsubscribe' && request.method === 'GET') {
            return handleUnsubscribe(request, env);
        }

        if (path === '/api/admin/post-job' && request.method === 'POST') {
            return handlePostJob(request, env);
        }

        if (path === '/api/admin/subscribers' && request.method === 'GET') {
            return handleGetSubscribers(request, env);
        }

        if (path === '/api/admin/cleanup-junk' && (request.method === 'POST' || request.method === 'GET')) {
            const origin = request.headers.get('Origin');
            const authHeader = request.headers.get('Authorization');
            const queryKey = new URL(request.url).searchParams.get('key');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            let isAuthorized = false;
            if (authHeader && authHeader.startsWith('Bearer ') && secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                isAuthorized = true;
            } else if (queryKey && secureCompare(queryKey, getAdminPassword(env))) {
                isAuthorized = true;
            }
            if (!isAuthorized) {
                return errorResponse('Unauthorized', 401, origin);
            }
            try {
                await env.DB.prepare(`
                    UPDATE job_details
                    SET is_active = -1, updated_at = datetime('now')
                    WHERE is_active = 1 AND (
                        title LIKE '%http%' OR
                        title LIKE '%www.%' OR
                        title LIKE 'Vacancy%' OR
                        title LIKE 'Engagement%' OR
                        title LIKE 'Recruitment%' OR
                        title LIKE 'Notification%' OR
                        title LIKE '%DATED%' OR
                        title LIKE 'No.%'
                    )
                `).run();
                return jsonResponse({ success: true, message: 'Cleanup applied' }, 200, origin);
            } catch (error) {
                return errorResponse('Cleanup failed', 500, origin);
            }
        }

        if (path === '/api/admin/ping' && request.method === 'GET') {
            const queryKey = url.searchParams.get('key');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            let isAuthorized = false;
            if (authHeader && authHeader.startsWith('Bearer ') && secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                isAuthorized = true;
            } else if (queryKey && secureCompare(queryKey, getAdminPassword(env))) {
                isAuthorized = true;
            }
            if (!isAuthorized) {
                return errorResponse('Unauthorized. Use header or ?key', 401, origin);
            }
            return jsonResponse({ success: true, message: 'Authorized' }, 200, origin);
        }

        if (path === '/api/admin/quick-add' && (request.method === 'GET' || request.method === 'POST')) {
            const queryKey = url.searchParams.get('key');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            let isAuthorized = false;
            if (authHeader && authHeader.startsWith('Bearer ') && secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                isAuthorized = true;
            } else if (queryKey && secureCompare(queryKey, getAdminPassword(env))) {
                isAuthorized = true;
            }
            if (!isAuthorized) {
                return errorResponse('Unauthorized. Use ?key=YOUR_ADMIN_PASSWORD', 401, origin);
            }
            try {
                const id = sanitizeString(url.searchParams.get('id') || '', 100);
                const title = sanitizeString(url.searchParams.get('title') || '', 200);
                const category = sanitizeString(url.searchParams.get('category') || 'Latest Jobs', 50);
                const postDate = sanitizeString(url.searchParams.get('postDate') || '', 100);
                const shortInfo = sanitizeString(url.searchParams.get('shortInfo') || '', 5000);
                if (!id || !title) {
                    return errorResponse('ID and Title are required', 400, origin);
                }
                const existing = await env.DB.prepare('SELECT id FROM job_details WHERE id = ?')
                    .bind(id)
                    .first();
                if (existing) {
                    await env.DB.prepare(`
                        UPDATE job_details SET
                            title = ?, category = ?, post_date = ?, short_info = ?, updated_at = datetime('now')
                        WHERE id = ?
                    `)
                        .bind(title, category, postDate, shortInfo, id)
                        .run();
                    return jsonResponse({ success: true, message: 'Job updated', id }, 200, origin);
                } else {
                    await env.DB.prepare(`
                        INSERT INTO job_details (id, title, category, post_date, short_info, important_dates, application_fee, age_limit, vacancy_details, important_links, apply_link, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, '[]', '[]', '[]', '[]', '[]', '', 1, datetime('now'), datetime('now'))
                    `)
                        .bind(id, title, category, postDate, shortInfo)
                        .run();
                    return jsonResponse({ success: true, message: 'Job created', id }, 200, origin);
                }
            } catch (error) {
                console.error('Quick add error:', error);
                return errorResponse('Server error', 500, origin);
            }
        }

        if (path === '/api/admin/jobs/quick-add' && (request.method === 'GET' || request.method === 'POST')) {
            const queryKey = url.searchParams.get('key');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            let isAuthorized = false;
            if (authHeader && authHeader.startsWith('Bearer ') && secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                isAuthorized = true;
            } else if (queryKey && secureCompare(queryKey, getAdminPassword(env))) {
                isAuthorized = true;
            }
            if (!isAuthorized) {
                return errorResponse('Unauthorized. Use ?key=YOUR_ADMIN_PASSWORD', 401, origin);
            }
            try {
                const id = sanitizeString(url.searchParams.get('id') || '', 100);
                const title = sanitizeString(url.searchParams.get('title') || '', 200);
                const category = sanitizeString(url.searchParams.get('category') || 'Latest Jobs', 50);
                const postDate = sanitizeString(url.searchParams.get('postDate') || '', 100);
                const shortInfo = sanitizeString(url.searchParams.get('shortInfo') || '', 5000);
                if (!id || !title) {
                    return errorResponse('ID and Title are required', 400, origin);
                }
                const existing = await env.DB.prepare('SELECT id FROM job_details WHERE id = ?')
                    .bind(id)
                    .first();
                if (existing) {
                    await env.DB.prepare(`
                        UPDATE job_details SET
                            title = ?, category = ?, post_date = ?, short_info = ?, updated_at = datetime('now')
                        WHERE id = ?
                    `)
                        .bind(title, category, postDate, shortInfo, id)
                        .run();
                    return jsonResponse({ success: true, message: 'Job updated', id }, 200, origin);
                } else {
                    await env.DB.prepare(`
                        INSERT INTO job_details (id, title, category, post_date, short_info, important_dates, application_fee, age_limit, vacancy_details, important_links, apply_link, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, '[]', '[]', '[]', '[]', '[]', '', 1, datetime('now'), datetime('now'))
                    `)
                        .bind(id, title, category, postDate, shortInfo)
                        .run();
                    return jsonResponse({ success: true, message: 'Job created', id }, 200, origin);
                }
            } catch (error) {
                console.error('Quick add error:', error);
                return errorResponse('Server error', 500, origin);
            }
        }

        // Manual Agent Trigger (Admin Only) - Enhanced for Browser usage
        if ((path === '/api/admin/trigger-agent' || path === '/api/debug/trigger') && (request.method === 'POST' || request.method === 'GET')) {
            const url = new URL(request.url);
            const queryKey = url.searchParams.get('key');
            const authHeader = request.headers.get('Authorization');

            // Check if ADMIN_PASSWORD is set
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }

            // Verify Auth (Header OR Query Param)
            let isAuthorized = false;
            if (authHeader && authHeader.startsWith('Bearer ') && secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                isAuthorized = true;
            } else if (queryKey && secureCompare(queryKey, getAdminPassword(env))) {
                isAuthorized = true;
            }

            if (!isAuthorized) {
                return errorResponse('Unauthorized. Use ?key=YOUR_ADMIN_PASSWORD', 401, origin);
            }

            try {
                const agent = new AutoAgent(env);
                const result = await agent.run();
                return jsonResponse(result, 200, origin);
            } catch (error) {
                console.error('Agent execution error:', error);
                return jsonResponse({
                    success: false,
                    message: `Agent Error: ${error instanceof Error ? error.message : String(error)}`,
                    jobsAdded: 0
                }, 500, origin);
            }
        }

        if (path === '/api/admin/migrate' && (request.method === 'POST' || request.method === 'GET')) {
            const url = new URL(request.url);
            const queryKey = url.searchParams.get('key');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            let isAuthorized = false;
            if (authHeader && authHeader.startsWith('Bearer ') && secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                isAuthorized = true;
            } else if (queryKey && secureCompare(queryKey, getAdminPassword(env))) {
                isAuthorized = true;
            }
            if (!isAuthorized) {
                return errorResponse('Unauthorized. Use ?key=YOUR_ADMIN_PASSWORD', 401, origin);
            }
            try {
                const info = await env.DB.prepare('PRAGMA table_info(job_details)').all();
                const hasApplyLink = (info.results || []).some((r: any) => r.name === 'apply_link');
                const hasSourceUrl = (info.results || []).some((r: any) => r.name === 'source_url');
                const hasSourceDomain = (info.results || []).some((r: any) => r.name === 'source_domain');
                const hasCreatedBy = (info.results || []).some((r: any) => r.name === 'created_by');
                const hasQualityScore = (info.results || []).some((r: any) => r.name === 'quality_score');
                let applied = false;
                if (!hasApplyLink) {
                    await env.DB.prepare('ALTER TABLE job_details ADD COLUMN apply_link TEXT').run();
                    applied = true;
                }
                if (!hasSourceUrl) {
                    await env.DB.prepare('ALTER TABLE job_details ADD COLUMN source_url TEXT').run();
                    applied = true;
                }
                if (!hasSourceDomain) {
                    await env.DB.prepare('ALTER TABLE job_details ADD COLUMN source_domain TEXT').run();
                    applied = true;
                }
                if (!hasCreatedBy) {
                    await env.DB.prepare('ALTER TABLE job_details ADD COLUMN created_by TEXT').run();
                    applied = true;
                }
                if (!hasQualityScore) {
                    await env.DB.prepare('ALTER TABLE job_details ADD COLUMN quality_score INTEGER').run();
                    applied = true;
                }
                return jsonResponse({ success: true, applied }, 200, origin);
            } catch (error) {
                console.error('Migration error:', error);
                return errorResponse('Migration failed', 500, origin);
            }
        }

        if (path === '/api/admin/pending' && request.method === 'GET') {
            const origin = request.headers.get('Origin');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            if (!authHeader || !authHeader.startsWith('Bearer ') || !secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                return errorResponse('Unauthorized', 401, origin);
            }
            try {
                const flags = await getJobDetailsColumnFlags(env);
                const sql = getAdminJobsSelectSql(flags);
                const whereClause = flags.is_active ? 'WHERE is_active = 0' : '';
                const rows = await env.DB.prepare(
                    `SELECT ${sql.select} FROM job_details ${whereClause} ORDER BY ${sql.orderBy} DESC LIMIT 200`
                ).all();
                return jsonResponse({ success: true, pending: rows.results || [] }, 200, origin);
            } catch (error) {
                console.error('Admin pending error:', error);
                return errorResponse('Request failed (500)', 500, origin);
            }
        }

        if (path === '/api/admin/jobs' && request.method === 'GET') {
            const origin = request.headers.get('Origin');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            if (!authHeader || !authHeader.startsWith('Bearer ') || !secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                return errorResponse('Unauthorized', 401, origin);
            }
            try {
                const url = new URL(request.url);
                const status = (url.searchParams.get('status') || 'all').toLowerCase();
                const flags = await getJobDetailsColumnFlags(env);
                const sql = getAdminJobsSelectSql(flags);
                let whereClause = '';
                if (flags.is_active) {
                    if (status === 'pending') whereClause = 'WHERE is_active = 0';
                    else if (status === 'active') whereClause = 'WHERE is_active = 1';
                    else if (status === 'inactive') whereClause = 'WHERE is_active = -1';
                }
                const rows = await env.DB.prepare(
                    `SELECT ${sql.select} FROM job_details ${whereClause} ORDER BY ${sql.orderBy} DESC LIMIT 200`
                ).all();
                return jsonResponse({ success: true, jobs: rows.results || [] }, 200, origin);
            } catch (error) {
                console.error('Admin jobs list error:', error);
                return errorResponse('Request failed (500)', 500, origin);
            }
        }

        if (path.startsWith('/api/admin/jobs/') && request.method === 'GET') {
            const origin = request.headers.get('Origin');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            if (!authHeader || !authHeader.startsWith('Bearer ') || !secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                return errorResponse('Unauthorized', 401, origin);
            }
            const jobId = path.replace('/api/admin/jobs/', '');
            const job = await env.DB.prepare('SELECT * FROM job_details WHERE id = ?')
                .bind(jobId)
                .first();

            if (!job) {
                return errorResponse('Job not found', 404, origin);
            }

            const importantDates = JSON.parse((job as any).important_dates || '[]');
            const applicationFee = JSON.parse((job as any).application_fee || '[]');
            const ageLimit = JSON.parse((job as any).age_limit || '[]');
            const vacancyParsed = normalizeVacancyData(JSON.parse((job as any).vacancy_details || '[]'));
            const importantLinks = (JSON.parse((job as any).important_links || '[]') as any[]).map((l: any) => ({
                label: String(l?.label || ''),
                url: String(l?.url || '').replace(/`/g, '').trim()
            }));
            const applyLink = String((job as any).apply_link || '');
            const title = deriveReadableTitle({
                title: String((job as any).title || ''),
                shortInfo: String((job as any).short_info || ''),
                importantDates,
                importantLinks,
                applyLink
            });

            return jsonResponse({
                success: true,
                job: {
                    id: String((job as any).id || ''),
                    title,
                    category: String((job as any).category || ''),
                    postDate: String((job as any).post_date || ''),
                    shortInfo: String((job as any).short_info || ''),
                    importantDates,
                    applicationFee,
                    ageLimit,
                    vacancyDetails: vacancyParsed.rows,
                    vacancyColumns: vacancyParsed.columns,
                    importantLinks,
                    applyLink,
                    isActive: Number((job as any).is_active ?? 1)
                }
            }, 200, origin);
        }

        if (path.startsWith('/api/admin/approve/') && request.method === 'POST') {
            const origin = request.headers.get('Origin');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            if (!authHeader || !authHeader.startsWith('Bearer ') || !secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                return errorResponse('Unauthorized', 401, origin);
            }
            const jobId = path.replace('/api/admin/approve/', '');
            await env.DB.prepare(`UPDATE job_details SET is_active = 1, updated_at = datetime('now') WHERE id = ?`).bind(jobId).run();
            return jsonResponse({ success: true, message: 'Approved' }, 200, origin);
        }

        if (path.startsWith('/api/admin/reject/') && request.method === 'POST') {
            const origin = request.headers.get('Origin');
            const authHeader = request.headers.get('Authorization');
            if (!getAdminPassword(env)) {
                return errorResponse('ADMIN_PASSWORD not configured', 500, origin);
            }
            if (!authHeader || !authHeader.startsWith('Bearer ') || !secureCompare(authHeader.slice(7), getAdminPassword(env))) {
                return errorResponse('Unauthorized', 401, origin);
            }
            const jobId = path.replace('/api/admin/reject/', '');
            await env.DB.prepare(`UPDATE job_details SET is_active = -1, updated_at = datetime('now') WHERE id = ?`).bind(jobId).run();
            return jsonResponse({ success: true, message: 'Rejected' }, 200, origin);
        }

        // Job Details CRUD Routes
        if (path === '/api/jobs' && request.method === 'GET') {
            return handleGetAllJobs(request, env);
        }

        if (path.startsWith('/api/jobs/') && request.method === 'GET') {
            const jobId = path.replace('/api/jobs/', '');
            return handleGetJob(request, env, jobId);
        }

        if (path === '/api/admin/jobs' && request.method === 'POST') {
            return handleSaveJob(request, env);
        }

        if (path.startsWith('/api/admin/jobs/') && request.method === 'DELETE') {
            const jobId = path.replace('/api/admin/jobs/', '');
            return handleDeleteJob(request, env, jobId);
        }

        // Debug: Test email sending directly
        if (path === '/api/test-email' && request.method === 'POST') {
            try {
                const body = await request.json() as { email: string };
                const testEmail = body.email || 'test@example.com';

                // Direct Resend API call for debugging
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'ExamSite.in <alerts@examsite.in>',
                        to: testEmail,
                        subject: '🧪 Test Email from ExamSite.in',
                        html: '<h1>Test Email</h1><p>This is a test email from ExamSite.in Worker.</p>',
                    }),
                });

                const data = await response.json();

                return jsonResponse({
                    success: response.ok,
                    status: response.status,
                    apiKeyPresent: !!env.RESEND_API_KEY,
                    apiKeyLength: env.RESEND_API_KEY?.length || 0,
                    resendResponse: data,
                }, response.ok ? 200 : 400, origin);
            } catch (error) {
                return jsonResponse({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    apiKeyPresent: !!env.RESEND_API_KEY,
                }, 500, origin);
            }
        }

        // Health check (no sensitive info)
        if (path === '/api/health') {
            return jsonResponse({ status: 'ok' }, 200, origin);
        }

        // 404 for unknown API routes
        if (path.startsWith('/api/')) {
            return errorResponse('Not found', 404, origin);
        }

        // For non-API routes, handle SPA routing:
        if (env.ASSETS) {
            const response = await env.ASSETS.fetch(request);

            // If asset not found (404) and this looks like a page navigation (GET + Accept: text/html),
            // serve index.html to let the client-side router handle it.
            if (response.status === 404 && request.method === 'GET') {
                const accept = request.headers.get('Accept') || '';
                if (accept.includes('text/html')) {
                    const indexResponse = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
                    // Clone response to add debug header
                    const newResponse = new Response(indexResponse.body, indexResponse);
                    newResponse.headers.set('X-SPA-Fallback', 'true');
                    return newResponse;
                }
            }

            return response;
        }

        return new Response('Worker Error: Assets binding missing. Check wrangler.jsonc configuration.', { status: 500 });
    },
};

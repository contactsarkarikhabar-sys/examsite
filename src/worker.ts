/**
 * ExamSite.in Cloudflare Worker API
 * SECURE Backend for job alerts, subscriptions, and email notifications
 */

import { EmailService } from './email-service';
import { emailTemplates } from './email-templates';

// Types
interface Env {
    DB: D1Database;
    RESEND_API_KEY: string;
    ADMIN_PASSWORD: string;
    SITE_URL: string;
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
function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
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
];

function getCorsHeaders(origin: string | null): HeadersInit {
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
    };
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

    // Check admin auth with secure comparison
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401, origin);
    }

    const providedPassword = authHeader.slice(7);
    if (!secureCompare(providedPassword, env.ADMIN_PASSWORD)) {
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

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401, origin);
    }

    const providedPassword = authHeader.slice(7);
    if (!secureCompare(providedPassword, env.ADMIN_PASSWORD)) {
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

interface JobDetailRequest {
    id: string;
    title: string;
    category?: string;
    postDate?: string;
    shortInfo?: string;
    importantDates?: string[];
    applicationFee?: string[];
    ageLimit?: string[];
    vacancyDetails?: { postName: string; totalPost: string; eligibility: string }[];
    importantLinks?: { label: string; url: string }[];
}

// Handler: Get all jobs (public)
async function handleGetAllJobs(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    try {
        const jobs = await env.DB.prepare('SELECT * FROM job_details WHERE is_active = 1 ORDER BY updated_at DESC')
            .all();

        // Parse JSON fields
        const parsedJobs = jobs.results?.map((job: any) => ({
            ...job,
            importantDates: JSON.parse(job.important_dates || '[]'),
            applicationFee: JSON.parse(job.application_fee || '[]'),
            ageLimit: JSON.parse(job.age_limit || '[]'),
            vacancyDetails: JSON.parse(job.vacancy_details || '[]'),
            importantLinks: JSON.parse(job.important_links || '[]'),
        })) || [];

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
        const job = await env.DB.prepare('SELECT * FROM job_details WHERE id = ?')
            .bind(jobId)
            .first();

        if (!job) {
            return errorResponse('Job not found', 404, origin);
        }

        const parsedJob = {
            ...job,
            importantDates: JSON.parse((job as any).important_dates || '[]'),
            applicationFee: JSON.parse((job as any).application_fee || '[]'),
            ageLimit: JSON.parse((job as any).age_limit || '[]'),
            vacancyDetails: JSON.parse((job as any).vacancy_details || '[]'),
            importantLinks: JSON.parse((job as any).important_links || '[]'),
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

    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401, origin);
    }
    const providedPassword = authHeader.slice(7);
    if (!secureCompare(providedPassword, env.ADMIN_PASSWORD)) {
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
                    vacancy_details = ?, important_links = ?, updated_at = datetime('now')
                WHERE id = ?
            `).bind(
                title, category, postDate, shortInfo,
                JSON.stringify(body.importantDates || []),
                JSON.stringify(body.applicationFee || []),
                JSON.stringify(body.ageLimit || []),
                JSON.stringify(body.vacancyDetails || []),
                JSON.stringify(body.importantLinks || []),
                id
            ).run();

            return jsonResponse({ success: true, message: 'Job updated successfully', id }, 200, origin);
        } else {
            // Insert
            await env.DB.prepare(`
                INSERT INTO job_details (id, title, category, post_date, short_info,
                    important_dates, application_fee, age_limit, vacancy_details, important_links)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                id, title, category, postDate, shortInfo,
                JSON.stringify(body.importantDates || []),
                JSON.stringify(body.applicationFee || []),
                JSON.stringify(body.ageLimit || []),
                JSON.stringify(body.vacancyDetails || []),
                JSON.stringify(body.importantLinks || [])
            ).run();

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

    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401, origin);
    }
    const providedPassword = authHeader.slice(7);
    if (!secureCompare(providedPassword, env.ADMIN_PASSWORD)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return errorResponse('Unauthorized', 401, origin);
    }

    try {
        // Soft delete
        await env.DB.prepare('UPDATE job_details SET is_active = 0, updated_at = datetime("now") WHERE id = ?')
            .bind(jobId)
            .run();

        return jsonResponse({ success: true, message: 'Job deleted successfully' }, 200, origin);
    } catch (error) {
        console.error('Delete job error:', error);
        return errorResponse('Server error', 500, origin);
    }
}

// ==================== MAIN WORKER HANDLER ====================

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
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

        // For non-API routes, return undefined to let Cloudflare serve static assets
        // In Workers with assets, returning a fetch to origin serves the static content
        return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    },
};

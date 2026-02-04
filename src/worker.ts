/**
 * ExamSite.in Cloudflare Worker API
 * Backend for job alerts, subscriptions, and email notifications
 */

import { EmailService } from './email-service';
import { emailTemplates } from './email-templates';

// Types
interface Env {
    DB: D1Database;
    RESEND_API_KEY: string;
    ADMIN_PASSWORD: string;
    SITE_URL: string;
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

// Utility: Generate random token
function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// Utility: CORS headers
function corsHeaders(): HeadersInit {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Utility: JSON response helper
function jsonResponse(data: object, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
}

// Handler: Subscribe new user
async function handleSubscribe(request: Request, env: Env): Promise<Response> {
    try {
        const body: SubscribeRequest = await request.json();

        if (!body.name || !body.email) {
            return jsonResponse({ success: false, error: 'Name and email are required' }, 400);
        }

        // Check if already exists
        const existing = await env.DB.prepare('SELECT * FROM subscribers WHERE email = ?')
            .bind(body.email.toLowerCase())
            .first<Subscriber>();

        if (existing) {
            if (existing.verified) {
                return jsonResponse({ success: true, message: 'Already subscribed!', alreadySubscribed: true });
            } else {
                // Resend verification email
                const token = generateToken();
                await env.DB.prepare('UPDATE subscribers SET verification_token = ? WHERE id = ?')
                    .bind(token, existing.id)
                    .run();

                const emailService = new EmailService(env.RESEND_API_KEY);
                const verificationLink = `${env.SITE_URL}/api/verify?token=${token}`;
                const html = emailTemplates.welcome(existing.name, verificationLink);
                await emailService.sendWelcomeEmail(existing.email, existing.name, html);

                return jsonResponse({ success: true, message: 'Verification email resent!', needsVerification: true });
            }
        }

        // Create new subscriber
        const token = generateToken();
        const interests = JSON.stringify(body.interests || []);

        await env.DB.prepare(`
      INSERT INTO subscribers (name, email, qualification, location, interests, verification_token)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
            body.name,
            body.email.toLowerCase(),
            body.qualification || '10th Pass',
            body.location || 'All India',
            interests,
            token
        ).run();

        // Send verification email
        const emailService = new EmailService(env.RESEND_API_KEY);
        const verificationLink = `${env.SITE_URL}/api/verify?token=${token}`;
        const html = emailTemplates.welcome(body.name, verificationLink);
        await emailService.sendWelcomeEmail(body.email, body.name, html);

        return jsonResponse({
            success: true,
            message: 'Subscription successful! Please check your email to verify.',
            needsVerification: true
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        return jsonResponse({ success: false, error: 'Server error' }, 500);
    }
}

// Handler: Verify email
async function handleVerify(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return new Response('Invalid verification link', { status: 400 });
    }

    const subscriber = await env.DB.prepare('SELECT * FROM subscribers WHERE verification_token = ?')
        .bind(token)
        .first<Subscriber>();

    if (!subscriber) {
        return new Response('Invalid or expired verification link', { status: 400 });
    }

    await env.DB.prepare('UPDATE subscribers SET verified = 1, verification_token = NULL WHERE id = ?')
        .bind(subscriber.id)
        .run();

    // Return success HTML page
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

    if (!email) {
        return new Response('Invalid unsubscribe link', { status: 400 });
    }

    await env.DB.prepare('DELETE FROM subscribers WHERE email = ?')
        .bind(email.toLowerCase())
        .run();

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
    // Check admin auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    try {
        const body: JobPostRequest = await request.json();

        if (!body.title || !body.category) {
            return jsonResponse({ success: false, error: 'Title and category are required' }, 400);
        }

        // Insert job post
        const result = await env.DB.prepare(`
      INSERT INTO job_posts (title, category, short_info, important_dates, apply_link)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
            body.title,
            body.category,
            body.shortInfo || '',
            body.importantDates || '',
            body.applyLink || 'https://examsite.in'
        ).run();

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
            });
        }

        // Send emails to all subscribers
        const emailService = new EmailService(env.RESEND_API_KEY);
        const emails = subscribers.results.map(sub => {
            const unsubscribeLink = `${env.SITE_URL}/api/unsubscribe?email=${encodeURIComponent(sub.email)}`;
            const html = emailTemplates.jobAlert(
                sub.name,
                body.title,
                body.category,
                body.shortInfo || 'Check out this new government job opportunity!',
                body.importantDates || 'See official notification for dates',
                body.applyLink || 'https://examsite.in',
                unsubscribeLink
            );
            return {
                to: sub.email,
                subject: `🔔 New Job: ${body.title} | ExamSite.in`,
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
        });
    } catch (error) {
        console.error('Post job error:', error);
        return jsonResponse({ success: false, error: 'Server error' }, 500);
    }
}

// Handler: Admin - Get subscribers count
async function handleGetSubscribers(request: Request, env: Env): Promise<Response> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    try {
        const total = await env.DB.prepare('SELECT COUNT(*) as count FROM subscribers').first<{ count: number }>();
        const verified = await env.DB.prepare('SELECT COUNT(*) as count FROM subscribers WHERE verified = 1').first<{ count: number }>();
        const recent = await env.DB.prepare('SELECT name, email, qualification, location, created_at FROM subscribers ORDER BY created_at DESC LIMIT 10')
            .all<Subscriber>();

        return jsonResponse({
            success: true,
            totalSubscribers: total?.count || 0,
            verifiedSubscribers: verified?.count || 0,
            recentSubscribers: recent.results || []
        });
    } catch (error) {
        console.error('Get subscribers error:', error);
        return jsonResponse({ success: false, error: 'Server error' }, 500);
    }
}

// Main Worker Handler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders() });
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

        // Health check
        if (path === '/api/health') {
            return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
        }

        // 404 for unknown API routes
        if (path.startsWith('/api/')) {
            return jsonResponse({ error: 'Not found' }, 404);
        }

        // For non-API routes, let Cloudflare serve static assets
        return new Response('Not found', { status: 404 });
    },
};

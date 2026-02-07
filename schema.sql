-- ExamSite.in Database Schema for Cloudflare D1
-- Run: npx wrangler d1 execute examsite-db --file=./schema.sql

-- Subscribers Table - Stores job alert subscribers
CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    qualification TEXT DEFAULT '10th Pass',
    location TEXT DEFAULT 'All India',
    interests TEXT, -- JSON array stored as string
    verified INTEGER DEFAULT 0, -- 0 = not verified, 1 = verified
    verification_token TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_verified ON subscribers(verified);

-- Job Posts Table - Tracks posted jobs for notification history
CREATE TABLE IF NOT EXISTS job_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    short_info TEXT,
    important_dates TEXT, -- JSON array
    application_fee TEXT,
    age_limit TEXT,
    apply_link TEXT,
    notification_sent INTEGER DEFAULT 0,
    notification_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Job Details Table - Full job details for website display
CREATE TABLE IF NOT EXISTS job_details (
    id TEXT PRIMARY KEY,  -- slug like 'ssc-cgl-2026'
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Latest Jobs',
    post_date TEXT,
    short_info TEXT,
    important_dates TEXT,  -- JSON array
    application_fee TEXT,  -- JSON array
    age_limit TEXT,        -- JSON array
    vacancy_details TEXT,  -- JSON array of objects
    important_links TEXT,  -- JSON array of objects
    apply_link TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_job_details_category ON job_details(category);
CREATE INDEX IF NOT EXISTS idx_job_details_active ON job_details(is_active);

-- Notification Log - Tracks sent emails
CREATE TABLE IF NOT EXISTS notification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_post_id INTEGER,
    subscriber_id INTEGER,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    sent_at TEXT,
    error_message TEXT,
    FOREIGN KEY (job_post_id) REFERENCES job_posts(id),
    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);

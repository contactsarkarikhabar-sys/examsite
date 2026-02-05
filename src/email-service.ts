/**
 * ExamSite.in Email Service
 * Wrapper for Resend API to send emails
 */

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

interface ResendResponse {
    id?: string;
    error?: { message: string };
}

export class EmailService {
    private apiKey: string;
    private fromEmail: string;

    constructor(apiKey: string, fromEmail: string = 'ExamSite.in <alerts@examsite.in>') {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
    }

    /**
     * Send a single email using Resend API
     */
    async sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: payload.to,
                    subject: payload.subject,
                    html: payload.html,
                }),
            });

            const data: ResendResponse = await response.json();

            if (!response.ok) {
                return { success: false, error: data.error?.message || 'Failed to send email' };
            }

            return { success: true, id: data.id };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * Send emails in batches to multiple recipients
     * Resend supports up to 100 emails per batch
     */
    async sendBatch(emails: EmailPayload[]): Promise<{ sent: number; failed: number; errors: string[] }> {
        const results = { sent: 0, failed: 0, errors: [] as string[] };

        // Process in batches of 10 to avoid rate limits
        const batchSize = 10;
        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            const promises = batch.map(email => this.sendEmail(email));
            const batchResults = await Promise.all(promises);

            for (const result of batchResults) {
                if (result.success) {
                    results.sent++;
                } else {
                    results.failed++;
                    if (result.error) results.errors.push(result.error);
                }
            }

            // Small delay between batches to respect rate limits
            if (i + batchSize < emails.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return results;
    }

    /**
     * Send welcome/verification email
     */
    async sendWelcomeEmail(to: string, name: string, html: string): Promise<{ success: boolean; error?: string }> {
        return this.sendEmail({
            to,
            subject: '🎉 ExamSite.in - Email Verify करें | Welcome!',
            html,
        });
    }

    /**
     * Send job alert notification
     */
    async sendJobAlert(to: string, jobTitle: string, html: string): Promise<{ success: boolean; error?: string }> {
        return this.sendEmail({
            to,
            subject: `🔔 New Job: ${jobTitle} | ExamSite.in`,
            html,
        });
    }
}

import { inngest } from '../client';
import nodemailer from 'nodemailer';

export const sendFeedbackEmail = inngest.createFunction(
  {
    id: 'send-feedback-email',
    name: 'Send feedback notification email',
    triggers: [{ event: 'feedback/submitted' }],
  },
  async ({ event }) => {
    const { feedbackId, type, description, userEmail, pageUrl } = event.data as {
      feedbackId: string;
      type: string;
      description: string;
      userEmail: string | null;
      pageUrl: string | null;
    };

    const gmailUser = process.env.GMAIL_USER ?? process.env.GMAIL_FROM ?? 'getmarketingai@gmail.com';
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailPass) {
      console.warn('[feedback-email] GMAIL_APP_PASSWORD not set — skipping email');
      return { skipped: true };
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPass },
    });

    const typeLabel = type === 'bug' ? '🐛 Bug Report' : type === 'feature' ? '✨ Feature Request' : '💡 Suggestion';
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://docket-app-alpha.vercel.app'}/admin/feedback`;

    await transporter.sendMail({
      from: `"Docket Feedback" <${gmailUser}>`,
      to: gmailUser,
      subject: `[Docket Feedback] ${typeLabel} — ${description.slice(0, 60)}${description.length > 60 ? '…' : ''}`,
      text: [
        'New feedback submitted on Docket.',
        '',
        `Type: ${type}`,
        `From: ${userEmail ?? 'unknown'}`,
        `Page: ${pageUrl ?? 'unknown'}`,
        `Feedback ID: ${feedbackId}`,
        '',
        'Description:',
        description,
        '',
        `Review at: ${adminUrl}`,
      ].join('\n'),
      html: `
        <h2>New Docket Feedback</h2>
        <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
          <tr><td><strong>Type</strong></td><td>${typeLabel}</td></tr>
          <tr><td><strong>From</strong></td><td>${userEmail ?? 'unknown'}</td></tr>
          <tr><td><strong>Page</strong></td><td>${pageUrl ?? 'unknown'}</td></tr>
          <tr><td><strong>ID</strong></td><td>${feedbackId}</td></tr>
        </table>
        <h3>Description</h3>
        <p style="white-space:pre-wrap;background:#f5f5f5;padding:16px;border-radius:4px">${description}</p>
        <p><a href="${adminUrl}" style="background:#2563eb;color:white;padding:8px 16px;border-radius:4px;text-decoration:none">Review in admin</a></p>
      `,
    });

    return { sent: true, to: gmailUser };
  },
);

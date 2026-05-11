// src/lib/mailer.ts
import nodemailer from 'nodemailer';

// ──────────────────────────────────────────────────────────────────────────
// Email Transporter Configuration
// ──────────────────────────────────────────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      'Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in .env',
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

// ──────────────────────────────────────────────────────────────────────────
// Send Email Function
// ──────────────────────────────────────────────────────────────────────────

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail({ to, subject, html, replyTo }: SendMailOptions): Promise<void> {
  try {
    const transporter = getTransporter();
    const SMTP_FROM = process.env.SMTP_FROM!;

    const mailOptions = {
      from: SMTP_FROM,
      to,
      subject,
      html,
      ...(replyTo && { replyTo }),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('[Mailer] Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Mailer] Failed to send email:', {
      to,
      subject,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Send Email to Multiple Recipients
// ──────────────────────────────────────────────────────────────────────────

interface SendMailToMultipleOptions {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMailToMultiple({
  to,
  subject,
  html,
  replyTo,
}: SendMailToMultipleOptions): Promise<void> {
  try {
    const transporter = getTransporter();
    const SMTP_FROM = process.env.SMTP_FROM!;

    const mailOptions = {
      from: SMTP_FROM,
      to: to.join(','),
      subject,
      html,
      ...(replyTo && { replyTo }),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('[Mailer] Email sent to multiple recipients:', {
      messageId: info.messageId,
      recipients: to.length,
      subject,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Mailer] Failed to send email to multiple recipients:', {
      recipients: to.length,
      subject,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Test Email Connection
// ──────────────────────────────────────────────────────────────────────────

export async function verifyMailerConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('[Mailer] SMTP connection verified successfully');
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Mailer] SMTP connection failed:', errorMsg);
    return false;
  }
}

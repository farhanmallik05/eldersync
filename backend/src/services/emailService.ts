import nodemailer from 'nodemailer';
import { db } from '../config/database.js';
import { NotificationRecord } from '../types/index.js';

export interface SendEmailOptions {
  idempotencyKey: string;
  patientId: string;
  recipientEmail: string;
  recipientRole: string;
  type: 'DOSE_REMINDER' | 'CAREGIVER_ESCALATION' | 'APPOINTMENT_REMINDER' | 'HELP_REQUEST';
  subject: string;
  html: string;
}

/**
 * Resend API email dispatch payload response format.
 */
interface ResendApiResponse {
  id?: string;
  statusCode?: number;
  message?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || 'ElderSync Alerts <alerts@eldersync.health>';

    // Configure SMTP if provided in environment
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  /**
   * Idempotently sends transactional email.
   * If a notification with the same idempotencyKey already exists, it is skipped.
   *
   * @param options - SendEmailOptions with unique idempotencyKey
   * @returns Object containing whether the email was newly sent and the persisted record
   */
  public async sendNotification(options: SendEmailOptions): Promise<{ sent: boolean; record: NotificationRecord }> {
    const { idempotencyKey, patientId, recipientEmail, recipientRole, type, subject, html } = options;

    // Check idempotency lock
    if (db.notifications.has(idempotencyKey)) {
      console.log(`[EmailService] Idempotency match: Notification '${idempotencyKey}' already sent. Skipping.`);
      return { sent: false, record: db.notifications.get(idempotencyKey)! };
    }

    let deliveryStatus: 'SENT' | 'FAILED' = 'SENT';
    let providerMessageId: string | undefined = undefined;

    // 1. Attempt delivery via Resend HTTP API if key provided
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.fromAddress,
            to: recipientEmail,
            subject,
            html,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as ResendApiResponse;
          providerMessageId = data.id;
          deliveryStatus = 'SENT';
        } else {
          console.error('[EmailService] Resend API error:', await response.text());
          deliveryStatus = 'FAILED';
        }
      } catch (err: unknown) {
        console.error('[EmailService] Resend network error:', err);
        deliveryStatus = 'FAILED';
      }
    }
    // 2. Or attempt delivery via SMTP transporter if configured
    else if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to: recipientEmail,
          subject,
          html,
        });
        providerMessageId = info.messageId;
        deliveryStatus = 'SENT';
      } catch (err: unknown) {
        console.error('[EmailService] SMTP error:', err);
        deliveryStatus = 'FAILED';
      }
    } else {
      // Out-of-the-box local demo mode: records email in outbox for live in-app inspection
      providerMessageId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      deliveryStatus = 'SENT';
      console.log(`[EmailService:LocalOutbox] Dispatched '${type}' to ${recipientEmail} (${subject})`);
    }

    // Persist to notifications collection with idempotencyKey
    const record: NotificationRecord = {
      idempotencyKey,
      patientId,
      recipientEmail,
      recipientRole,
      type,
      subject,
      bodyPreview: html.replace(/<[^>]+>/g, ' ').substring(0, 160).trim(),
      deliveryStatus,
      providerMessageId,
      sentAt: new Date().toISOString(),
    };

    db.notifications.set(idempotencyKey, record);
    return { sent: true, record };
  }
}

export const emailService = new EmailService();

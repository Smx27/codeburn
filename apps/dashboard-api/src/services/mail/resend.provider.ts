import { Resend } from 'resend';
import pino from 'pino';
import type { IMailProvider, SendMailOptions } from './mail.provider.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class ResendProvider implements IMailProvider {
  private resend: Resend;
  private from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    this.from = process.env.MAIL_FROM || 'AIInsight <noreply@aiinsight.dev>';
    this.resend = new Resend(apiKey);
  }

  async send(opts: SendMailOptions): Promise<void> {
    logger.info({ to: opts.to, subject: opts.subject }, 'Sending email via Resend');
    await this.resend.emails.send({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    logger.info({ to: opts.to }, 'Email sent successfully via Resend');
  }
}

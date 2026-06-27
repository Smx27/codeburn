import nodemailer from 'nodemailer';
import pino from 'pino';
import type { IMailProvider, SendMailOptions } from './mail.provider.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class SmtpProvider implements IMailProvider {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables are required');
    }

    this.from = process.env.SMTP_FROM || `Niriksh <${user}>`;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async send(opts: SendMailOptions): Promise<void> {
    logger.info({ to: opts.to, subject: opts.subject }, 'Sending email via SMTP');
    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    logger.info({ to: opts.to }, 'Email sent successfully via SMTP');
  }
}

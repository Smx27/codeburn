import type { IMailProvider } from './mail.provider.js';

let instance: IMailProvider | null = null;

export async function getMailProvider(): Promise<IMailProvider> {
  if (instance) return instance;

  const provider = (process.env.MAIL_PROVIDER || 'resend').toLowerCase();

  if (provider === 'smtp') {
    const { SmtpProvider } = await import('./smtp.provider.js');
    instance = new SmtpProvider();
  } else {
    const { ResendProvider } = await import('./resend.provider.js');
    instance = new ResendProvider();
  }

  return instance;
}

export type { IMailProvider, SendMailOptions } from './mail.provider.js';

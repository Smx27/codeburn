export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IMailProvider {
  send(opts: SendMailOptions): Promise<void>;
}

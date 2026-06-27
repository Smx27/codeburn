import type { EmailTemplate } from './index.js';

interface VerifyEmailProps {
  userName: string;
  verificationUrl: string;
  expiresIn: string;
}

export function verifyEmail(props: VerifyEmailProps): EmailTemplate {
  const subject = 'Verify your email - Niriksh';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:'Sora',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111827;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#77FF47,#22C55E);padding:40px;text-align:center;">
            <h1 style="color:#0a0f1a;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Verify Your Email</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi ${props.userName},</p>
            <p style="color:#9ca3af;font-size:16px;line-height:1.6;margin:0 0 24px;">
              Please verify your email address to activate your Niriksh account.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${props.verificationUrl}" style="display:inline-block;background-color:#77FF47;color:#0a0f1a;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Verify Email Address</a>
                </td>
              </tr>
            </table>
            <p style="color:#f59e0b;font-size:14px;margin:24px 0 0;text-align:center;">
              This link expires in ${props.expiresIn}.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="color:#6b7280;font-size:13px;margin:0 0 8px;text-align:center;">If you didn't create an account, you can safely ignore this email.</p>
            <p style="color:#6b7280;font-size:13px;margin:0;text-align:center;">Questions? Contact support@niriksh.dev</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${props.userName},

Please verify your email address to activate your Niriksh account.

Verify your email: ${props.verificationUrl}

This link expires in ${props.expiresIn}.

If you didn't create an account, you can safely ignore this email.
Questions? Contact support@niriksh.dev

— Niriksh`;

  return { subject, html, text };
}

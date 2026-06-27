import type { EmailTemplate } from './index.js';

interface PasswordResetProps {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

export function passwordReset(props: PasswordResetProps): EmailTemplate {
  const subject = 'Reset your password - Niriksh';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0f1a;font-family:'Sora',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111827;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#77FF47,#22C55E);padding:40px;text-align:center;">
            <h1 style="color:#0a0f1a;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Reset Your Password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi ${props.userName},</p>
            <p style="color:#9ca3af;font-size:16px;line-height:1.6;margin:0 0 24px;">
              We received a request to reset your password. Click the button below to choose a new one.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${props.resetUrl}" style="display:inline-block;background-color:#77FF47;color:#0a0f1a;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Reset Password</a>
                </td>
              </tr>
            </table>
            <p style="color:#f59e0b;font-size:14px;margin:24px 0 0;text-align:center;">
              This link expires in ${props.expiresIn}.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td style="padding:16px;background-color:#0a0f1a;border-radius:8px;border-left:3px solid #ef4444;">
                  <p style="color:#fca5a5;font-size:14px;margin:0;">
                    <strong>Security notice:</strong> If you didn't request this reset, please ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="color:#6b7280;font-size:13px;margin:0;text-align:center;">Niriksh — AI Token Usage Intelligence</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${props.userName},

We received a request to reset your password.

Reset your password: ${props.resetUrl}

This link expires in ${props.expiresIn}.

If you didn't request this reset, please ignore this email. Your password will remain unchanged.

— Niriksh`;

  return { subject, html, text };
}

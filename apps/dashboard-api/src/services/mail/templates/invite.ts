import type { EmailTemplate } from './index.js';

interface InviteProps {
  inviterName: string;
  organizationName: string;
  role: string;
  invitationUrl: string;
  expiresIn: string;
}

export function invite(props: InviteProps): EmailTemplate {
  const subject = `You've been invited to join ${props.organizationName} on AIInsight`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">You're Invited!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi there,</p>
            <p style="color:#cbd5e1;font-size:16px;line-height:1.6;margin:0 0 24px;">
              <strong style="color:#ffffff;">${props.inviterName}</strong> has invited you to join
              <strong style="color:#ffffff;">${props.organizationName}</strong> on AIInsight.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="padding:16px;background-color:#0f172a;border-radius:8px;">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">Your role</p>
                  <p style="color:#ffffff;font-size:16px;font-weight:600;margin:0;text-transform:capitalize;">${props.role}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${props.invitationUrl}" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Accept Invitation</a>
                </td>
              </tr>
            </table>
            <p style="color:#f59e0b;font-size:14px;margin:24px 0 0;text-align:center;">
              This invitation expires in ${props.expiresIn}.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #334155;">
            <p style="color:#64748b;font-size:13px;margin:0;text-align:center;">AIInsight — AI Analytics Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi there,

${props.inviterName} has invited you to join "${props.organizationName}" on AIInsight.

Your role: ${props.role}

Accept the invitation: ${props.invitationUrl}

This invitation expires in ${props.expiresIn}.

— AIInsight`;

  return { subject, html, text };
}

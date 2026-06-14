import type { EmailTemplate } from './index.js';

interface WelcomeProps {
  userName: string;
  organizationName: string;
  dashboardUrl: string;
}

export function welcome(props: WelcomeProps): EmailTemplate {
  const subject = 'Welcome to AIInsight';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Welcome to AIInsight</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi ${props.userName},</p>
            <p style="color:#cbd5e1;font-size:16px;line-height:1.6;margin:0 0 24px;">
              Welcome to <strong style="color:#ffffff;">AIInsight</strong>! Your organization <strong style="color:#ffffff;">${props.organizationName}</strong> is now set up and ready to go.
            </p>
            <p style="color:#cbd5e1;font-size:16px;line-height:1.6;margin:0 0 16px;">Here's how to get started:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="padding:12px 16px;background-color:#0f172a;border-radius:8px;margin-bottom:8px;">
                  <span style="color:#6366f1;font-weight:700;">1.</span>
                  <span style="color:#e2e8f0;margin-left:8px;">Install the agent on your machines</span>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:12px 16px;background-color:#0f172a;border-radius:8px;">
                  <span style="color:#6366f1;font-weight:700;">2.</span>
                  <span style="color:#e2e8f0;margin-left:8px;">Connect your AI providers (OpenAI, Anthropic, etc.)</span>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:12px 16px;background-color:#0f172a;border-radius:8px;">
                  <span style="color:#6366f1;font-weight:700;">3.</span>
                  <span style="color:#e2e8f0;margin-left:8px;">View your analytics dashboard in real-time</span>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${props.dashboardUrl}" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Open Dashboard</a>
                </td>
              </tr>
            </table>
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

  const text = `Hi ${props.userName},

Welcome to AIInsight! Your organization "${props.organizationName}" is now set up.

Getting started:
1. Install the agent on your machines
2. Connect your AI providers (OpenAI, Anthropic, etc.)
3. View your analytics dashboard in real-time

Open your dashboard: ${props.dashboardUrl}

— AIInsight`;

  return { subject, html, text };
}

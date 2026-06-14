import type { EmailTemplate } from './index.js';

interface SyncCompletedProps {
  userName: string;
  sessionsImported: number;
  providersDetected: string[];
  dashboardUrl: string;
}

export function syncCompleted(props: SyncCompletedProps): EmailTemplate {
  const subject = 'Historical sync complete - AIInsight';

  const providersList = props.providersDetected.length > 0
    ? props.providersDetected.map(p => `<li style="color:#e2e8f0;padding:4px 0;">${p}</li>`).join('')
    : '<li style="color:#94a3b8;padding:4px 0;">None detected</li>';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Sync Complete</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi ${props.userName},</p>
            <p style="color:#cbd5e1;font-size:16px;line-height:1.6;margin:0 0 24px;">
              Your historical data sync has finished. Here's the summary:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="padding:20px;background-color:#0f172a;border-radius:8px;text-align:center;">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Sessions Imported</p>
                  <p style="color:#6366f1;font-size:36px;font-weight:700;margin:0;">${props.sessionsImported.toLocaleString()}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="padding:16px;background-color:#0f172a;border-radius:8px;">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Providers Detected</p>
                  <ul style="color:#e2e8f0;font-size:16px;margin:0;padding-left:20px;list-style-type:disc;">
                    ${providersList}
                  </ul>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${props.dashboardUrl}" style="display:inline-block;background-color:#6366f1;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">View Dashboard</a>
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

Your historical data sync has finished.

Sessions Imported: ${props.sessionsImported.toLocaleString()}
Providers Detected: ${props.providersDetected.length > 0 ? props.providersDetected.join(', ') : 'None detected'}

View your dashboard: ${props.dashboardUrl}

— AIInsight`;

  return { subject, html, text };
}

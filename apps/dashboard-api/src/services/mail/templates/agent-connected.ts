import type { EmailTemplate } from './index.js';

interface AgentConnectedProps {
  machineName: string;
  os: string | null;
  organizationName: string;
  timestamp: string;
}

export function agentConnected(props: AgentConnectedProps): EmailTemplate {
  const subject = 'New agent connected - AIInsight';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">New Agent Connected</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#e2e8f0;font-size:16px;margin:0 0 24px;">
              A new AIInsight agent has connected to your organization.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="padding:16px;background-color:#0f172a;border-radius:8px;margin-bottom:12px;">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">Machine</p>
                  <p style="color:#ffffff;font-size:16px;font-weight:600;margin:0;">${props.machineName}</p>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:16px;background-color:#0f172a;border-radius:8px;">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">Operating System</p>
                  <p style="color:#ffffff;font-size:16px;font-weight:600;margin:0;">${props.os || 'Unknown'}</p>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:16px;background-color:#0f172a;border-radius:8px;">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">Organization</p>
                  <p style="color:#ffffff;font-size:16px;font-weight:600;margin:0;">${props.organizationName}</p>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:16px;background-color:#0f172a;border-radius:8px;">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;">Connected At</p>
                  <p style="color:#ffffff;font-size:16px;font-weight:600;margin:0;">${props.timestamp}</p>
                </td>
              </tr>
            </table>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0;">
              The agent is now online and will begin syncing session data automatically.
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

  const text = `New Agent Connected

A new AIInsight agent has connected to your organization.

Machine: ${props.machineName}
Operating System: ${props.os || 'Unknown'}
Organization: ${props.organizationName}
Connected At: ${props.timestamp}

The agent is now online and will begin syncing session data automatically.

— AIInsight`;

  return { subject, html, text };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export { welcome } from './welcome.js';
export { verifyEmail } from './verify-email.js';
export { passwordReset } from './password-reset.js';
export { invite } from './invite.js';
export { agentConnected } from './agent-connected.js';
export { syncCompleted } from './sync-completed.js';

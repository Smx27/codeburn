import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, organizationName } = req.body;

  if (!email || !password || !organizationName) {
    res.status(400).json({ error: 'Email, password, and organization name are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const result = await dashboardService.register(email, password, name || null, organizationName);
  if (!result) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const result = await dashboardService.login(email, password);
  if (!result) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.json(result);
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  const result = await dashboardService.refreshToken(refreshToken);
  if (!result) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  res.json(result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  await dashboardService.logout(userId);
  res.json({ success: true });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  const result = await dashboardService.verifyEmail(token);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ success: true });
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  await dashboardService.resendVerification(email);
  res.json({ success: true });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  await dashboardService.generatePasswordReset(email);
  res.json({ success: true });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password are required' });
    return;
  }

  const result = await dashboardService.resetPassword(token, newPassword);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ success: true });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  const result = await dashboardService.changePassword(userId, currentPassword, newPassword);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ success: true });
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { isApiKey, extractApiKeyPrefix } from '@aiinsight/auth-shared';
import { getUserById, getApiKeyByPrefix, updateApiKeyLastUsed } from '../repositories/dashboard.repository.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string | null;
  organizationId: string;
  role: string;
  machineId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      authMethod?: 'jwt' | 'api_key';
    }
  }
}

export function signToken(user: { id: string; email: string; name: string | null; organizationId: string; role: string; machineId?: string }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      orgId: user.organizationId,
      role: user.role,
      machineId: user.machineId,
    },
    JWT_SECRET as string,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, JWT_SECRET as string) as jwt.JwtPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    if (isApiKey(token)) {
      handleApiKeyAuth(token, req, res, next);
    } else {
      handleJwtAuth(token, req, res, next);
    }
  } else if (authHeader.startsWith('X-API-Key ')) {
    const apiKey = authHeader.slice(10);
    handleApiKeyAuth(apiKey, req, res, next);
  } else {
    res.status(401).json({ error: 'Invalid authorization format. Use Bearer <token> or X-API-Key <key>' });
  }
}

async function handleApiKeyAuth(apiKey: string, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prefix = extractApiKeyPrefix(apiKey);
    const keyRecord = await getApiKeyByPrefix(prefix);

    if (!keyRecord) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    const isValid = await argon2.verify(keyRecord.key_hash, apiKey);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.user = {
      userId: '',
      email: '',
      name: null,
      organizationId: keyRecord.organization_id,
      role: keyRecord.role,
    };
    req.authMethod = 'api_key';

    // Update last_used_at (fire-and-forget, debounced to once per 60s)
    updateApiKeyLastUsed(keyRecord.id).catch(() => {});

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
}

async function handleJwtAuth(token: string, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = verifyToken(token);
    const userId = payload.sub;

    if (!userId) {
      res.status(401).json({ error: 'Invalid token: missing subject' });
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization_id,
      role: user.role,
      machineId: payload.machineId as string | undefined,
    };
    req.authMethod = 'jwt';

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
}

export function orgAdminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'org_admin' && req.user.role !== 'owner' && req.user.role !== 'admin') {
    res.status(403).json({ error: 'Org admin access required' });
    return;
  }

  next();
}

export function ownerOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'owner') {
    res.status(403).json({ error: 'Owner access required' });
    return;
  }

  next();
}

export function adminOrAbove(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'org_admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  authMiddleware(req, res, next);
}
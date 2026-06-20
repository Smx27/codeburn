import { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { isApiKey, extractApiKeyPrefix } from '@aiinsight/auth-shared';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const REQUIRE_INGEST_AUTH = process.env.REQUIRE_INGEST_AUTH !== 'false';

interface IngestUser {
  userId: string;
  organizationId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      ingestUser?: IngestUser;
    }
  }
}

export function ingestAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!REQUIRE_INGEST_AUTH) {
    next();
    return;
  }

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
    res.status(401).json({ error: 'Invalid authorization format' });
  }
}

async function handleApiKeyAuth(apiKey: string, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { queryOne } = await import('../database/pool.js');
    const prefix = extractApiKeyPrefix(apiKey);

    const keyRecord = await queryOne<{ id: string; organization_id: string; key_hash: string; role: string }>(
      `SELECT id, organization_id, key_hash, role FROM api_keys WHERE prefix = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [prefix]
    );

    if (!keyRecord) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    const isValid = await argon2.verify(keyRecord.key_hash, apiKey);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.ingestUser = {
      userId: '',
      organizationId: keyRecord.organization_id,
      role: keyRecord.role,
    };

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
}

async function handleJwtAuth(token: string, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as jwt.JwtPayload;
    const userId = payload.sub;

    if (!userId) {
      res.status(401).json({ error: 'Invalid token: missing subject' });
      return;
    }

    const { queryOne } = await import('../database/pool.js');
    const user = await queryOne<{ id: string; organization_id: string; role: string }>(
      `SELECT id, organization_id, role FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.ingestUser = {
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
    };

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

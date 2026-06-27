import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const isDev = process.env.NODE_ENV !== 'production';
  const statusCode = (err as any).statusCode ?? 500;

  if (statusCode >= 500) {
    logger.error({ err, endpoint: req.method + ' ' + req.url }, 'Server error');
  }

  const body: Record<string, unknown> = {
    error: statusCode >= 500 ? 'Internal server error' : err.message,
  };
  if (isDev) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

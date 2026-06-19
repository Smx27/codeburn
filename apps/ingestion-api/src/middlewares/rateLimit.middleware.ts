import rateLimit from 'express-rate-limit';

export const ingestRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'] as string | undefined;
    const authHeader = req.headers['authorization'];
    if (apiKey) return `apikey:${apiKey}`;
    if (authHeader?.startsWith('Bearer ')) return `bearer:${authHeader.slice(7)}`;
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  },
  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  },
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
});

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  },
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
});

export const ingestRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const apiKey = req.headers['x-api-key'] as string | undefined;
    if (apiKey) return `apikey:${apiKey}`;
    return ipKeyGenerator(req, res);
  },
  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  },
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
});

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');
    if (apiKey && (apiKey.startsWith('cb_') || apiKey.startsWith('ai_'))) {
      return `apikey:${apiKey}`;
    }
    return ipKeyGenerator(req, res);
  },
  handler: (_req, res) => {
    res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  },
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
});

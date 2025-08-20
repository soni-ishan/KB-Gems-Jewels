import rateLimit from 'express-rate-limit';

// 10 requests / minute per IP (tune later)
export const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

// stricter for write ops (optional to reuse later)
export const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';
const defaultApiMax = isProd ? 300 : 10000;

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX ?? String(defaultApiMax), 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

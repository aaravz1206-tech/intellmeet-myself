import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    status: 429,
    message: 'Too many login attempts from this IP, please try again after 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
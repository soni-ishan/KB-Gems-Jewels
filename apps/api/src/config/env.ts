import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET should be at least 16 chars'),
  PUBLIC_BASE_URL: z.string().url(),
  WHATSAPP_PHONE_E164: z.string().regex(/^\d+$/, 'Use E.164 without +, digits only'),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12)
});

export const env = EnvSchema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';

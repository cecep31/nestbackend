import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  APP_BASE_URL: z.string().optional(),
  S3_END_POINT: z.string().optional(),
  S3_PORT: z.coerce.number().optional(),
  S3_USE_SSL: z.enum(['true', 'false']).optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  THROTTLE_TTL: z.coerce.number().optional(),
  THROTTLE_LIMIT: z.coerce.number().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENROUTER_DEFAULT_MODEL: z.string().optional(),
  OPENROUTER_MAX_TOKENS: z.coerce.number().optional(),
  OPENROUTER_TEMPERATURE: z.coerce.number().optional(),
  OBSERVE_APP_KEY: z.string().optional(),
  OBSERVE_APP_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

import { z } from 'zod';

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1).max(200),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

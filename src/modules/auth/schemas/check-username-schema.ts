import { z } from 'zod';

export const checkUsernameSchema = z.object({
  username: z.string().min(3).max(30),
});

export type CheckUsernameDto = z.infer<typeof checkUsernameSchema>;
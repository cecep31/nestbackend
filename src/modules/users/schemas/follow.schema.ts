import { z } from 'zod';

export const followUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
});

export type FollowUserDto = z.infer<typeof followUserSchema>;
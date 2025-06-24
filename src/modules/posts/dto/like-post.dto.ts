import { z } from 'zod';

export const LikePostSchema = z.object({
  post_id: z.string().uuid('Invalid post ID format'),
});

export type LikePostDto = z.infer<typeof LikePostSchema>;
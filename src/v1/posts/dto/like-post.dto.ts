import { z } from 'zod';

export const LikePostSchema = z.object({
  post_id: z.string().uuid('Invalid post ID format'),
});

export type LikePostDtoType = z.infer<typeof LikePostSchema>;

export class LikePostDto {
  post_id: string;
}

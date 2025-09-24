import { z } from "zod";

export const LikePostSchema = z.object({
  post_id: z.string().min(4, "Invalid post ID"),
});

export type LikePostDtoType = z.infer<typeof LikePostSchema>;

export class LikePostDto {
  post_id: string;
}

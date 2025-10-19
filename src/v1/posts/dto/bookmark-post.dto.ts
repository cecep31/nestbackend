import { z } from "zod";

export const BookmarkPostSchema = z.object({
  post_id: z.string().min(4, "Invalid post ID"),
});

export type BookmarkPostDtoType = z.infer<typeof BookmarkPostSchema>;

export class BookmarkPostDto {
  post_id: string;
}
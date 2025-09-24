import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  tags: z
    .union([
      z.string().transform((str) => {
        return JSON.parse(str);
      }),
      z.array(z.string())
    ])
    .optional(),
});

export type CreatePostDto = z.infer<typeof CreatePostSchema>;

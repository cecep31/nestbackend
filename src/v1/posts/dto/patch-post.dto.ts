import { z } from "zod";

export const PatchPostSchema = z.object({
  published: z.boolean().optional(),
  title: z.string().min(1, { message: "Title cannot be empty" }).optional(),
  body: z.string().min(1, { message: "Body cannot be empty" }).optional(),
  slug: z.string().optional(),
});

export type PatchPostDto = z.infer<typeof PatchPostSchema>;


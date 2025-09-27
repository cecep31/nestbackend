import { z } from "zod";

export const UpdatePublishedSchema = z.object({
  published: z.boolean(),
});

export type UpdatePublishedDto = z.infer<typeof UpdatePublishedSchema>;

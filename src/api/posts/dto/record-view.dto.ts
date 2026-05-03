import { z } from "zod";

export const RecordViewSchema = z.object({
  post_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
});

export type RecordViewDto = z.infer<typeof RecordViewSchema>;
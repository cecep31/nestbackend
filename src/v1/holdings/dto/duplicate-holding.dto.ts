import { z } from "zod";

export const DuplicateHoldingSchema = z
  .object({
    fromMonth: z.number().int().min(1).max(12),
    fromYear: z.number().int().min(1900).max(2100),
    toMonth: z.number().int().min(1).max(12),
    toYear: z.number().int().min(1900).max(2100),
    overwrite: z.boolean().optional().default(false),
  })
  .refine(
    (v) => v.fromMonth !== v.toMonth || v.fromYear !== v.toYear,
    { message: "Target month/year must differ from source." }
  );

export type DuplicateHoldingDto = z.infer<typeof DuplicateHoldingSchema>;


import { z } from "zod";

export const AdminCreatePostSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  slug: z.string().optional(),
  published: z.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
  created_by: z.string().uuid().optional(),
});

export const AdminUpdatePostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  body: z.string().min(1).optional(),
  slug: z.string().optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const AdminBulkOperationSchema = z.object({
  post_ids: z.array(z.string().uuid()).min(1),
  operation: z.enum(['publish', 'unpublish', 'delete']),
});

export const AdminPostQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  published: z.enum(['all', 'true', 'false']).optional().default('all'),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'published']).optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  creator_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

export type AdminCreatePostDto = z.infer<typeof AdminCreatePostSchema>;
export type AdminUpdatePostDto = z.infer<typeof AdminUpdatePostSchema>;
export type AdminBulkOperationDto = z.infer<typeof AdminBulkOperationSchema>;
export type AdminPostQueryDto = z.infer<typeof AdminPostQuerySchema>;
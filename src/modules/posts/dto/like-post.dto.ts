import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const LikePostSchema = z.object({
  post_id: z.string().uuid('Invalid post ID format'),
});

export type LikePostDtoType = z.infer<typeof LikePostSchema>;

export class LikePostDto {
  @ApiProperty({
    description: 'ID of the post to like',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  post_id: string;
}

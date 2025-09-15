import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  body: z.string().min(1, 'Body is required'),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
});

export type CreatePostDtoType = z.infer<typeof CreatePostSchema>;

export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'My First Blog Post',
    minLength: 1,
  })
  title: string;

  @ApiProperty({
    description: 'Post slug for URL',
    example: 'my-first-blog-post',
    minLength: 1,
  })
  slug: string;

  @ApiProperty({
    description: 'Post content body',
    example: 'This is the content of my first blog post...',
    minLength: 1,
  })
  body: string;

  @ApiProperty({
    description: 'Array of tags for the post',
    example: ['technology', 'programming', 'web-development'],
    required: false,
    type: [String],
  })
  tags?: string[];

  @ApiProperty({
    description: 'Post featured image URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  image?: string;
}

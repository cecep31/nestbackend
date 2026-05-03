import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async getAllTags() {
    const tags = await this.tagsService.getAllTags();
    return {
      success: true,
      message: 'Tags fetched successfully',
      data: tags,
    };
  }
}

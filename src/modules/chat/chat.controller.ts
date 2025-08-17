import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Extend Express Request type to include user
interface RequestWithUser extends Request {
  user: {
    user_id: string;
    // Add other user properties if needed
  };
}
import { ChatService } from './services/chat.service';
import { CreateConversationDto, createConversationSchema } from './dto/create-conversation.dto';
import { SendMessageDto, sendMessageSchema } from './dto/send-message.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { MessageResponseDto } from './dto/conversation-response.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
@Controller({
  path: 'chat',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for creating conversations
  createConversation(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(createConversationSchema))
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.chatService.createConversation(
      req.user.user_id,
      createConversationDto,
    );
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for sending messages
  sendMessage(
    @Req() req: RequestWithUser,
    @Param('id') conversationId: string,
    @Body(new ZodValidationPipe(sendMessageSchema))
    sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    return this.chatService.sendMessage(
      req.user.user_id,
      conversationId,
      sendMessageDto,
    );
  }

  @Get('conversations')
  listConversations(
    @Req() req: RequestWithUser,
  ): Promise<ConversationResponseDto[]> {
    return this.chatService.listConversations(req.user.user_id);
  }

  @Get('conversations/:id')
  getConversation(
    @Req() req: RequestWithUser,
    @Param('id') conversationId: string,
  ): Promise<ConversationResponseDto> {
    return this.chatService.getConversation(req.user.user_id, conversationId);
  }

  @Delete('conversations/:id')
  deleteConversation(
    @Req() req: RequestWithUser,
    @Param('id') conversationId: string,
  ): Promise<void> {
    return this.chatService.deleteConversation(
      req.user.user_id,
      conversationId,
    );
  }

  @Post(':id/messages/stream')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for streaming messages
  async streamMessage(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('id') conversationId: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) sendMessageDto: SendMessageDto,
  ): Promise<void> {
    // Set headers for SSE-like streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    
    try {
      const stream = this.chatService.streamMessage(
        req.user.user_id,
        conversationId,
        sendMessageDto,
      );

      stream.subscribe({
        next: (chunk: string) => {
          // Format as SSE data like ChatGPT
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        },
        error: (error: any) => {
          console.error('Streaming error:', error);
          res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        },
        complete: () => {
          // Send completion signal like ChatGPT
          res.write('data: [DONE]\n\n');
          res.end();
        },
      });
    } catch (error) {
      console.error('Stream setup error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Failed to start streaming' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}

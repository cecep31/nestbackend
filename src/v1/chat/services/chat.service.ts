import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Observable } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma.service";
import { OpenRouterService } from "../../../common/ai/openrouter.service";
import { CreateConversationDto } from "../dto/create-conversation.dto";
import { SendMessageDto } from "../dto/send-message.dto";
import {
  ConversationResponseDto,
  ConversationWithMessagesResponseDto,
  MessageResponseDto,
} from "../dto/conversation-response.dto";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly defaultModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly openRouterService: OpenRouterService,
    private readonly configService: ConfigService
  ) {
    this.defaultModel =
      this.configService.get("openrouter.defaultModel") ||
      "x-ai/grok-4-fast";
  }

  streamMessage(
    userId: string,
    conversationId: string,
    sendMessageDto: SendMessageDto
  ): Observable<string> {
    return new Observable<string>((observer) => {
      (async () => {
        try {
          // Verify conversation exists and belongs to user
          const conversation = await this.prisma.chat_conversations.findUnique({
            where: { id: conversationId, user_id: userId },
          });
          if (!conversation) {
            observer.error(new NotFoundException("Conversation not found"));
            return;
          }

          // Save user message to database first
          await this.prisma.chat_messages.create({
            data: {
              conversation_id: conversationId,
              user_id: userId,
              role: "user",
              content: sendMessageDto.content,
            },
          });

          // Get previous messages for context (including the just-saved user message)
          const previousMessages = await this.prisma.chat_messages.findMany({
            where: { conversation_id: conversationId },
            orderBy: { created_at: "desc" },
            take: 10,
          });

          const messages = previousMessages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

          let assistantResponse = "";

          // Stream from OpenRouterService
          this.openRouterService
            .createChatCompletionStream(messages, {
              model: sendMessageDto.model,
              temperature: sendMessageDto.temperature,
            })
            .subscribe({
              next: (chunk) => {
                assistantResponse += chunk;
                observer.next(chunk);
              },
              error: (err) => {
                this.logger.error("Streaming error:", err);
                observer.error(err);
              },
              complete: async () => {
                try {
                  // Save the complete assistant response to database
                  await this.prisma.chat_messages.create({
                    data: {
                      conversation_id: conversationId,
                      user_id: userId,
                      role: "assistant",
                      content: assistantResponse,
                      model: sendMessageDto.model || this.defaultModel,
                    },
                  });

                  // Update conversation's updated_at timestamp
                  await this.prisma.chat_conversations.update({
                    where: { id: conversationId },
                    data: { updated_at: new Date() },
                  });

                  observer.complete();
                } catch (saveError) {
                  this.logger.error(
                    "Error saving assistant response:",
                    saveError
                  );
                  observer.error(saveError);
                }
              },
            });
        } catch (error) {
          this.logger.error("Error in streamMessage:", error);
          observer.error(error);
        }
      })();
    });
  }

  async createConversation(
    userId: string,
    createConversationDto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    const { title, message } = createConversationDto;

    // Create conversation in database
    const conversation = await this.prisma.chat_conversations.create({
      data: {
        title: title || "New Conversation",
        user_id: userId,
      },
    });

    return this.formatConversationResponse(conversation);
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    sendMessageDto: SendMessageDto
  ): Promise<MessageResponseDto> {
    // Verify conversation exists and belongs to user
    const conversation = await this.prisma.chat_conversations.findUnique({
      where: { id: conversationId, user_id: userId },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    // Get previous messages for context
    const previousMessages = await this.prisma.chat_messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: "asc" },
      take: 10, // Limit context to last 10 messages
    });

    // Format messages for AI
    const messages = [
      ...previousMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: sendMessageDto.content },
    ];

    // Get AI response
    const aiResponse = await this.getAiResponse(
      userId,
      conversationId,
      messages,
      {
        model: sendMessageDto.model,
        temperature: sendMessageDto.temperature,
      }
    );

    return aiResponse;
  }

  async getConversation(
    userId: string,
    conversationId: string
  ): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.chat_conversations.findFirst({
      where: { id: conversationId, user_id: userId },
      include: {
        chat_messages: {
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    return this.formatConversationResponseWithMessages(
      conversation,
      conversation.chat_messages
    );
  }

  async listConversations(
    userId: string,
    offset: number = 0,
    limit: number = 10
  ): Promise<{ conversationsData: ConversationResponseDto[]; metadata: any }> {
    const conversations = await this.prisma.chat_conversations.findMany({
      where: { user_id: userId },
      skip: offset,
      take: limit,
      orderBy: { updated_at: "desc" },
    });

    // Count total conversations for metadata
    const totalConversations = await this.prisma.chat_conversations.count({
      where: { user_id: userId },
    });

    const totalPages = Math.ceil(totalConversations / limit);

    const conversationsData = conversations.map((conv) =>
      this.formatConversationResponse(conv)
    );

    const metadata = {
      total_items: totalConversations,
      offset: offset,
      limit: limit,
      total_pages: totalPages,
    };

    return { conversationsData, metadata };
  }

  async deleteConversation(
    userId: string,
    conversationId: string
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.chat_messages.deleteMany({
        where: { conversation_id: conversationId },
      }),
      this.prisma.chat_conversations.deleteMany({
        where: { id: conversationId, user_id: userId },
      }),
    ]);
  }

  private async getAiResponse(
    userId: string,
    conversationId: string,
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    options: { model?: string; temperature?: number } = {}
  ): Promise<MessageResponseDto> {
    try {
      const response = await this.openRouterService.createChatCompletion(
        messages,
        {
          model: options.model || this.defaultModel,
          temperature: options.temperature,
        }
      );

      const aiMessage = response.choices[0]?.message;
      const usage = response.usage;

      if (!aiMessage) {
        throw new Error("No response from AI");
      }

      // Save AI response to database
      const savedMessage = await this.prisma.chat_messages.create({
        data: {
          conversation_id: conversationId,
          user_id: userId, // Associate AI response with the user
          role: "assistant",
          content: aiMessage.content,
          model: response.model,
          prompt_tokens: usage?.prompt_tokens || null,
          completion_tokens: usage?.completion_tokens || null,
          total_tokens: usage?.total_tokens || null,
        },
      });

      // Update conversation's updated_at timestamp
      await this.prisma.chat_conversations.update({
        where: { id: conversationId },
        data: { updated_at: new Date() },
      });

      return this.formatMessageResponse(savedMessage);
    } catch (error) {
      this.logger.error("Error getting AI response:", error);
      throw new Error("Failed to get AI response");
    }
  }

  private formatMessageResponse(message: any): MessageResponseDto {
    return {
      id: message.id,
      role: message.role as "user" | "assistant" | "system",
      content: message.content,
      model: message.model || undefined,
      promptTokens: message.prompt_tokens || undefined,
      completionTokens: message.completion_tokens || undefined,
      totalTokens: message.total_tokens || undefined,
      createdAt: message.created_at,
    };
  }

  private formatConversationResponse(
    conversation: any
    // messages: any[],
  ): ConversationResponseDto {
    return {
      id: conversation.id,
      title: conversation.title,
      workspaceId: conversation.workspace_id || undefined,
      // messages: messages.map((msg) => this.formatMessageResponse(msg)),
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }
  private formatConversationResponseWithMessages(
    conversation: any,
    messages: any[]
  ): ConversationWithMessagesResponseDto {
    return {
      id: conversation.id,
      title: conversation.title,
      workspaceId: conversation.workspace_id || undefined,
      messages: messages.map((msg) => this.formatMessageResponse(msg)),
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
    };
  }
}

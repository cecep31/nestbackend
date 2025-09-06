import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { EmailService } from '../email/email.service';

export interface NewPostNotificationData {
  postId: string;
  postTitle: string;
  postSlug: string;
  authorName: string;
  postExcerpt?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Send new post notification to all super admin users except the author
   * @param data - The new post notification data
   */
  async notifyNewPost(data: NewPostNotificationData): Promise<void> {
    try {
      // Get all active users' emails (excluding the author)
      const subscribers = await this.getSubscriberEmails(data.postId);

      if (subscribers.length === 0) {
        this.logger.log('No subscribers found for new post notification');
        return;
      }

      this.logger.log(
        `Sending new post notification to ${subscribers.length} subscribers`,
      );

      // Send email notification
      const success = await this.emailService.sendNewPostNotification(
        subscribers,
        data.postTitle,
        data.postSlug,
        data.authorName,
        data.postExcerpt,
      );

      if (success) {
        this.logger.log(
          `New post notification sent successfully for post: ${data.postTitle}`,
        );
      } else {
        this.logger.error(
          `Failed to send new post notification for post: ${data.postTitle}`,
        );
      }
    } catch (error) {
      this.logger.error('Error sending new post notification:', error);
    }
  }

  private async getSubscriberEmails(postId: string): Promise<string[]> {
    try {
      // Get the post author to exclude them from notifications
      const post = await this.prisma.posts.findUnique({
        where: { id: postId },
        select: { created_by: true },
      });

      if (!post) {
        this.logger.warn(`Post with ID ${postId} not found`);
        return [];
      }

      // Get all super admin users except the post author
      const users = await this.prisma.users.findMany({
        where: {
          deleted_at: null,
          is_super_admin: true,
          // Exclude the post author from notifications
          ...(post.created_by && {
            id: {
              not: post.created_by,
            },
          }),
        },
        select: {
          email: true,
        },
      });

      return users
        .map((user) => user.email)
        .filter((email): email is string => email !== null);
    } catch (error) {
      this.logger.error('Error fetching subscriber emails:', error);
      return [];
    }
  }

  // Future enhancement: Add method to manage user subscription preferences
  async updateUserNotificationPreferences(
    userId: string,
    preferences: {
      emailNotifications?: boolean;
      newPostNotifications?: boolean;
    },
  ): Promise<void> {
    // This could be implemented with a user_notification_preferences table
    // For now, we'll log the intent
    this.logger.log(
      `User ${userId} notification preferences update requested:`,
      preferences,
    );
    // TODO: Implement when notification preferences table is added to schema
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailNotificationData {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.logger.log('Email service initialized (no email provider configured)');
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async sendEmail(_emailData: EmailNotificationData): Promise<boolean> {
    this.logger.warn('Email service is disabled. Skipping email send.');
    return true; // Return true to indicate "success" even though no email was sent
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async sendNewPostNotification(
    subscriberEmails: string[],
    postTitle: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _postSlug: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _authorName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _postExcerpt?: string,
  ): Promise<boolean> {
    if (!subscriberEmails.length) {
      this.logger.log('No subscribers to notify for new post');
      return true;
    }

    this.logger.warn(
      `Email notifications are disabled. Would have sent notification for post: ${postTitle} to ${subscriberEmails.length} subscribers`,
    );

    return true; // Return true to indicate "success" even though no emails were sent
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateNewPostEmailTemplate(_data: {
    postTitle: string;
    postSlug: string;
    authorName: string;
    postExcerpt: string;
  }): string {
    // This method is kept for API compatibility but won't be used when emails are disabled
    return '';
  }
}

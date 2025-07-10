import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailNotificationData {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.fromEmail = this.configService.get<string>('resend.fromEmail') || 'noreply@example.com';
    
    if (!apiKey) {
      this.logger.warn('Resend API key not configured. Email notifications will be disabled.');
      return;
    }
    
    this.resend = new Resend(apiKey);
    this.logger.log('Email service initialized with Resend');
  }

  async sendEmail(emailData: EmailNotificationData): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email send.');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: emailData.from || this.fromEmail,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      });

      if (error) {
        this.logger.error('Failed to send email:', error);
        return false;
      }

      this.logger.log(`Email sent successfully. ID: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return false;
    }
  }

  async sendNewPostNotification(
    subscriberEmails: string[],
    postTitle: string,
    postSlug: string,
    authorName: string,
    postExcerpt?: string
  ): Promise<boolean> {
    if (!subscriberEmails.length) {
      this.logger.log('No subscribers to notify for new post');
      return true;
    }

    const subject = `New Post: ${postTitle}`;
    const html = this.generateNewPostEmailTemplate({
      postTitle,
      postSlug,
      authorName,
      postExcerpt: postExcerpt || 'Check out this new post!',
    });

    return this.sendEmail({
      to: subscriberEmails,
      subject,
      html,
    });
  }

  private generateNewPostEmailTemplate(data: {
    postTitle: string;
    postSlug: string;
    authorName: string;
    postExcerpt: string;
  }): string {
    const { postTitle, postSlug, authorName, postExcerpt } = data;
    const baseUrl = this.configService.get<string>('app.baseUrl') || 'http://localhost:3000';
    const postUrl = `${baseUrl}/posts/${postSlug}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Post Notification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #ffffff;
            padding: 30px 20px;
            border: 1px solid #e1e5e9;
            border-top: none;
          }
          .post-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 15px 0;
            color: #2c3e50;
          }
          .author {
            color: #7f8c8d;
            margin-bottom: 20px;
          }
          .excerpt {
            color: #555;
            margin-bottom: 25px;
            line-height: 1.7;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border: 1px solid #e1e5e9;
            border-top: none;
            border-radius: 0 0 8px 8px;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📝 New Post Published!</h1>
        </div>
        
        <div class="content">
          <h2 class="post-title">${postTitle}</h2>
          <p class="author">By ${authorName}</p>
          <p class="excerpt">${postExcerpt}</p>
          
          <a href="${postUrl}" class="cta-button">Read Full Post</a>
        </div>
        
        <div class="footer">
          <p>You're receiving this email because you subscribed to new post notifications.</p>
          <p>If you no longer wish to receive these emails, you can unsubscribe at any time.</p>
        </div>
      </body>
      </html>
    `;
  }
}
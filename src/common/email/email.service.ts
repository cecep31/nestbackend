import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    this.loadTemplates();
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    if (fs.existsSync(templatesDir)) {
      const templateFiles = fs
        .readdirSync(templatesDir)
        .filter((file) => file.endsWith('.hbs'));

      templateFiles.forEach((file) => {
        const templateName = file.replace('.hbs', '');
        const templatePath = path.join(templatesDir, file);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const compiledTemplate = handlebars.compile(templateSource);
        this.templates.set(templateName, compiledTemplate);
      });
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    const fromEmail =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER');
    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
      text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendTemplateEmail(
    to: string,
    templateName: string,
    context: Record<string, any>,
    subject?: string,
  ): Promise<void> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Add default context values
    const defaultContext = {
      appName: this.configService.get<string>('APP_NAME', 'Your App'),
      ...context,
    };

    const html = template(defaultContext);
    const emailSubject =
      subject || this.extractSubjectFromHtml(html) || 'Notification';

    await this.sendEmail(to, emailSubject, html);
  }

  private extractSubjectFromHtml(html: string): string | null {
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1] : null;
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    name?: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    const context = {
      name: name || 'User',
      resetUrl,
      expiryHours: 1,
    };

    await this.sendTemplateEmail(to, 'password-reset', context);
  }
}

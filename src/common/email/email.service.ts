import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import * as handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private readonly logger = new Logger(EmailService.name);
  private isDevelopment = process.env.NODE_ENV === "development";

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>("SMTP_HOST");
    const smtpUser = this.configService.get<string>("SMTP_USER");
    const smtpPass = this.configService.get<string>("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        "SMTP configuration is incomplete. Email functionality may be limited."
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: this.configService.get<number>("SMTP_PORT", 587),
      secure: this.configService.get<boolean>("SMTP_SECURE", false),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Add connection pooling and retry logic
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });

    // Verify connection in development
    if (this.isDevelopment) {
      this.verifyTransporter();
    }
  }

  private async verifyTransporter() {
    try {
      await this.transporter.verify();
      this.logger.log("SMTP connection verified successfully");
    } catch (error) {
      this.logger.error("SMTP connection verification failed:", error.message);
    }
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, "templates");

    if (!fs.existsSync(templatesDir)) {
      this.logger.warn(`Templates directory not found: ${templatesDir}`);
      return;
    }

    try {
      const templateFiles = fs
        .readdirSync(templatesDir)
        .filter((file) => file.endsWith(".hbs"));

      if (templateFiles.length === 0) {
        this.logger.warn("No template files found in templates directory");
        return;
      }

      templateFiles.forEach((file) => {
        try {
          const templateName = file.replace(".hbs", "");
          const templatePath = path.join(templatesDir, file);
          const templateSource = fs.readFileSync(templatePath, "utf8");
          const compiledTemplate = handlebars.compile(templateSource);
          this.templates.set(templateName, compiledTemplate);
          this.logger.debug(`Template loaded: ${templateName}`);
        } catch (error) {
          this.logger.error(`Failed to load template ${file}:`, error.message);
        }
      });

      this.logger.log(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.error("Failed to load email templates:", error.message);
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    if (!this.transporter) {
      const msg =
        "Email transporter not initialized. Check SMTP configuration.";
      this.logger.error(msg);
      throw new Error(msg);
    }

    const fromEmail =
      this.configService.get<string>("SMTP_FROM") ||
      this.configService.get<string>("SMTP_USER");

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
      text,
    };

    this.logger.debug(`Sending email to ${to} with subject: ${subject}`);

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${to}. Message ID: ${result.messageId}`
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendTemplateEmail(
    to: string,
    templateName: string,
    context: Record<string, any>,
    subject?: string
  ): Promise<void> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Add default context values
    const defaultContext = {
      appName: this.configService.get<string>("APP_NAME", "Your App"),
      ...context,
    };

    const html = template(defaultContext);
    const emailSubject =
      subject || this.extractSubjectFromHtml(html) || "Notification";

    await this.sendEmail(to, emailSubject, html);
  }

  private extractSubjectFromHtml(html: string): string | null {
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1] : null;
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    name?: string
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>("FRONTEND_URL")}/reset-password?token=${resetToken}`;

    const context = {
      name: name || "User",
      resetUrl,
      expiryHours: 1,
    };

    await this.sendTemplateEmail(to, "password-reset", context);
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const loginUrl =
      this.configService.get<string>("FRONTEND_URL") ||
      `${this.configService.get<string>("APP_URL")}/login`;

    const context = {
      name,
      loginUrl,
    };

    await this.sendTemplateEmail(to, "welcome", context);
  }

  async sendGenericEmail(
    to: string,
    subject: string,
    content: string,
    options?: { unsubscribeUrl?: string }
  ): Promise<void> {
    const context = {
      subject,
      content,
      unsubscribeUrl: options?.unsubscribeUrl,
    };

    await this.sendTemplateEmail(to, "generic", context, subject);
  }

  // Utility methods
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error("Connection test failed:", error.message);
      return false;
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

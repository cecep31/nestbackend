# Email Service with Templates

This directory contains the email service with Handlebars template support for your NestJS application.

## 📁 Structure

```
src/common/email/
├── email.service.ts      # Main email service
├── email.module.ts       # Email module
├── templates/            # Email templates directory
│   ├── welcome.hbs       # Welcome email template
│   ├── password-reset.hbs # Password reset template
│   └── generic.hbs       # Generic email template
└── README.md            # This file
```

## 🚀 Usage

### Basic Email Methods

```typescript
import { EmailService } from '../common/email/email.service';

@Controller('auth')
export class AuthController {
  constructor(private emailService: EmailService) {}

  @Post('register')
  async register(@Body() userData: any) {
    // Create user...

    // Send welcome email using template
    await this.emailService.sendWelcomeEmail(userData.email, userData.name);

    return { message: 'User registered successfully' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const resetToken = 'generated-reset-token';

    // Send password reset email using template
    await this.emailService.sendPasswordResetEmail(body.email, resetToken, 'John Doe');

    return { message: 'Password reset email sent' };
  }
}
```

### Template Methods

```typescript
// Send email using a specific template
await emailService.sendTemplateEmail(
  'user@example.com',
  'welcome',
  {
    name: 'John Doe',
    loginUrl: 'https://yourapp.com/login'
  }
);

// Send generic email with custom content
await emailService.sendGenericEmail(
  'user@example.com',
  'Custom Subject',
  '<h1>Hello!</h1><p>This is a custom email.</p>',
  { unsubscribeUrl: 'https://yourapp.com/unsubscribe' }
);
```

### Basic Email (without templates)

```typescript
// Send plain HTML email
await emailService.sendEmail(
  'user@example.com',
  'Subject',
  '<h1>Hello</h1><p>This is HTML content</p>',
  'This is plain text content' // optional
);
```

## 📧 Available Templates

### 1. Welcome Template (`welcome.hbs`)

**Context Variables:**
- `appName` - Application name (from env.APP_NAME)
- `name` - User's name
- `loginUrl` - Login page URL

**Usage:**
```typescript
await emailService.sendWelcomeEmail('user@example.com', 'John Doe');
```

### 2. Password Reset Template (`password-reset.hbs`)

**Context Variables:**
- `appName` - Application name (from env.APP_NAME)
- `name` - User's name
- `resetUrl` - Password reset URL with token
- `expiryHours` - Token expiry time in hours

**Usage:**
```typescript
await emailService.sendPasswordResetEmail('user@example.com', 'reset-token', 'John Doe');
```

### 3. Generic Template (`generic.hbs`)

**Context Variables:**
- `appName` - Application name (from env.APP_NAME)
- `subject` - Email subject
- `content` - HTML content
- `unsubscribeUrl` - Unsubscribe URL (optional)

**Usage:**
```typescript
await emailService.sendGenericEmail(
  'user@example.com',
  'Newsletter',
  '<h1>Monthly Update</h1><p>Here are the latest updates...</p>'
);
```

## ⚙️ Configuration

Add these environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Application
APP_NAME=Your App Name
FRONTEND_URL=http://localhost:3000
```

## 🎨 Creating Custom Templates

1. Create a new `.hbs` file in the `templates/` directory
2. Use Handlebars syntax for dynamic content: `{{variableName}}`
3. The service will automatically load and compile your template
4. Use the `sendTemplateEmail()` method to send emails with your template

### Example Custom Template

```handlebars
<!DOCTYPE html>
<html>
<head>
  <title>{{subject}}</title>
</head>
<body>
  <h1>{{title}}</h1>
  <p>Hello {{name}},</p>
  <p>{{message}}</p>
  <a href="{{actionUrl}}">{{actionText}}</a>
</body>
</html>
```

## 🧪 Testing

Run the test script to verify templates:

```bash
node test-email.js
```

This will:
- Check if templates exist
- Test template compilation
- Show available templates

## 📝 Notes

- Templates are automatically loaded on service initialization
- All templates receive `appName` by default
- Template files must have `.hbs` extension
- Templates support all Handlebars features (conditionals, loops, etc.)
- Email subjects are extracted from template `<title>` tags when not provided

## 🔧 Gmail Setup

For Gmail SMTP:

1. Enable 2-Factor Authentication
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password in `SMTP_PASS`
4. Use your Gmail address in `SMTP_USER`

## 📧 Template Features

- **Responsive Design**: All templates are mobile-friendly
- **Modern Styling**: Clean, professional appearance
- **Customizable**: Easy to modify colors, fonts, and layout
- **Handlebars Support**: Full templating engine capabilities
- **Conditional Content**: Use `{{#if}}` blocks for dynamic content

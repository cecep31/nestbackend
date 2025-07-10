# Email Notifications with Resend

This application now supports email notifications for new posts using Resend.

## Setup

### 1. Install Dependencies
The Resend package has already been installed:
```bash
npm install resend
```

### 2. Environment Variables
Add the following environment variables to your `.env` file:

```env
# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
APP_BASE_URL=http://localhost:3000
```

### 3. Get Resend API Key
1. Sign up at [Resend](https://resend.com)
2. Create an API key in your dashboard
3. Add the API key to your environment variables
4. Verify your domain or use the test domain provided by Resend

## Features

### Automatic Email Notifications
- **Trigger**: Automatically sends email notifications when a new post is published
- **Recipients**: All super admin users except the post author
- **Content**: Beautiful HTML email with post title, author, excerpt, and read more link

### Email Template
The email includes:
- Attractive header with gradient background
- Post title and author information
- Post excerpt (first 200 characters)
- "Read Full Post" call-to-action button
- Professional footer with unsubscribe information

## How It Works

### 1. Post Creation Flow
When a new post is created via the `POST /posts` endpoint:
1. Post is saved to the database
2. If the post is published, the notification system is triggered
3. System fetches all active user emails (excluding the author)
4. Sends email notifications asynchronously
5. Logs success/failure without affecting the post creation

### 2. Services Architecture

#### EmailService (`src/common/email/email.service.ts`)
- Handles Resend integration
- Provides email sending functionality
- Generates HTML email templates
- Includes error handling and logging

#### NotificationService (`src/common/notifications/notification.service.ts`)
- Manages notification logic
- Fetches subscriber emails from database
- Coordinates with EmailService
- Excludes post authors from notifications

#### PostsService Integration
- Modified `createPost` method to trigger notifications
- Asynchronous notification sending (non-blocking)
- Error handling to prevent post creation failures

## Configuration Options

### Environment Variables
- `RESEND_API_KEY`: Your Resend API key (required)
- `RESEND_FROM_EMAIL`: The sender email address (default: noreply@example.com)
- `APP_BASE_URL`: Base URL for post links in emails (default: http://localhost:3000)

### Customization
You can customize the email template by modifying the `generateNewPostEmailTemplate` method in `EmailService`.

## Testing

### 1. Test Email Sending
Create a new post through the API:
```bash
POST /posts
{
  "title": "Test Post",
  "body": "This is a test post to verify email notifications.",
  "slug": "test-post"
}
```

### 2. Check Logs
Monitor the application logs for email sending status:
- Success: "Email sent successfully. ID: [resend_id]"
- Failure: "Failed to send email: [error_details]"

## Future Enhancements

### User Notification Preferences
The system includes a placeholder for user notification preferences:
```typescript
async updateUserNotificationPreferences(
  userId: string,
  preferences: {
    emailNotifications?: boolean;
    newPostNotifications?: boolean;
  }
): Promise<void>
```

To implement this:
1. Add a `user_notification_preferences` table to the database
2. Update the notification service to check user preferences
3. Add API endpoints for users to manage their preferences

### Additional Notification Types
- Comment notifications
- Like notifications
- Weekly digest emails
- Welcome emails for new users

## Troubleshooting

### Common Issues

1. **No emails being sent**
   - Check if `RESEND_API_KEY` is set correctly
   - Verify the API key is valid in Resend dashboard
   - Check application logs for error messages

2. **Emails going to spam**
   - Verify your domain with Resend
   - Use a proper `RESEND_FROM_EMAIL` with your verified domain
   - Consider adding SPF, DKIM, and DMARC records

3. **Build errors**
   - Ensure all imports are correct
   - Check that NotificationModule is imported in PostsModule
   - Verify Prisma schema is up to date

### Logs to Monitor
- `EmailService`: Resend integration status and email sending results
- `NotificationService`: Subscriber fetching and notification coordination
- `PostsService`: Post creation and notification triggering

## Security Considerations

- API keys are loaded from environment variables
- No sensitive information is logged
- Email addresses are fetched securely from the database
- Async notification sending prevents blocking post creation
- Error handling prevents system crashes from email failures
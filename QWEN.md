# NestJS Backend Project Context

## Project Overview

This is a NestJS-based backend application for a blog/content management system. The project uses TypeScript and follows NestJS conventions for structuring a scalable server-side application.

Key technologies and features:
- **Framework**: NestJS v11
- **Language**: TypeScript
- **Database**: Prisma ORM (with PostgreSQL as the database provider, based on the schema)
- **Authentication**: JWT-based authentication with Passport
- **API Documentation**: Swagger/OpenAPI integration
- **Rate Limiting**: @nestjs/throttler for API rate limiting
- **File Storage**: S3-compatible storage (MinIO) integration
- **Real-time Communication**: WebSocket support with Socket.IO
- **Configuration**: Environment-based configuration using @nestjs/config
- **Testing**: Jest for unit and e2e testing
- **Package Manager**: Bun

## Project Structure

The project follows a standard NestJS module-based architecture with versioned API endpoints:

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── config/
│   └── configuration.ts
├── common/
│   ├── interceptors/
│   └── logger/
├── db/
├── main.ts
└── v1/
    ├── auth/
    ├── chat/
    ├── note/
    │   ├── pages/
    │   └── workspaces/
    ├── posts/
    ├── tags/
    ├── users/
    └── writer/
```

## Building and Running

### Prerequisites

- Bun (as the package manager and runtime)
- PostgreSQL instance (configured via DATABASE_URL)
- S3-compatible storage (MinIO) instance (configured via S3 environment variables)

### Development Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables by copying `.env.example` to `.env` and filling in the appropriate values.

3. Generate Prisma client:
   ```bash
   bunx prisma generate
   ```

4. Run database migrations:
   ```bash
   bunx prisma db push
   # or
   bunx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   bun run start:dev
   ```

### Production Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Build the application:
   ```bash
   bun run build
   ```

3. Generate Prisma client:
   ```bash
   bunx prisma generate
   ```

4. Run database migrations:
   ```bash
   bunx prisma migrate deploy
   ```

5. Start the production server:
   ```bash
   bun run start:prod
   ```

### Testing

- Run unit tests:
  ```bash
  bun run test
  ```

- Run end-to-end tests:
  ```bash
  bun run test:e2e
  ```

- Run tests with coverage:
  ```bash
  bun run test:cov
  ```

## Development Conventions

### Code Style

- TypeScript with strict typing
- ESLint for linting with configuration based on `@eslint/eslintrc`
- Class-based structure using NestJS decorators
- Validation using class-validator and class-transformer

### Module Structure

Each feature is organized as a NestJS module in the `src/v1` directory. Modules typically include:
- Controllers for handling HTTP requests
- Services for business logic
- Repositories for database operations
- DTOs (Data Transfer Objects) for request/response validation
- Entities or models for data representation

### Configuration

Configuration is managed through environment variables and the `src/config/configuration.ts` file. The application supports different environments through the NODE_ENV variable.

### API Documentation

Swagger documentation is available at `/api/docs` in non-production environments. The documentation is automatically generated from the code using NestJS Swagger decorators.

### Authentication

JWT tokens are used for authentication. Passport is configured with local and JWT strategies for login and authentication respectively.

### Rate Limiting

Rate limiting is implemented using @nestjs/throttler with configuration options in the environment variables.

## Key Features

1. **User Management**: Registration, login, profile management
2. **Content Management**: Create, read, update, delete posts with tags
3. **Comments System**: Commenting on posts with real-time WebSocket support
4. **Workspaces and Pages**: Hierarchical content organization
5. **User Following**: Follow/unfollow users and view follow statistics
6. **Tagging System**: Create and manage tags for posts
7. **File Uploads**: Image uploads using S3-compatible storage (MinIO)
8. **View Tracking**: Track and analyze post views
9. **Admin Features**: Administrative capabilities for managing users and content
10. **Chat System**: Real-time chat functionality with AI integration
11. **Post Interactions**: Likes, bookmarks, and other post interactions

## API Standards

The API uses URI versioning with the `/v1/` prefix and follows REST conventions with a standardized response format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Response data (optional)
  "error": "Error message", // Only present on errors
  "meta": {} // Pagination metadata (optional)
}
```

Authentication is handled via JWT tokens in the Authorization header.

## Database Schema

The application uses a PostgreSQL database with the following main entities:

- **users**: User accounts with authentication data
- **posts**: Blog posts with title, content, and metadata
- **tags**: Post tags for categorization
- **post_comments**: Comments on posts with parent-child relationships
- **post_likes**: Likes on posts
- **post_views**: View tracking for posts
- **post_bookmarks**: Post bookmarks by users
- **profiles**: Extended user profile information
- **files**: File uploads
- **chat_conversations**: Real-time chat conversations
- **chat_messages**: Messages within chat conversations
- **user_follows**: User following relationships

## Environment Variables

The application requires several environment variables for configuration:

- `DATABASE_URL`: PostgreSQL database connection string
- `JWT_SECRET`: Secret for JWT token signing
- `THROTTLE_TTL` and `THROTTLE_LIMIT`: Rate limiting configuration
- `S3_*` variables: S3-compatible storage configuration
- `SMTP_*` variables: Email configuration
- `OPENROUTER_*` variables: AI API configuration
- `PORT`: Application port (default 3001)
- `FRONTEND_URL`: Frontend application URL for CORS and email links
# NestJS Backend Project Context

## Project Overview

This is a NestJS-based backend application for a blog/content management system. The project uses TypeScript and follows NestJS conventions for structuring a scalable server-side application.

Key technologies and features:
- **Framework**: NestJS v11
- **Language**: TypeScript
- **Database**: Prisma ORM (with MongoDB as the database provider, based on the configuration)
- **Authentication**: JWT-based authentication with Passport
- **API Documentation**: Swagger/OpenAPI integration
- **Logging**: Winston for logging
- **Validation**: class-validator and class-transformer
- **Rate Limiting**: @nestjs/throttler
- **File Storage**: MinIO integration
- **Real-time Communication**: WebSocket support with Socket.IO
- **Configuration**: Environment-based configuration using @nestjs/config
- **Testing**: Jest for unit and e2e testing
- **Package Manager**: Bun

## Project Structure

The project follows a standard NestJS module-based architecture:

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── config/
│   ├── configuration.ts
│   └── winston.ts
├── common/
│   ├── interceptors/
│   └── logger/
├── db/
├── main.ts
└── modules/
    ├── admin/
    ├── article/
    ├── auth/
    ├── chat/
    ├── me/
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
- MongoDB instance (configured via DATABASE_URL)
- MinIO instance (configured via MinIO environment variables)

### Development Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables by copying `.env.example` to `.env` and filling in the appropriate values.

3. Start the development server:
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

3. Start the production server:
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
- ESLint for linting with Prettier for code formatting
- Class-based structure using NestJS decorators
- Validation using class-validator

### Module Structure

Each feature is organized as a NestJS module in the `src/modules` directory. Modules typically include:
- Controllers for handling HTTP requests
- Services for business logic
- DTOs (Data Transfer Objects) for request/response validation
- Entities or models for data representation

### Configuration

Configuration is managed through environment variables and the `src/config/configuration.ts` file. The application supports different environments through the NODE_ENV variable.

### Logging

Logging is implemented using Winston with a custom configuration in `src/config/winston.ts`. A global logger middleware is applied to all routes.

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
7. **File Uploads**: Image uploads using MinIO
8. **View Tracking**: Track and analyze post views
9. **Admin Features**: Administrative capabilities for managing users and content

## API Standards

The API follows REST conventions with a standardized response format:
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
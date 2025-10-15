# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive NestJS backend application built with TypeScript, following modern Node.js best practices. The application features user authentication, content management (posts, notes, chat), and various utility services. It uses Prisma ORM with PostgreSQL, implements JWT authentication, and includes email notifications and file storage capabilities.

## Key Technologies

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.9+
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport (Local & GitHub strategies)
- **API**: RESTful with URI versioning (/v1)
- **Validation**: class-validator, zod
- **Email**: nodemailer with handlebars templates
- **File Storage**: MinIO-compatible service
- **Testing**: Jest
- **Package Manager**: Bun
- **Linting**: ESLint with TypeScript ESLint

## Project Structure

```
src/
├── common/           # Shared utilities and services
│   ├── email/        # Email service and templates
│   ├── logger/       # Logging middleware
│   ├── pipes/        # Custom pipes
│   ├── s3/          # File storage service
│   └── schemas/      # Shared DTOs and schemas
├── config/          # Configuration files
├── db/             # Database module and Prisma service
│   ├── db.module.ts  # Global database module
│   ├── prisma.service.ts # Prisma client with lifecycle management
│   └── generated/    # Prisma generated client (auto-generated)
├── v1/             # API version 1 modules
│   ├── auth/       # Authentication and authorization
│   ├── users/      # User management
│   ├── posts/      # Content posts
│   ├── note/       # Workspaces and pages
│   ├── me/         # User profile endpoints
│   ├── tags/       # Tag management
│   ├── writer/     # Writing tools
│   └── chat/       # Real-time chat
├── app.module.ts   # Main application module
└── main.ts         # Application bootstrap
```

## Core Modules and Relationships

**AppModule** (src/app.module.ts:21-64) - Main application module that imports all feature modules and configures:
- Global throttling guard (10 requests/60s) via ThrottlerModule
- Logger middleware for all routes via NestMiddleware
- Configuration service via ConfigModule
- Database module via DbModule
- Global validation pipe with whitelist, transform, and forbidNonWhitelisted

**DbModule** (src/db/db.module.ts:1-9) - Global module providing PrismaService to all modules, implements OnModuleInit and OnModuleDestroy for proper database lifecycle management

**AuthModule** (src/v1/auth/auth.module.ts:1-29) - Authentication with JWT and GitHub OAuth
- Exports AuthService for other modules
- Provides JWT strategy (6h expiration) and GitHub strategy
- Requires DbModule for user data access
- Uses PassportModule and JwtModule

**UsersModule** - User management with UserRepository pattern
**PostsModule** - Content management (imports DbModule, AuthModule)
**Note modules** - Workspace and page management (PagesModule, WorkspacesModule)
**EmailModule** - Email notifications service with handlebars templates
**ChatModule** - WebSocket-based chat functionality

## Development Commands

### Installation
```bash
bun install
```

### Running the Application
```bash
# Development mode with watch
bun run start:dev

# Production mode
bun run start:prod

# Basic start
bun run start

# Debug mode
bun run start:debug
```

### Testing
```bash
# All unit tests
bun test

# Watch mode for tests
bun run test:watch

# Test coverage
bun run test:cov

# End-to-end tests
bun run test:e2e

# Debug tests
bun run test:debug
```

### Code Quality
```bash
# Lint and fix code
bun run lint

# Build application
bun run build
```

### Nest CLI (if installed)
```bash
# Install Nest CLI globally
bun add -g @nestjs/cli

# Generate new modules, controllers, services
nest generate module <name>
nest generate controller <name>
nest generate service <name>
nest generate resource <name>  # Generate CRUD resource
```

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Check Prisma schema
npx prisma validate
```

## Key Configuration

Environment variables are managed in `.env` file (see `.env.example`). Important configurations:

- `NODE_ENV` - Application environment (development, production)
- `PORT` - Server port (defaults to 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `S3_*` - File storage configuration (endPoint, accessKey, secretKey, bucket)
- `EMAIL_*` - Email service settings (SMTP configuration)
- `throttler.ttl` and `throttler.limit` - Rate limiting (60s, 10 requests)
- `OPENROUTER_*` - AI integration configuration

## Application Lifecycle and Error Handling

**Global Setup** (src/main.ts:12-30):
- API versioning enabled (URI type)
- CORS configured with FRONTEND_URL origin
- Global validation pipe with whitelist, forbidNonWhitelisted, and transform

**Error Handling** (src/main.ts:54-63):
- Global uncaught exception handler
- Global unhandled rejection handler
- Graceful shutdown handlers for SIGTERM and SIGINT

**Database Lifecycle** (src/db/prisma.service.ts:22-39):
- Connection logging on module init
- Graceful disconnection on module destroy
- Error handling for connection failures

## Common Patterns

1. **Controllers** - Use URI versioning (/v1/endpoint), inherit from BaseController patterns
2. **Services** - Inject PrismaService for database operations, use Repository pattern
3. **DTOs** - Use class-validator decorators for input validation, located in common/schemas/
4. **Authentication** - Use @UseGuards(AuthGuard('jwt')) for protected routes
5. **Error Handling** - Global validation pipe with whitelist and transform enabled
6. **Logging** - Logger middleware (src/common/logger/logger.middleware.ts:15-34) applied to all routes with high-resolution timing
7. **Global Guards** - ThrottlerGuard applied globally via APP_GUARD token
8. **Global Pipes** - ValidationPipe applied globally with strict validation settings

## Testing

Test files follow the pattern `*.spec.ts`. Main test file is `test/app.e2e-spec.ts`. Tests use Jest with ts-jest transformer. Coverage reports generated in `../coverage` directory. E2E tests use custom Jest configuration in `test/jest-e2e.json`.

## File Operations and Generation

- **Creating new modules**: Use `nest generate module <name>`
- **Creating controllers**: Use `nest generate controller <name>`
- **Creating services**: Use `nest generate service <name>`
- **Creating CRUD resources**: Use `nest generate resource <name>`
- **Database migrations**: Use `npx prisma migrate dev --name <migration-name>`
- **Prisma client**: Auto-generated, never edit files in `src/db/generated/`

## Important Files

- `src/main.ts` - Application bootstrap, global configuration, and lifecycle management
- `src/app.module.ts` - Main module imports and global middleware setup
- `src/db/prisma.service.ts` - Database connection, lifecycle management, and error handling
- `src/config/configuration.ts` - Environment configuration with S3, OpenRouter, and throttling settings
- `src/common/logger/logger.middleware.ts` - HTTP request/response logging middleware
- `.env.example` - Environment variable template
- `test/jest-e2e.json` - End-to-end test configuration
- `.eslintrc.js` - ESLint configuration with TypeScript ESLint

## Development Best Practices

1. **Environment Variables**: Always use ConfigService to access environment variables
2. **Database Operations**: Use PrismaService with proper error handling
3. **Logging**: Use Logger middleware for HTTP requests, Winston/Logger for application logs
4. **Validation**: Always use class-validator decorators on DTOs
5. **Error Handling**: Implement proper try-catch blocks and use NestJS exception filters
6. **Testing**: Write unit tests for services, integration tests for controllers
7. **Code Quality**: Run `npm run lint` before committing code
8. **Type Safety**: Enable strict TypeScript checking and use type guards
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive NestJS 11.x backend application built with TypeScript 5.9+, following modern Node.js best practices. The application features user authentication, content management (posts, notes, chat), and various utility services. It uses Prisma ORM with PostgreSQL, implements JWT authentication with GitHub OAuth, includes email notifications with Handlebars templates, and provides MinIO-compatible file storage. The architecture follows modular design patterns with comprehensive error handling, rate limiting, and WebSocket support for real-time features.

## Key Technologies

- **Framework**: NestJS 11.x with TypeScript 5.9+
- **Database**: PostgreSQL with Prisma ORM (v6.19.0)
- **Authentication**: JWT with Passport (Local & GitHub strategies), 6-hour token expiration
- **API**: RESTful with URI versioning (/v1)
- **Validation**: class-validator, Zod schemas with custom pipes
- **Email**: nodemailer with Handlebars templates
- **File Storage**: MinIO-compatible service (AWS S3 compatible)
- **Real-time**: Socket.IO for WebSocket communication
- **AI Integration**: OpenRouter API for AI chat functionality
- **Testing**: Jest with ts-jest transformer
- **Package Manager**: Bun
- **Linting**: ESLint with TypeScript ESLint
- **Security**: bcrypt for password hashing, rate limiting (10 req/60s)

## Project Structure

```
src/
├── app.controller.ts             # Root application controller
├── app.module.ts                # Main application module with global configuration
├── app.service.ts               # Root application service
├── main.ts                      # Application bootstrap with lifecycle management
├── config/                      # Environment configuration
│   └── configuration.ts         # Configuration factory
├── common/                      # Shared utilities and services
│   ├── email/                   # Email service with Handlebars templates
│   │   ├── email.module.ts
│   │   ├── email.service.ts
│   │   └── templates/           # welcome, password-reset, generic templates
│   ├── logger/
│   │   └── logger.middleware.ts # HTTP request/response logging middleware
│   ├── s3/                     # MinIO-compatible file storage service
│   │   ├── minio.module.ts
│   │   └── minio.service.ts
│   ├── pipes/                  # Custom validation pipes
│   │   └── zod-validation.pipe.ts
│   ├── interceptors/           # Response interceptors
│   │   └── big-int.interceptor.ts
│   └── utils/                  # Utility functions
│       └── big-int.util.ts
├── db/                        # Database layer
│   ├── db.module.ts           # Global database module
│   ├── prisma.service.ts      # Prisma client with lifecycle management
│   └── generated/             # Auto-generated Prisma client (excluded from edits)
├── filters/                   # Exception handling
│   ├── index.ts
│   └── ws-exception.filter.ts # WebSocket exception filter
└── v1/                        # API version 1 modules
    ├── auth/                  # Authentication and authorization
    │   ├── auth.module.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   ├── guards/            # Authentication guards
    │   ├── strategies/        # Passport strategies (JWT, GitHub)
    │   └── dto/               # Authentication DTOs
    ├── users/                 # User management
    │   ├── users.module.ts
    │   ├── users.service.ts
    │   ├── users.controller.ts
    │   └── users.repository.ts
    ├── posts/                 # Content management
    │   ├── posts.module.ts
    │   ├── posts.service.ts
    │   ├── posts.repository.ts
    │   ├── controllers/       # Multiple controllers (posts, admin-posts)
    │   ├── dto/               # Data transfer objects
    │   ├── posts.gateway.ts   # WebSocket gateway for real-time features
    │   └── user-map-service.ts # User socket mapping service
    ├── note/                  # Workspace and page management
    │   ├── pages/             # Page management
    │   └── workspaces/        # Workspace management
    ├── tags/                  # Tag management
    ├── writer/                # Writing tools
    ├── chat/                  # AI-powered chat functionality
    │   ├── chat.module.ts
    │   ├── chat.controller.ts
    │   ├── services/          # Chat and OpenRouter services
    │   ├── dto/               # Chat-related DTOs
    │   └── interfaces/        # Type definitions
    └── me/                    # User profile endpoints
```

## Core Modules and Relationships

**AppModule** (src/app.module.ts:21-64) - Central application module configuring:
- Global throttling guard (10 requests/60s) via ThrottlerModule.forRootAsync
- Logger middleware applied globally via MiddlewareConsumer
- Configuration service via ConfigModule.forRoot with global scope
- Database access via DbModule
- BigInt serialization via BigIntInterceptor as global interceptor
- ValidationPipe with whitelist, transform, and forbidNonWhitelisted

**DbModule** (src/db/db.module.ts:1-9) - Global database module providing:
- PrismaService as global singleton
- Database connection lifecycle management (OnModuleInit/OnModuleDestroy)
- Connection error handling and logging

**AuthModule** (src/v1/auth/auth.module.ts:1-29) - Authentication system:
- JWT strategy with 6-hour expiration and bcrypt password hashing
- GitHub OAuth strategy using passport-github2
- Exports AuthService for dependency injection across modules
- Provides JwtAuthGuard and optional guards for route protection

**PostsModule** - Content management system:
- Repository pattern with PostsRepository for database abstraction
- WebSocket gateway (PostsGateway) for real-time features
- UserMapService for socket-to-user mapping
- File upload integration with MinIO service
- Comprehensive CRUD operations with pagination

**ChatModule** - AI-powered chat system:
- OpenRouter integration for AI model access
- Streaming responses via Server-Sent Events
- Conversation and message management
- Rate limiting and conversation history

**EmailModule** - Notification system:
- Handlebars templating for dynamic email content
- Support for welcome, password reset, and generic templates
- SMTP configuration with nodemailer
- Async email delivery

**Module Dependencies**:
```
AppModule
├── ConfigModule (Global)
├── ThrottlerModule (Global)
├── DbModule (Global)
├── AuthModule → Exports AuthService
├── UsersModule → Uses AuthModule, DbModule
├── PostsModule → Uses AuthModule, DbModule, EmailModule, MinioModule
├── PagesModule → Uses AuthModule, DbModule
├── WorkspacesModule → Uses AuthModule, DbModule
├── ChatModule → Uses AuthModule, DbModule
└── EmailModule → Independent
```

## Development Commands

### Installation and Setup
```bash
# Install dependencies
bun install

# Install NestJS CLI globally (optional but recommended)
bun add -g @nestjs/cli

# Copy environment template
cp .env.example .env

# Install Prisma CLI (if not already installed)
npm install -g prisma
```

### Running the Application
```bash
# Development mode with hot reload
bun run start:dev

# Production mode (after building)
bun run start:prod

# Basic start (development)
bun run start

# Debug mode with inspector
bun run start:debug

# Build application for production
bun run build
```

### Testing
```bash
# Run all unit tests
bun test

# Run tests in watch mode
bun run test:watch

# Generate test coverage report
bun run test:cov

# Run end-to-end tests
bun run test:e2e

# Run tests in debug mode
bun run test:debug

# Run specific test file
bun test --testPathPattern=auth

# Run tests with verbose output
bun test --verbose

# Run specific test by name
bun test --testNamePattern="should create user"
```

### Code Quality and Linting
```bash
# Lint and auto-fix code
bun run lint

# Check TypeScript compilation
npx tsc --noEmit

# Check Prisma schema validation
npx prisma validate
```

### Database Operations
```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (GUI for database)
npx prisma studio

# Push schema to database (development only)
npx prisma db push

# Generate migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset
```

### Nest CLI Commands
```bash
# Generate new module
nest generate module <name>

# Generate new controller
nest generate controller <name>

# Generate new service
nest generate service <name>

# Generate CRUD resource (controller, service, module)
nest generate resource <name>

# Generate new DTO
nest generate class <name> --type=dto

# Generate new guard
nest generate guard <name>

# Generate new interceptor
nest generate interceptor <name>

# Generate new pipe
nest generate pipe <name>

# Generate new filter
nest generate filter <name>
```

### Common Development Workflow
```bash
# 1. Start development server
bun run start:dev

# 2. Run tests in watch mode (in another terminal)
bun run test:watch

# 3. Generate new feature
nest generate resource post

# 4. Run linting before commit
bun run lint

# 5. Build and test production build
bun run build && bun run test:e2e
```

## Key Configuration

Environment variables are managed in `.env` file (see `.env.example`). The configuration is loaded via `src/config/configuration.ts` using NestJS ConfigModule.

### Server Configuration
- `NODE_ENV` - Application environment (development, production, test)
- `PORT` - Server port (defaults to 3001)
- `APP_BASE_URL` - Frontend application URL for email links
- `APP_NAME` - Application name for email templates

### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string (required)
  - Format: `postgresql://username:password@host:port/database`

### Authentication Configuration
- `JWT_SECRET` - JWT signing secret (required for production)
  - Use strong, unique secret in production
  - 6-hour token expiration configured in AuthModule

### Rate Limiting Configuration
- `THROTTLE_TTL` - Time window in seconds (defaults to 60)
- `THROTTLE_LIMIT` - Number of requests allowed per TTL (defaults to 10)
- Applied globally via ThrottlerGuard

### OpenRouter AI Configuration
- `OPENROUTER_API_KEY` - OpenRouter API key for AI chat
- `OPENROUTER_BASE_URL` - API base URL (defaults to https://openrouter.ai/api/v1)
- `OPENROUTER_DEFAULT_MODEL` - Default AI model (defaults to openai/gpt-3.5-turbo)
- `OPENROUTER_MAX_TOKENS` - Maximum tokens per request (defaults to 4000)
- `OPENROUTER_TEMPERATURE` - AI response creativity (defaults to 0.7)

### SMTP Email Configuration
- `SMTP_HOST` - SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (587 for TLS, 465 for SSL)
- `SMTP_SECURE` - Use SSL/TLS (true/false)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password or app password
- `SMTP_FROM` - Sender email address for outgoing emails

### S3/MinIO File Storage Configuration
- `S3_BUCKET` - Storage bucket name
- `S3_USE_SSL` - Enable SSL (true/false)
- `S3_END_POINT` - Storage endpoint URL
- `S3_ACCESS_KEY` - Access key/username
- `S3_SECRET_KEY` - Secret key/password
- `S3_REGION` - Storage region (for AWS S3)
- `S3_PORT` - Storage endpoint port

### Configuration Loading
The configuration is loaded asynchronously and validated at application startup. Missing required environment variables will cause the application to fail fast with descriptive error messages.

Configuration access pattern:
```typescript
// In any injectable service/controller
constructor(private configService: ConfigService) {}

const jwtSecret = this.configService.get<string>('jwt_secret');
const s3Config = this.configService.get('s3');
```

## Application Lifecycle and Error Handling

**Global Application Setup** (src/main.ts:12-30):
- API versioning enabled (URI type) for backward compatibility
- CORS configured with FRONTEND_URL origin or wildcard fallback
- Global validation pipe with whitelist, forbidNonWhitelisted, and transform enabled
- Graceful shutdown handlers for SIGTERM and SIGINT signals
- Global error handlers for uncaught exceptions and unhandled rejections

**Database Lifecycle** (src/prisma.service.ts:22-39):
- Connection logging on module initialization with connection details
- Graceful disconnection on module destruction
- Error handling for connection failures with retry logic
- Health check endpoint integration for monitoring

**Global Middleware and Guards** (src/app.module.ts:54-66):
- ThrottlerGuard applied globally via APP_GUARD token (10 requests per 60 seconds)
- LoggerMiddleware applied to all routes via MiddlewareConsumer
- BigIntInterceptor as global interceptor for BigInt serialization
- ValidationPipe with strict settings applied globally

**Error Handling Patterns**:
- HTTP exceptions use NestJS built-in exception classes
- WebSocket exceptions handled via WsExceptionFilter
- Database errors handled via PrismaClientKnownRequestError
- Custom error responses follow standard format:
```typescript
{
  success: false,
  message: "Error description",
  error: "Error code or details",
  meta: {} // Optional additional info
}
```

**Health Monitoring**:
- Application health endpoint at root level
- Database connection health checks
- Graceful error responses for monitoring systems
- Structured logging for debugging and monitoring

## Common Patterns and Conventions

### Architectural Patterns
1. **Modular Architecture**: Feature-based modules with clear boundaries and dependencies
2. **Dependency Injection**: Extensive use of NestJS DI system for loose coupling
3. **Repository Pattern**: Data access abstraction in services (PostsRepository, UsersRepository)
4. **Global Configuration**: Centralized configuration management via ConfigModule
5. **Middleware Pattern**: Global request/response processing via middleware
6. **Guard Pattern**: Authentication and authorization via guards (JwtAuthGuard, ThrottlerGuard)
7. **Interceptor Pattern**: Response transformation and logging via interceptors
8. **Exception Filters**: Custom error handling for different transport layers

### Naming Conventions
- **Modules**: `*.module.ts` - Feature modules with imports/providers/exports
- **Services**: `*.service.ts` - Business logic and data processing
- **Controllers**: `*.controller.ts` - HTTP request handlers
- **Repositories**: `*.repository.ts` - Data access layer abstraction
- **DTOs**: `*.dto.ts` - Data transfer objects for validation
- **Guards**: `*.guard.ts` - Authentication/authorization logic
- **Strategies**: `*.strategy.ts` - Passport authentication strategies
- **Middleware**: `*.middleware.ts` - Request/response processing
- **Interceptors**: `*.interceptor.ts` - Response transformation
- **Filters**: `*.filter.ts` - Exception handling
- **Pipes**: `*.pipe.ts` - Input validation and transformation

### Code Organization Principles
- **Versioned APIs**: All endpoints use `/v1/` namespace for version control
- **Feature-based Modules**: Each domain has its own module with all related components
- **Shared Utilities**: Common functionality isolated in `common/` directory
- **Type Safety**: Comprehensive TypeScript types and interfaces
- **Validation**: Zod schemas for runtime validation with custom pipes
- **Error Handling**: Consistent error response format across all endpoints
- **Logging**: Structured logging with different levels (debug, info, warn, error)
- **Security**: Input validation, rate limiting, authentication on all protected routes

### API Design Patterns
- **RESTful Endpoints**: Standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Pagination**: Consistent pagination with offset/limit or cursor-based approaches
- **Filtering**: Query parameter-based filtering with validation
- **Sorting**: Query parameter-based sorting with whitelist validation
- **Search**: Full-text search capabilities where applicable
- **File Upload**: Multer integration with MinIO storage backend
- **WebSocket Events**: Real-time features via Socket.IO with proper authentication

### Validation and Security Patterns
- **DTO Validation**: Zod schemas with custom validation pipes for complex validation
- **Input Sanitization**: Automatic sanitization via validation pipes
- **Rate Limiting**: Global throttling with configurable limits per time window
- **Authentication**: JWT tokens with 6-hour expiration and refresh capabilities
- **Authorization**: Role-based access control via guards
- **CORS**: Configurable CORS policies with frontend URL whitelisting
- **SQL Injection**: Prisma ORM prevents SQL injection attacks
- **XSS Protection**: Automatic escaping in Handlebars templates

### Error Handling Strategy
- **Global Exception Filters**: HTTP and WebSocket exception handling
- **Custom Exceptions**: Domain-specific exception classes
- **Structured Error Responses**: Consistent error format across all endpoints
- **Logging Integration**: Comprehensive error logging with context
- **Graceful Degradation**: Fallback behaviors for non-critical failures
- **Health Monitoring**: Health check endpoints for monitoring systems

## Testing Strategy

The application uses Jest as the testing framework with comprehensive unit and integration testing.

### Test Structure and Organization
```
test/                          # End-to-end tests
├── app.e2e-spec.ts           # Application-level E2E tests
└── jest-e2e.json             # E2E test configuration

src/
├── **/*.spec.ts              # Unit tests alongside implementation
├── **/*.test.ts              # Alternative test file pattern
└── test/                     # Test utilities and fixtures (if present)
```

### Test Configuration
- **Jest Setup**: Configured in `package.json` with TypeScript support via ts-jest
- **E2E Configuration**: Separate Jest config in `test/jest-e2e.json` for integration tests
- **Coverage**: Generated in `../coverage` directory with comprehensive coverage reporting
- **Test Environment**: Node.js environment for all tests

### Testing Patterns

**Unit Tests**:
- Service layer testing with mocked dependencies
- Controller testing with Supertest for HTTP integration
- Repository pattern testing with Prisma client mocking
- Validation pipe testing with various input scenarios
- Guard testing with different authentication states

**Integration Tests**:
- End-to-end API testing via Supertest
- Database integration testing with test database
- Authentication flow testing
- File upload/download testing
- WebSocket connection testing

**Test Utilities**:
- Test database setup and teardown
- Mock data factories for users, posts, etc.
- Authentication helpers for test JWT generation
- Database seeding for consistent test data

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode for development
bun run test:watch

# Generate coverage report
bun run test:cov

# Run only unit tests
bun test --testPathIgnorePatterns=e2e

# Run only E2E tests
bun run test:e2e

# Run tests for specific module
bun test --testPathPattern=auth

# Run tests with verbose output
bun test --verbose

# Run specific test by name
bun test --testNamePattern="should create user"

# Run tests in debug mode
bun run test:debug
```

### Test Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: External dependencies (email, file storage, AI services) should be mocked
3. **Database**: Use separate test database or transaction rollback for data isolation
4. **Authentication**: Use test JWT tokens for authenticated endpoint testing
5. **Cleanup**: Ensure proper cleanup of test data and resources
6. **Coverage**: Aim for high test coverage, especially for business logic and error paths

### Common Test Scenarios

**Authentication Tests**:
- User registration and validation
- Login with valid/invalid credentials
- JWT token generation and validation
- GitHub OAuth flow
- Protected route access

**API Tests**:
- CRUD operations for all resources
- Input validation and error handling
- File upload and download
- Pagination and filtering
- Rate limiting enforcement

**Business Logic Tests**:
- Post creation and publishing workflow
- User follow/unfollow functionality
- Comment and like systems
- Chat conversation management
- File storage operations

### Performance and Load Testing

While not currently implemented, the application architecture supports:
- Load testing via Artillery or similar tools
- Database performance testing
- API response time monitoring
- Memory leak detection in long-running processes

## File Operations and Development Guidelines

### Creating New Features

**NestJS CLI Generators**:
```bash
# Generate complete CRUD resource (controller, service, module, DTOs)
nest generate resource <name>

# Generate individual components
nest generate module <name>
nest generate controller <name>
nest generate service <name>
nest generate guard <name>
nest generate interceptor <name>
nest generate pipe <name>
nest generate filter <name>
nest generate class <name> --type=dto

# Generate authentication components
nest generate guard jwt-auth
nest generate strategy jwt
nest generate strategy github
```

**Manual File Creation Guidelines**:
- Always create files in the appropriate feature module
- Follow naming conventions (see Common Patterns section)
- Include proper TypeScript types and interfaces
- Add comprehensive JSDoc comments for public methods
- Implement proper error handling and validation

### Database Operations

**Prisma Workflow**:
```bash
# 1. Update schema.prisma
# 2. Generate Prisma client
npx prisma generate

# 3. Create and run migration
npx prisma migrate dev --name "add_new_feature"

# 4. (Optional) Reset database in development
npx prisma migrate reset
```

**Database Best Practices**:
- Use migrations for all schema changes, never edit generated client
- Add proper indexes for frequently queried fields
- Implement soft deletes with deleted_at fields where appropriate
- Use appropriate field types (BigInt for counters, UUID for IDs)
- Add referential integrity constraints and cascading deletes
- Include proper indexes for performance (see existing schema patterns)

### Code Quality Guidelines

**TypeScript Best Practices**:
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use enums for finite sets of values
- Implement proper type guards for runtime type checking
- Use utility types (Pick, Omit, Partial, etc.) for type transformations

**NestJS Patterns**:
- Use dependency injection for all services
- Implement proper module boundaries and exports
- Use guards and interceptors for cross-cutting concerns
- Follow SOLID principles in service design
- Use repository pattern for database abstraction
- Implement proper error handling with custom exceptions

**Security Considerations**:
- Always validate and sanitize user input
- Use parameterized queries (automatic with Prisma)
- Implement proper authentication and authorization
- Use environment variables for sensitive configuration
- Never log sensitive information
- Implement rate limiting for all public endpoints
- Use CORS configuration appropriate for your frontend

### Development Workflow

**Feature Development Process**:
1. **Planning**: Understand requirements and design API contracts
2. **Setup**: Create feature branch and update schema if needed
3. **Implementation**: Create DTOs, entities, services, controllers
4. **Testing**: Write unit and integration tests
5. **Documentation**: Add API documentation and comments
6. **Review**: Code review and testing
7. **Merge**: Merge to main with proper CI/CD

**Commit Guidelines**:
- Use conventional commits (feat, fix, docs, style, refactor, test, chore)
- Write descriptive commit messages
- Include issue references when applicable
- Keep commits atomic and focused
- Use commit hooks for linting and testing

**Branching Strategy**:
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `hotfix/*` - Emergency production fixes
- `release/*` - Release preparation branches

### Performance Considerations

**Database Optimization**:
- Use proper indexing strategy (see existing indexes in schema)
- Implement pagination for large datasets
- Use select statements to fetch only required fields
- Consider database views for complex queries
- Use connection pooling (configured in Prisma)

**API Performance**:
- Implement caching for frequently accessed data
- Use compression for large responses
- Implement proper HTTP caching headers
- Consider GraphQL for complex data requirements
- Use streaming for large file uploads/downloads

**Application Performance**:
- Use lazy loading for modules when appropriate
- Implement proper error boundaries
- Use async/await properly to avoid blocking
- Monitor memory usage and prevent leaks
- Use clustering in production

### Deployment Considerations

**Environment Configuration**:
- Use different configuration for each environment
- Implement health check endpoints
- Configure proper logging levels
- Set up monitoring and alerting
- Use environment-specific database instances

**Production Checklist**:
- [ ] Update JWT secret and other sensitive configuration
- [ ] Configure proper CORS for production frontend
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies for database
- [ ] Implement proper error tracking
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy/load balancer
- [ ] Test deployment process
- [ ] Validate performance under load

## Important Files and Key Locations

### Application Core
- **`src/main.ts`** - Application bootstrap with lifecycle management, API versioning, CORS, validation, graceful shutdown, and error handling
- **`src/app.module.ts`** - Main application module configuring global guards, interceptors, middleware, and feature module imports
- **`src/app.controller.ts`** - Root controller for health checks and basic endpoints
- **`src/app.service.ts`** - Root application service for cross-cutting functionality

### Configuration and Environment
- **`.env.example`** - Complete environment variable template with all required settings
- **`src/config/configuration.ts`** - Environment configuration factory with all application settings
- **`package.json`** - Project dependencies, scripts, and Jest configuration

### Database Layer
- **`prisma/schema.prisma`** - PostgreSQL database schema with all models, relationships, and indexes
- **`src/prisma.service.ts`** - Prisma client with lifecycle management and error handling
- **`src/db/db.module.ts`** - Global database module providing PrismaService singleton

### Authentication and Authorization
- **`src/v1/auth/auth.module.ts`** - Authentication module with JWT and GitHub strategies
- **`src/v1/auth/auth.service.ts`** - Authentication business logic and JWT management
- **`src/v1/auth/strategies/jwt.strategy.ts`** - JWT authentication strategy (6-hour expiration)
- **`src/v1/auth/strategies/github.strategy.ts`** - GitHub OAuth strategy configuration

### User Management
- **`src/v1/users/users.module.ts`** - User management module with repository pattern
- **`src/v1/users/users.service.ts`** - User business logic and data processing
- **`src/v1/users/users.repository.ts`** - User data access abstraction layer

### Content Management
- **`src/v1/posts/posts.module.ts`** - Content management module with comprehensive features
- **`src/v1/posts/posts.service.ts`** - Post business logic with file upload integration
- **`src/v1/posts/posts.repository.ts`** - Post data access with complex queries
- **`src/v1/posts/posts.gateway.ts`** - WebSocket gateway for real-time features
- **`src/v1/posts/user-map-service.ts`** - User-to-socket mapping service

### AI Chat System
- **`src/v1/chat/chat.module.ts`** - AI chat functionality module
- **`src/v1/chat/services/openrouter.service.ts`** - OpenRouter API integration service
- **`src/v1/chat/chat.controller.ts`** - Chat API endpoints with streaming responses

### File Storage
- **`src/common/s3/minio.module.ts`** - MinIO-compatible file storage module
- **`src/common/s3/minio.service.ts`** - File upload/download service with S3 compatibility

### Email System
- **`src/common/email/email.module.ts`** - Email notification module
- **`src/common/email/email.service.ts`** - Email service with Handlebars templating
- **`src/common/email/templates/`** - Email templates (welcome, password-reset, generic)

### Common Utilities
- **`src/common/logger/logger.middleware.ts`** - HTTP request/response logging middleware
- **`src/common/interceptors/big-int.interceptor.ts`** - BigInt serialization for JSON responses
- **`src/common/pipes/zod-validation.pipe.ts`** - Zod-based validation with detailed error messages
- **`src/filters/ws-exception.filter.ts`** - WebSocket exception handling

### Testing Infrastructure
- **`test/app.e2e-spec.ts`** - End-to-end test suite for application integration
- **`test/jest-e2e.json`** - E2E test configuration separate from unit tests

### Development and Build
- **`.eslintrc.js`** - ESLint configuration with TypeScript ESLint rules
- **`tsconfig.json`** - TypeScript configuration with strict settings
- **`nest-cli.json`** - NestJS CLI configuration for code generation

### Key Database Models (from schema.prisma)
- **`users`** - User accounts with authentication data and relationships
- **`posts`** - Content posts with publication status and engagement metrics
- **`post_likes`** - Post like system with user-post relationships
- **`post_bookmarks`** - Post bookmarking functionality
- **`post_comments`** - Comment system with nested replies
- **`post_views`** - Post view tracking with deduplication
- **`chat_conversations`** - AI chat conversation management
- **`chat_messages`** - Individual chat messages with streaming support
- **`user_follows`** - Social follow system between users
- **`files`** - File upload tracking and metadata
- **`tags`** and **`posts_to_tags`** - Content categorization system

### Critical Configuration Points
- **JWT Configuration**: Located in AuthModule with 6-hour expiration
- **Rate Limiting**: Global ThrottlerGuard with 10 requests per 60 seconds
- **Database Connection**: PostgreSQL with connection pooling via Prisma
- **File Storage**: MinIO-compatible with S3 API support
- **Email**: SMTP configuration with Handlebars templating
- **AI Integration**: OpenRouter API for AI chat functionality
- **WebSocket**: Socket.IO for real-time features with authentication

### Performance and Monitoring
- **Database Indexes**: Comprehensive indexing strategy for query performance
- **BigInt Handling**: Custom interceptor for proper BigInt serialization
- **Logging**: Structured logging with high-resolution timing
- **Error Handling**: Global exception filters for both HTTP and WebSocket
- **Health Checks**: Application and database health monitoring endpoints

## Development Best Practices for Claude Code

### Working with the Codebase

1. **Environment Setup**: Always start by copying `.env.example` to `.env` and configuring required environment variables before development

2. **Database Operations**: Use Prisma migrations for all schema changes; never edit the auto-generated client in `src/db/generated/`

3. **Module Organization**: Create new features in appropriate modules under `src/v1/` following the existing naming conventions and patterns

4. **Validation**: Use Zod schemas with custom validation pipes for complex validation logic; always validate user input

5. **Authentication**: Protect routes with `@UseGuards(JwtAuthGuard)` and implement proper authorization checks in services

6. **Error Handling**: Use NestJS built-in exceptions and custom exception classes; follow the standard error response format

7. **Testing**: Write comprehensive tests including unit tests, integration tests, and E2E tests; use mocking for external dependencies

8. **Code Quality**: Run `bun run lint` before committing; follow TypeScript strict mode and ESLint rules

### Common Development Scenarios

**Adding a New Feature**:
1. Plan the database schema changes and update `prisma/schema.prisma`
2. Run `npx prisma generate` and `npx prisma migrate dev`
3. Create DTOs with proper validation schemas
4. Generate the resource using `nest generate resource <name>`
5. Implement business logic in services with proper error handling
6. Add comprehensive tests for all functionality
7. Update API documentation and comments

**Modifying Existing Features**:
1. Understand the existing module structure and dependencies
2. Update tests to reflect changes before modifying implementation
3. Follow the repository pattern for database operations
4. Ensure backward compatibility for API changes when possible
5. Add proper migration scripts for database schema changes

**Debugging Issues**:
1. Check application logs via Logger middleware output
2. Use environment-specific configuration for debugging
3. Leverage Prisma Studio for database inspection
4. Use WebSocket debugging tools for real-time features
5. Check error handling and exception filters for proper error responses

### Security Guidelines

1. **Input Validation**: Always validate and sanitize user input using Zod schemas and validation pipes
2. **Authentication**: Use JWT tokens with proper expiration and refresh mechanisms
3. **Authorization**: Implement proper role-based access control in services
4. **Rate Limiting**: Respect the global throttling limits (10 requests per 60 seconds)
5. **Environment Variables**: Never hardcode sensitive information; use ConfigService
6. **File Uploads**: Implement proper file type validation and size limits
7. **SQL Injection**: Prevented automatically by Prisma ORM
8. **XSS Protection**: Use Handlebars auto-escaping in email templates

### Performance Considerations

1. **Database Queries**: Use proper indexing and avoid N+1 queries
2. **Pagination**: Implement pagination for large datasets
3. **Caching**: Consider caching strategies for frequently accessed data
4. **File Handling**: Use streaming for large file uploads/downloads
5. **WebSocket Management**: Implement proper connection cleanup and user mapping
6. **Memory Management**: Monitor for memory leaks in long-running processes

### Testing Strategy

1. **Test Structure**: Place tests alongside implementation files using `*.spec.ts` pattern
2. **Test Coverage**: Aim for high coverage, especially for business logic and error paths
3. **Mocking**: Mock external dependencies (email, file storage, AI services)
4. **Database Testing**: Use separate test database or transaction rollback
5. **Integration Testing**: Test complete workflows and API endpoints
6. **E2E Testing**: Use Supertest for full application integration testing

### Deployment and Production

1. **Environment Configuration**: Use production-specific environment variables
2. **Security**: Update JWT secrets and disable debug features
3. **Monitoring**: Implement health checks and error tracking
4. **Performance**: Configure connection pooling and caching
5. **Backup**: Set up database backup strategies
6. **SSL/TLS**: Ensure proper certificate configuration
7. **Load Balancing**: Configure reverse proxy for production traffic

### Collaboration Guidelines

1. **Code Reviews**: Always review code before merging to main branch
2. **Documentation**: Keep API documentation and comments up to date
3. **Commit Messages**: Use conventional commits with descriptive messages
4. **Branching**: Use feature branches and proper merge strategies
5. **CI/CD**: Ensure tests pass and linting succeeds before merging
6. **Communication**: Document architectural decisions and breaking changes

### Troubleshooting Common Issues

**Database Connection Issues**:
- Verify `DATABASE_URL` environment variable
- Check PostgreSQL server status and credentials
- Run `npx prisma migrate dev` to apply pending migrations
- Use `npx prisma studio` to inspect database state

**Authentication Problems**:
- Verify JWT secret configuration
- Check token expiration and refresh logic
- Validate GitHub OAuth callback URLs
- Inspect authentication headers and cookies

**File Upload Issues**:
- Verify S3/MinIO configuration and credentials
- Check file size limits and type restrictions
- Validate bucket permissions and network connectivity
- Review file path generation and storage logic

**WebSocket Connection Problems**:
- Check CORS configuration for WebSocket connections
- Verify authentication token handling
- Inspect connection cleanup and error handling
- Review user mapping service implementation

**Performance Issues**:
- Analyze database query performance with proper indexing
- Check for memory leaks in long-running processes
- Monitor API response times and implement caching
- Review WebSocket connection management and cleanup

This comprehensive guide should help you navigate and contribute effectively to this NestJS backend application. Always refer to existing patterns and conventions when implementing new features.

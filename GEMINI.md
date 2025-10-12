# Project Overview

This is a NestJS-based backend application written in TypeScript. It appears to be a comprehensive application with features like user authentication, posts, notes (workspaces and pages), chat, and more. The project is well-structured, following the standard NestJS conventions. It uses Prisma as an ORM, PostgreSQL as the database, and includes email notifications, file uploads to a MinIO-compatible service, and API documentation.

## Key Technologies

*   **Framework:** NestJS
*   **Language:** TypeScript
*   **Database:** PostgreSQL (with Prisma)
*   **Authentication:** JWT, Passport (with local, and GitHub strategies)
*   **API:** RESTful and WebSockets
*   **Validation:** class-validator, zod
*   **Email:** nodemailer, handlebars
*   **File Storage:** MinIO
*   **Testing:** Jest

# Building and Running

## Installation

```bash
bun install
```

## Running the Application

*   **Development Mode:**
    ```bash
    bun run start:dev
    ```
*   **Production Mode:**
    ```bash
    bun run start:prod
    ```
## Testing

*   **Unit Tests:**
    ```bash
    bun test
    ```
*   **End-to-End Tests:**
    ```bash
    bun run test:e2e
    ```
# Development Conventions

*   **Structure:** The project follows the standard NestJS project structure, with modules for each feature located in `src/v1`. Common modules like email and database services are in `src/common` and `src/db` respectively.
*   **Linting:** The project uses ESLint for code linting. Run `npm run lint` to check and fix code style issues.
*   **Configuration:** Configuration is managed through a `configuration.ts` file and loaded using the `@nestjs/config` module. Environment variables are defined in a `.env` file (see `.env.example`).
*   **API Versioning:** The API is versioned using URI versioning (e.g., `/v1/users`).
*   **Commits:** No explicit commit message convention is specified, but based on the presence of `CHANGELOG.md`, it is recommended to follow a conventional commit format.
*   **Database Migrations:** Database migrations are managed by Prisma. To create a new migration, use the `prisma migrate dev` command.

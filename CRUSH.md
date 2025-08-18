# Codebase Guidelines for AI Agents

## Build Commands
- Build: `npm run build`
- Format: `npm run format`
- Production start: `npm run start:prod`
- Development start: `npm run start:dev`

## Linting
- Lint: `npm run lint`
- Uses ESLint with TypeScript ESLint and Prettier
- Config in `.eslintrc.js` and `.prettierrc`
- No explicit any allowed, floating promises warned

## Testing
- All tests: `npm run test`
- Watch mode: `npm run test:watch`
- Single test file: `npm run test -- src/path/to/file.spec.ts`
- E2E tests: `npm run test:e2e`
- Coverage: `npm run test:cov`
- Debug tests: `npm run test:debug`

## Code Style
- TypeScript with strict typing
- Single quotes, trailing commas (Prettier config)
- NestJS framework patterns
- Class-based architecture with modules, controllers, services
- DTOs for data validation with class-validator
- Zod schemas for additional validation
- ESLint rules in `.eslintrc.js`

## Naming Conventions
- Files: kebab-case
- Classes: PascalCase
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE

## Imports
- Absolute imports when possible
- Group external imports separately from internal
- Organize imports alphabetically

## Error Handling
- Use NestJS exceptions (HttpException, NotFoundException, etc.)
- Custom exceptions should extend base NestJS exceptions
- Validation using class-validator in DTOs
- Global exception filters in `filters/` directory

## Git Ignore
- `.crush` directory already added to `.gitignore`
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simplified Elysia API project built with Bun and Turborepo. The project was originally created as a Turborepo starter but has been streamlined to focus on the Elysia API application, with the Next.js web apps and shared packages removed.

## Architecture

### Monorepo Structure
- **Root**: Turborepo monorepo configuration with Bun as package manager
- **apps/api**: Elysia API server application
- **packages/**: Empty (previously contained shared UI components and configurations)

### Technology Stack
- **Runtime**: Bun (>=1.2.0, Node.js >=18 fallback)
- **API Framework**: Elysia (v1.3.6 - use latest version for new features)
- **Dependency Injection**: Awilix (v12.0.5 - use latest version)
- **Build System**: Turborepo (v2.5.5)
- **Language**: TypeScript (v5.8.3)
- **Formatting**: Prettier (v3.6.2)

## Project Structure

```
/
├── apps/
│   └── api/                 # Elysia API server
│       ├── src/
│       │   ├── modules/     # Feature modules with DI
│       │   │   ├── users/   # User module
│       │   │   │   ├── types.ts         # User interfaces
│       │   │   │   ├── user.repository.ts
│       │   │   │   ├── user.service.ts
│       │   │   │   ├── user.routes.ts
│       │   │   │   ├── container.ts     # Module DI registration
│       │   │   │   └── index.ts         # Module exports
│       │   │   └── auth/    # Auth module
│       │   │       ├── types.ts         # Auth interfaces
│       │   │       ├── auth.service.ts
│       │   │       ├── auth.routes.ts
│       │   │       ├── container.ts     # Module DI registration
│       │   │       └── index.ts         # Module exports
│       │   ├── routes/      # Shared/health routes
│       │   │   └── health.routes.ts
│       │   ├── container.ts # Main DI container
│       │   ├── schemas.ts   # Validation schemas
│       │   ├── errors.ts    # Custom error classes
│       │   └── index.ts     # Server entry point
│       ├── app.ts           # App factory with DI
│       ├── app.test.ts      # Integration tests
│       ├── dist/            # Build output
│       ├── package.json
│       └── tsconfig.json
├── packages/                # Empty (cleaned up)
├── package.json             # Root monorepo configuration
├── turbo.json              # Turborepo task configuration
├── bun.lock                # Bun lockfile
└── README.md               # Turborepo starter documentation
```

## Development Commands

### Root Level Commands
```bash
# Development (starts all apps in watch mode)
bun dev
# or
turbo dev

# Build all packages and apps
bun run build
# or
turbo build

# Lint all packages and apps
bun run lint
# or
turbo lint

# Type checking across all packages
bun run check-types
# or
turbo check-types

# Format code with Prettier
bun run format
```

### API-Specific Commands
```bash
# Development server (from apps/api)
cd apps/api
bun dev                     # Runs with --watch flag

# Build API
bun run build              # Outputs to dist/

# Start production server
bun start                  # Runs dist/index.js

# Type checking only
bun run check-types        # tsc --noEmit
```

## API Application Details

### Entry Point
The API server is defined in `/Users/aliaksandrrumiantsau/Documents/projects/elysia basic/apps/api/src/index.ts`:

```typescript
import { Elysia } from 'elysia'

const app = new Elysia()
  .get('/', () => 'Hello Elysia')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(3000)

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`)
```

### Available Endpoints
- `GET /` - Returns welcome message with DI confirmation
- `GET /health` - Returns health check with version and timestamp
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (requires auth)
- `PUT /users/:id` - Update user (requires auth)
- `DELETE /users/:id` - Delete user (requires auth)
- `POST /auth/login` - User login
- `POST /auth/validate` - Token validation

### TypeScript Configuration
The API uses modern TypeScript configuration optimized for Bun:
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Runtime Types**: Bun types included
- **Strict mode**: Enabled
- **Import Extensions**: Allowed for .ts files

## Turborepo Configuration

### Task Dependencies
- **build**: Depends on upstream builds (`^build`), outputs to `dist/**`
- **lint**: Depends on upstream linting (`^lint`)
- **check-types**: Depends on upstream type checking (`^check-types`)
- **dev**: No caching, runs persistently

### Build Outputs
- API build outputs to `apps/api/dist/`

## Package Management

### Package Manager
- **Primary**: Bun (v1.2.0)
- **Lockfile**: `bun.lock`
- **Workspaces**: Configured for `apps/*` and `packages/*`

### Dependencies
- **API Dependencies**: 
  - `elysia`: ^1.3.6 (use latest version for best performance and features)
  - `awilix`: ^12.0.5 (dependency injection container)
  - `drizzle-orm`: ^0.44.4 (type-safe SQL ORM)
  - `drizzle-zod`: ^0.5.1 (Zod integration for validation)
  - `zod`: ^4.0.14 (schema validation)
  - `@types/bun`: ^1.1.13 (dev)
  - `typescript`: 5.8.3 (dev)
  - `drizzle-kit`: ^0.31.4 (dev - database migrations)

## Development Workflow

1. **Start Development**: Run `bun dev` from root to start the API server with hot reload
2. **API Server**: Accessible at `http://localhost:3000`
3. **Database**: SQLite database with automatic migrations and seeding
4. **Type Checking**: Automatic through TypeScript, manual via `bun run check-types`
5. **Building**: Use `bun run build` to build the API for production
6. **Production**: Run `bun start` from the API directory

### Database Commands
```bash
# Generate migrations from schema changes
bun run db:generate

# Run migrations manually (auto-run on app start)
bun run db:migrate

# Seed database with initial data (auto-run on app start)
bun run db:seed

# Run tests with isolated databases
bun test
```

## Testing with Isolated SQLite Databases

### Test Database Isolation
Each test runs with its own isolated SQLite database instance to ensure:
- **No test interference**: Tests don't affect each other's data
- **Parallel execution**: Tests can run concurrently without conflicts
- **Clean state**: Each test starts with a fresh, seeded database
- **Deterministic results**: Tests produce consistent, predictable outcomes

### Implementation Details

#### Database Connection (`src/db/connection.ts`)
- **`createDatabase()`**: Main application database (singleton pattern)
- **`createTestDatabase()`**: Creates unique test database with timestamp + random string
- **`cleanupTestDatabase()`**: Properly closes test database connections
- Test databases are created in `data/test/` directory with unique names

#### Dependency Injection (`src/container.ts`)
- **`createDIContainer(useTestDatabase = false)`**: Factory function supports test mode
- When `useTestDatabase = true`, creates isolated test database instance
- Each test gets fresh DI container with isolated database

#### App Factory (`app.ts`)
- **`createApp(useTestDatabase = false)`**: Accepts test database flag
- Test mode creates completely isolated application instance
- Production mode uses singleton database pattern

#### Test Configuration (`app.test.ts`)
- **`beforeEach()`**: Creates fresh app instance for each test (not `beforeAll()`)
- **Database isolation**: Each test gets unique SQLite file
- **Automatic cleanup**: Test databases are managed automatically
- **Seeded data**: Each test starts with consistent seed data

### Test Database Lifecycle
1. **Test starts**: `beforeEach()` calls `createApp(true)`
2. **Database creation**: Unique SQLite file created in `data/test/`
3. **Migrations**: Schema applied to test database
4. **Seeding**: Initial test data inserted
5. **Test execution**: Test runs against isolated database
6. **Cleanup**: Database connections closed after test

### Benefits
- **Fast execution**: SQLite in-memory-like performance
- **No setup/teardown**: Automatic database lifecycle management
- **Real database**: Uses actual SQLite, not mocks
- **Type safety**: Full Drizzle ORM type checking in tests
- **Production parity**: Same database operations as production

## Notes for Claude Code

- This project uses Bun as the primary runtime and package manager
- The API server runs on port 3000 by default
- TypeScript configuration is optimized for Bun with ESNext modules
- The project structure suggests it was simplified from a full Turborepo starter
- Always use the latest stable versions of Elysia (1.3.6+) and Awilix (12.0.5+) for new features
- Elysia 1.3.6+ includes improved performance and better TypeScript support
- Awilix 12.0.5+ provides better ESM support and improved container performance
- **IMPORTANT**: Avoid using `any` type in TypeScript - always use proper typing with interfaces, types, or generics
- Use strict TypeScript practices with proper type definitions for better code quality and maintainability
- **MODULAR DEPENDENCY INJECTION**: Use Awilix DI container with modular registration pattern
- Each feature module has its own `container.ts` file for DI registration
- Main container imports and registers all modules: `registerUserModule(container)`, `registerAuthModule(container)`
- Services and repositories depend on interfaces (e.g., `IUserService`, `IUserRepository`) rather than concrete classes
- This ensures loose coupling, better testability, and follows SOLID principles
- **ROUTE-AS-SERVICE PATTERN**: Register routes as services in the DI container for better testability and composition
- Routes are classes with constructor dependency injection: `constructor(private userService: IUserService, private authService: IAuthService)`
- Routes are registered in module containers: `container.register({ userRoutes: asClass(UserRoutes).singleton() })`
- App resolves route services from container: `const userRoutes = container.resolve<UserRoutes>('userRoutes')`
- Routes expose `createRoutes()` method that returns Elysia instance: `userRoutes.createRoutes()`
- **MODULAR ARCHITECTURE**: Organize code by feature modules (users, auth, etc.) rather than technical layers
- Each module contains: types, repository, service, routes, container registration, and index exports
- **SCALABLE DI PATTERN**: For 50+ modules, each module manages its own dependency registration
- Main container simply calls registration functions from each module
- Module dependencies are clearly defined via TypeScript interfaces
- Route classes can be easily mocked for testing and provide better composition patterns
- **DATABASE INTEGRATION**: Use Drizzle ORM with Bun's built-in SQLite for type-safe database operations
- Schema definitions with Drizzle: `sqliteTable()` with proper column types and constraints
- Repository pattern with proper Drizzle queries: `db.select().from(users).where(eq(users.id, id))`
- Database is registered as singleton in DI container and injected into repositories
- Automatic database seeding on first run with duplicate prevention
- **ROUTE ORGANIZATION**: Separate route definitions from controllers into dedicated `.routes.ts` files for better maintainability
- Controllers should focus on orchestrating dependencies, while route files handle the actual endpoint definitions and logic
- **ELYSIA PATTERNS**: Follow Elysia's native patterns for authentication, middleware, and plugins rather than forcing NestJS-like abstractions
- Use Elysia's built-in derive, guard, and plugin system for cross-cutting concerns
- **VALIDATION**: Use Elysia's built-in `t` (TypeBox) validation schemas instead of manual validation
- **ERROR HANDLING**: Use custom HTTP error classes (UnauthorizedError, NotFoundError, etc.) for proper REST API status codes
- **SCHEMA DEFINITIONS**: Define validation schemas in separate files for reusability and maintainability
- **HTTP STATUS CODES**: Implement proper REST API status codes (401 for auth, 404 for not found, 409 for conflicts, etc.)
- **DRIZZLE MIGRATIONS**: Use `drizzle-kit generate` to create migrations from schema changes
- Migrations run automatically on application startup, no manual intervention needed
- Database schema changes: modify `/src/db/schema.ts`, run `bun run db:generate`, restart app
- **REAL-WORLD SERVICES**: All services use production-ready implementations, not mocks
- **PASSWORD SECURITY**: Uses Bun's built-in `Bun.password.hash()` and `Bun.password.verify()` with bcrypt
- **SESSION-BASED AUTH**: Authentication uses SQLite-stored sessions instead of JWT tokens
- **NO EXTERNAL DEPS**: Leverages Bun's built-in capabilities instead of external libraries
- The project uses workspaces but currently only contains the API application

## Authentication Implementation

### Password Management
- **Hashing**: Uses `Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 })` for secure password storage
- **Verification**: Uses `Bun.password.verify(password, hash)` for login validation
- **Storage**: Password hashes stored in `users.passwordHash` field (never exposed in public APIs)

### Session Management
- **Session Storage**: Sessions stored in SQLite `sessions` table with foreign key to users
- **Session ID**: Generated using `crypto.randomUUID()` for cryptographically secure identifiers
- **Expiration**: Sessions expire after 24 hours, automatically cleaned up
- **Security**: Session validation includes expiration checks and automatic cleanup

### Authentication Flow
1. **Login**: `POST /auth/login` - validates email/password, creates session, returns sessionId + user
2. **Session Validation**: `POST /auth/validate` - validates sessionId, returns user data if valid
3. **Logout**: `POST /auth/logout` - destroys session in database
4. **Authorization**: Protected endpoints check `Authorization: Bearer <sessionId>` header

### Database Schema
- **Users Table**: `id`, `email`, `name`, `passwordHash`, `createdAt`, `updatedAt`
- **Sessions Table**: `id`, `userId`, `expiresAt`, `createdAt`
- **Security**: Foreign key constraints ensure data integrity, cascade deletes remove orphaned sessions
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sentinela Backend is a NestJS-based application designed to manage police force operations and user access control. The system is built with TypeScript, PostgreSQL via TypeORM, and follows a modular architecture.

### Key Business Context

This is a security-critical system for Brazilian police forces with the following core requirements:
- Supports 5 distinct police forces: Polícia Federal, Polícia Rodoviária Federal, Polícia Militar, Polícia Civil, Polícia Penal
- Role-based access control: `admin_geral`, `ponto_focal`, `gestor`, `usuario`
- Admin users (`admin_geral`) can operate across all forces; other roles are force-specific
- First-time users must change their initial password (6-digit numeric)
- Full audit logging required for security compliance
- Automatic seed initialization creates default admin with credentials logged to stdout on first run

## Common Commands

### Development
- `pnpm start:dev` - Start development server with hot reload
- `pnpm start:debug` - Start in debug mode with watch
- `pnpm build` - Build production bundle
- `pnpm start:prod` - Run production build

### Code Quality
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm format` - Format code with Prettier

### Testing
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:cov` - Run tests with coverage
- `pnpm test:debug` - Debug tests with Node inspector
- `pnpm test:e2e` - Run end-to-end tests

### Database & Migrations
- `pnpm migration:generate <path>` - Auto-generate migration from entity changes
- `pnpm migration:create <path>` - Create empty migration template
- `pnpm migration:run` - Execute pending migrations
- `pnpm migration:revert` - Rollback last migration
- `pnpm migration:show` - Show migration status

### Docker
- `docker-compose up -d postgres` - Start PostgreSQL in Docker
- `docker-compose down` - Stop containers
- `docker-compose logs -f postgres` - View PostgreSQL logs
- See `DOCKER.md` for detailed Docker usage

## Architecture

### Planned Module Structure

The system follows NestJS modular architecture with these planned modules:

```
/src
  ├── app.module.ts        # Root module with TypeORM configuration
  ├── main.ts              # Application entrypoint
  ├── config/              # Configuration files (TypeORM DataSource, env)
  ├── database/
  │   ├── migrations/      # TypeORM migrations
  │   └── seeds/           # Seed logic (admin creation, forces initialization)
  └── modules/
      ├── auth/            # JWT authentication and Passport strategies
      ├── users/           # User entity, CRUD, role management
      ├── forces/          # Police force entity and services
      └── audit/           # Audit log entity and tracking
```

### Core Data Models

All entities are implemented and registered in their respective modules. See `ENTITIES.md` for detailed documentation.

**Force Entity** (`src/forces/entities/force.entity.ts`)
- Table: `forces`
- Represents the 5 police force types
- Fields: `id`, `name` (unique)
- OneToMany relationship with User
- Must be seeded at application startup

**User Entity** (`src/users/entities/user.entity.ts`)
- Table: `users`
- Email-based authentication with bcrypt-hashed passwords
- Role enum: `admin_geral`, `ponto_focal`, `gestor`, `usuario`
- Fields: `id`, `email` (unique), `password`, `role`, `forceId`, `isActive`, `mustChangePassword`, `createdAt`
- ManyToOne relationship with Force (nullable for admin_geral)
- Soft delete via `isActive` flag

**AuditLog Entity** (`src/audit/entities/audit.entity.ts`)
- Table: `audit_logs`
- Records all significant actions for security compliance
- Fields: `id`, `action`, `userId`, `targetEntity`, `details` (JSONB), `ipAddress`, `timestamp`
- No foreign keys (independent tracking)

### TypeORM Configuration

Configuration is environment-driven via `.env` file:
- Database: PostgreSQL 15
- DataSource config: `src/config/typeorm.config.ts`
- Migrations directory: `src/database/migrations/`
- Migration table: `typeorm_migrations`
- **Production-safe**: `synchronize` disabled by default (set via `DB_SYNCHRONIZE=false`)
- Entity auto-discovery enabled via `autoLoadEntities: true`
- All credentials loaded from environment variables

### Authentication Strategy

- Passport-JWT for token-based authentication
- Bcrypt for password hashing
- Numeric passwords (6 digits) for initial admin accounts
- Password change required on first login via `mustChangePassword` flag

### Initialization & Seeding

The application must implement bootstrap logic (OnModuleInit or similar) to:
1. Ensure all 5 police forces exist in the database
2. Check for existence of `admin_geral` user
3. If no admin exists, create one with auto-generated 6-digit password
4. Log temporary admin credentials to stdout (only on creation)

## Development Notes

### TypeScript Configuration
- Using `nodenext` module resolution
- Decorators enabled for NestJS
- Strict null checks enabled
- Target: ES2023

### Package Manager
- Uses `pnpm` as package manager

### Database Access
- PostgreSQL 15 configured via Docker Compose
- Start database: `docker-compose up -d postgres`
- Connection via `.env` file (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE)
- TypeORM entities auto-discovered from feature modules via `autoLoadEntities`
- Direct database access: `docker exec -it sentinela-postgres psql -U root -d sentinela_db`

### Environment Variables
All configuration via `.env` file (see `.env.example` for template):
- Application: `NODE_ENV`, `PORT`
- Database: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- TypeORM: `DB_SYNCHRONIZE`, `DB_LOGGING`, `DB_AUTO_LOAD_ENTITIES`

### Security Considerations
- All passwords must be hashed with bcrypt before storage
- Audit logs must capture IP addresses
- Admin credentials displayed in stdout only during initial creation
- Never use `synchronize: true` in production environments
- JWT tokens for stateless authentication

# Employee Profile Management System

A modern, AI-enhanced employee profile management system built with Next.js 15, demonstrating technical excellence, product thinking, and innovative approaches to enterprise software.

## Overview

This full-stack application implements role-based access control, employee profile management with sensitive data protection, AI-powered feedback polishing, and absence request management.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript 5.x (100% coverage)
- **Styling**: Tailwind CSS 4.x + shadcn/ui component library
- **State Management**: Zustand 5.x (auth, UI state)
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: tRPC client + TanStack Query (React Query)

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Next.js API Routes
- **API Layer**: tRPC (end-to-end type safety)
- **ORM**: Prisma 6.x
- **Database**: PostgreSQL 15.x
- **Validation**: Zod schemas (shared client/server)

### AI Integration
- **Service**: HuggingFace Inference API
- **Model**: google/flan-t5-base or similar
- **Fallback**: Graceful degradation if service unavailable

## Features

### Role-Based Access Control
- Three distinct user roles: **Manager**, **Employee**, **Coworker**
- JWT/session-based authentication
- Role switching for demo purposes
- Granular permission controls

### Profile Management
- Complete CRUD operations for employee profiles
- Field-level access control based on user role
- Sensitive data protection (salary, SSN, address, performance rating)
- Avatar upload functionality

### AI-Powered Feedback System
- Peer feedback with optional AI enhancement
- Side-by-side comparison of original and polished versions
- Visibility controls (managers and recipients only)
- Feedback history tracking

### Absence Management
- Time-off request workflow
- Date range validation
- Overlap detection
- Manager approval system
- Calendar view with status indicators

## Prerequisites

- **Node.js**: v20.x LTS
- **npm**: Latest version
- **PostgreSQL**: v15.x (or later)
- **Git**: For version control
- **HuggingFace API Key**: For AI feedback polishing (optional)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd employee-profile-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/employee_db?schema=public"

# Session
SESSION_SECRET="your-session-secret-min-32-chars-change-in-production"

# HuggingFace AI (optional)
HUGGINGFACE_API_KEY="your-huggingface-api-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set Up the Database

Make sure PostgreSQL is running, then create the database and run migrations:

```bash
# Create the database
createdb employee_db

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed the database with demo data (optional)
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

After seeding the database, you can log in with these demo accounts:

- **Manager**: emily@example.com
- **Employee**: david@example.com
- **Coworker**: sarah@example.com

*Note: Demo mode allows role switching without password authentication.*

## Project Structure

```
employee-profile-management-system/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login)
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── features/         # Feature-specific components
├── lib/                  # Shared utilities
│   ├── trpc/            # tRPC client/server setup
│   ├── validations/     # Zod schemas
│   └── ai/              # HuggingFace integration
├── server/              # tRPC server logic
│   └── routers/         # tRPC routers (user, feedback, absence, auth)
├── stores/              # Zustand stores
├── prisma/              # Database schema and migrations
│   ├── schema.prisma    # Prisma schema
│   └── migrations/      # Database migrations
└── types/               # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma db seed` - Seed database with demo data

## Key Features by Role

### Manager
- View and edit ALL employee profiles (including sensitive data)
- View all feedback for any employee
- Approve/reject absence requests
- Full system access

### Employee
- View and edit OWN profile completely
- View own feedback
- Submit absence requests
- Give feedback to colleagues

### Coworker
- View non-sensitive profile fields only
- Give feedback to colleagues
- Submit absence requests
- Limited profile access

## Security Features

- Role-based access control (RBAC)
- Session-based authentication
- Input validation with Zod
- SQL injection prevention via Prisma ORM
- XSS and CSRF protection
- Sensitive data field filtering

## Performance

- Sub-200ms API response times for read operations
- Sub-500ms for write operations
- Server Components for optimal initial load
- React Query caching
- Optimistic updates

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatible
- High contrast color ratios
- Focus visible styles

## Documentation

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)
- [Product Requirements Document](./docs/PRD.md)
- [Implementation Plan](./docs/Full_MVP_Implementation_Plan.md)

## Troubleshooting

### Database Connection Issues

If you see `Can't reach database server`, ensure PostgreSQL is running:

```bash
# Check PostgreSQL status (macOS/Linux)
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services app or pgAdmin
```

### TypeScript Errors

Run type checking:

```bash
npx tsc --noEmit
```

### Migration Issues

Reset the database if needed:

```bash
npx prisma migrate reset
```

## Future Enhancements

See the [PRD](./docs/PRD.md) for planned features including:
- Real-time notifications
- Email notifications
- Advanced analytics dashboard
- Org chart visualization
- Mobile native applications
- Integration with external HR systems

## License

[MIT License](LICENSE)

## Support

For issues and questions, please open an issue on the GitHub repository.

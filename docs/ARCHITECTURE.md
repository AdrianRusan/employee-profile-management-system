# Architecture Documentation

## System Overview

The Employee Profile Management System is a modern full-stack application built on Next.js 15 with App Router, leveraging tRPC for end-to-end type safety and Prisma as the ORM layer. The architecture emphasizes clean separation of concerns, type safety, and performance.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Next.js 15 App Router                       │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐     │
│  │ Server       │  │ Client      │  │ API Routes │     │
│  │ Components   │  │ Components  │  │ (tRPC)     │     │
│  │              │  │             │  │            │     │
│  │ - RSC        │  │ - Forms     │  │ - Auth     │     │
│  │ - Layout     │  │ - Interactive│ │ - User     │     │
│  │ - Pages      │  │ - State Mgmt│  │ - Feedback │     │
│  └──────────────┘  └─────────────┘  └────────────┘     │
└─────────────────────────────────────────────────────────┘
                │                  │
                ▼                  ▼
      ┌─────────────────┐  ┌──────────────────┐
      │  tRPC Server    │  │  Prisma ORM      │
      │  - Routers      │  │  - User          │
      │  - Procedures   │◄─┤  - Feedback      │
      │  - Middleware   │  │  - AbsenceRequest│
      │  - Context      │  │                  │
      └─────────────────┘  └──────────────────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │  PostgreSQL    │
                           │  Database      │
                           └────────────────┘
```

## Technology Stack

### Frontend Layer

**Next.js 15 App Router**
- Server Components for optimal initial load performance
- Client Components for interactivity
- Hybrid rendering approach (SSR + CSR)
- Built-in route-based code splitting

**React 19**
- Latest React features
- Concurrent rendering
- Suspense for data fetching
- Server Components support

**TypeScript 5.x**
- 100% type coverage
- Strict mode enabled
- Shared types across client/server
- Type inference from Zod schemas and Prisma

**Tailwind CSS 4.x + shadcn/ui**
- Utility-first CSS framework
- Customizable component library
- Dark mode support
- Responsive design system

**State Management**
- **Zustand**: Client-side state (auth, UI preferences)
- **TanStack Query (React Query)**: Server state management via tRPC
- **React Hook Form**: Form state management

### Backend Layer

**tRPC**
- End-to-end type safety without code generation
- Automatic TypeScript inference
- Built-in validation with Zod
- Optimized for Next.js

**Prisma ORM**
- Type-safe database client
- Automatic migrations
- Query optimization
- Database schema versioning

**PostgreSQL**
- Relational database for structured data
- ACID compliance
- Advanced indexing strategies
- Full-text search capabilities

### External Services

**HuggingFace Inference API**
- AI-powered feedback polishing
- Graceful fallback on errors
- Rate limiting handling
- Response caching

## Data Flow

### Authentication Flow

```
1. User → Login Page
2. Submit Credentials → tRPC auth.login
3. Validate Credentials → Prisma Query
4. Create Session → Iron Session (Cookie)
5. Set Auth Store → Zustand
6. Redirect → Dashboard
7. Middleware → Validate Session on Protected Routes
```

### Profile Management Flow

```
1. User → Profile Page
2. Load Profile → tRPC user.getById
3. Check Permissions → Middleware
4. Filter Fields → Role-based filtering
5. Render → React Components
6. Edit Profile → Form Submission
7. Validate → Zod Schema
8. Update → tRPC user.update
9. Persist → Prisma
10. Invalidate Cache → React Query
11. Optimistic Update → UI
```

### Feedback Creation Flow

```
1. User → Feedback Form
2. Write Feedback → Textarea
3. Polish (Optional) → HuggingFace API
4. Compare Versions → Side-by-side view
5. Select Version → Toggle
6. Submit → tRPC feedback.create
7. Validate → Permissions check
8. Store → Prisma
9. Notify → Toast notification
10. Refresh → Query invalidation
```

### Absence Request Flow

```
1. Employee → Request Form
2. Select Dates → Date Range Picker
3. Check Overlap → tRPC absence.checkOverlap
4. Submit → tRPC absence.create
5. Store → Prisma (status: PENDING)
6. Manager View → tRPC absence.getAll
7. Approve/Reject → tRPC absence.updateStatus
8. Update Status → Prisma
9. Notify → UI update
```

## Security Architecture

### Authentication & Authorization

**Session Management**
- Iron Session for secure, encrypted cookies
- HTTP-only cookies to prevent XSS
- Secure flag in production
- SameSite=Strict for CSRF protection

**Role-Based Access Control (RBAC)**
```typescript
// Permission Matrix
Role        | View Profiles | Edit Own | Edit All | View Sensitive | Approve Absence
------------|---------------|----------|----------|----------------|----------------
MANAGER     | ✓             | ✓        | ✓        | ✓              | ✓
EMPLOYEE    | ✓             | ✓        | ✗        | ✗              | ✗
COWORKER    | ✓ (limited)   | ✓        | ✗        | ✗              | ✗
```

**tRPC Middleware**
```typescript
// Enforced on every protected route
1. Extract session from context
2. Validate session exists
3. Check role permissions
4. Allow/deny request
```

### Data Protection

**Sensitive Field Filtering**
- Server-side filtering based on viewer role
- Never expose sensitive data in API responses
- Type-safe filtering with TypeScript

**Input Validation**
- Zod schemas on both client and server
- Sanitization of user inputs
- SQL injection prevention via Prisma

**XSS Protection**
- React automatic escaping
- Content Security Policy headers
- Sanitization of user-generated content

## Performance Optimizations

### Database

**Indexing Strategy**
```prisma
// User indexes
@@index([email])        // Login lookup
@@index([department])   // Filtering
@@index([role])        // Permission checks

// Feedback indexes
@@index([receiverId, createdAt(sort: Desc)])  // Timeline queries
@@index([giverId])                            // User's given feedback

// AbsenceRequest indexes
@@index([userId])      // User's requests
@@index([status])      // Manager view filtering
```

**Query Optimization**
- Select only required fields
- Use `include` for related data
- Pagination with cursor-based approach
- Connection pooling

### Caching

**React Query (TanStack Query)**
- Automatic cache management
- Stale-while-revalidate strategy
- Optimistic updates for instant UI
- Background refetching

**Server-Side Caching**
- Next.js automatic static optimization
- Revalidation strategies
- CDN caching for static assets

### Code Splitting

- Route-based splitting (Next.js automatic)
- Dynamic imports for heavy components
- Lazy loading of UI components
- Tree shaking for unused code

## Directory Structure

```
employee-profile-management-system/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth route group (no layout)
│   │   └── login/
│   │       └── page.tsx         # Login page
│   ├── dashboard/               # Protected routes
│   │   ├── layout.tsx          # Dashboard layout
│   │   ├── page.tsx            # Dashboard home
│   │   ├── profiles/
│   │   │   ├── page.tsx        # Profile list
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Profile detail
│   │   ├── feedback/
│   │   │   └── page.tsx        # Feedback page
│   │   └── absences/
│   │       └── page.tsx        # Absence management
│   ├── api/                     # API routes
│   │   ├── trpc/
│   │   │   └── [trpc]/
│   │   │       └── route.ts    # tRPC handler
│   │   └── upload/
│   │       └── avatar/
│   │           └── route.ts    # File upload
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
│
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── features/               # Feature components
│       ├── ProfileCard.tsx
│       ├── ProfileEditForm.tsx
│       ├── FeedbackForm.tsx
│       ├── FeedbackList.tsx
│       ├── AbsenceRequestDialog.tsx
│       └── AbsenceCalendar.tsx
│
├── lib/                        # Shared utilities
│   ├── trpc/                   # tRPC configuration
│   │   ├── client.ts          # Client-side setup
│   │   ├── server.ts          # Server-side setup
│   │   └── provider.tsx       # React provider
│   ├── validations/            # Zod schemas
│   │   ├── user.ts
│   │   ├── feedback.ts
│   │   └── absence.ts
│   ├── ai/                     # AI integration
│   │   └── huggingface.ts     # HuggingFace API
│   ├── permissions.ts          # Permission utilities
│   ├── session.ts              # Session management
│   └── utils.ts                # General utilities
│
├── server/                     # Server-side code
│   ├── routers/                # tRPC routers
│   │   ├── auth.ts            # Authentication
│   │   ├── user.ts            # User management
│   │   ├── feedback.ts        # Feedback system
│   │   └── absence.ts         # Absence management
│   ├── trpc.ts                 # tRPC initialization
│   └── context.ts              # tRPC context
│
├── stores/                     # Zustand stores
│   └── authStore.ts            # Authentication state
│
├── prisma/                     # Database
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Seed data
│
└── types/                      # TypeScript types
    ├── api.ts                  # API types
    └── models.ts               # Domain models
```

## Design Patterns

### Server Components First

- Use Server Components by default
- Client Components only when needed (interactivity, hooks)
- Pass serializable props between components
- Fetch data at component level

### tRPC Procedures

**Query Procedures**: Read operations
- user.getById
- user.getAll
- feedback.getForUser
- absence.getForUser

**Mutation Procedures**: Write operations
- user.update
- feedback.create
- absence.create
- absence.updateStatus

### Error Handling

```typescript
// Consistent error structure
try {
  // Operation
} catch (error) {
  if (error instanceof TRPCError) {
    // Handle tRPC errors
  }
  // Log error
  // Return user-friendly message
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Friendly error message'
  })
}
```

### Type Safety

```typescript
// Shared types via Zod
export const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  // ...
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Prisma-generated types
import { User, Feedback } from '@prisma/client'

// tRPC inferred types
type UserById = RouterOutputs['user']['getById']
```

## Deployment Architecture

### Development
- Local PostgreSQL instance
- Next.js dev server
- Hot module reloading
- Source maps enabled

### Production (Vercel)
- Vercel Edge Network (CDN)
- Serverless Functions (API routes)
- PostgreSQL (Vercel Postgres or external)
- Environment variables via Vercel
- Automatic HTTPS
- Preview deployments

## Monitoring & Observability

### Logging
- Console logs in development
- Structured logging in production
- Error tracking (Sentry integration ready)

### Performance Monitoring
- Web Vitals tracking
- Lighthouse CI
- Database query logging
- API response times

### Error Tracking
- Client-side error boundary
- Server-side error handling
- tRPC error codes
- User-friendly error messages

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Session store externalization
- Database connection pooling
- CDN for static assets

### Future Enhancements
- Redis for caching
- Message queue for background jobs
- Microservices for AI processing
- Database read replicas
- Full-text search with Elasticsearch

## Security Best Practices

1. **Input Validation**: All inputs validated with Zod
2. **SQL Injection**: Prevented via Prisma ORM
3. **XSS**: React automatic escaping + CSP headers
4. **CSRF**: SameSite cookies + Next.js built-in protection
5. **Authentication**: Secure session management
6. **Authorization**: Role-based access control
7. **Data Protection**: Sensitive field filtering
8. **HTTPS**: Required in production
9. **Environment Variables**: Secrets in .env (never committed)
10. **Dependency Scanning**: Regular npm audit

## Testing Strategy

### Unit Tests
- Zod schema validation
- Utility functions
- Permission checks
- Mock Prisma client

### Integration Tests
- tRPC procedures
- Database operations
- API endpoints
- Full request/response cycle

### E2E Tests
- User authentication flow
- Profile management
- Feedback submission
- Absence request workflow

### Component Tests
- React components with Testing Library
- User interactions
- Form submissions
- Conditional rendering

## Conclusion

This architecture provides a solid foundation for a scalable, maintainable, and secure employee management system. The use of modern technologies like Next.js 15, tRPC, and Prisma ensures type safety, excellent developer experience, and optimal performance.

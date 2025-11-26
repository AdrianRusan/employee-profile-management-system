# API Documentation

This document describes the API endpoints available in the Employee Profile Management System.

## Overview

The application uses **tRPC** for type-safe API communication. All endpoints are available at `/api/trpc/[procedure]`.

### Authentication

All protected endpoints require authentication via session cookies. The session is established after login and stored in an HTTP-only cookie.

### CSRF Protection

All mutation endpoints require a valid CSRF token. The token is obtained from `GET /api/csrf` and must be included in mutation requests via the `x-csrf-token` header.

### Rate Limiting

All endpoints are rate-limited:
- **API calls**: 100 requests per minute
- **Authentication**: 5 attempts per minute
- **AI operations**: 20 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Timestamp when limit resets

---

## REST Endpoints

### Health Checks

#### `GET /api/health`

Full health status check including database connectivity and memory usage.

**Response (200 OK)**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "0.1.0",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "up",
      "latency": 5
    },
    "memory": {
      "status": "ok",
      "used": 128,
      "total": 512,
      "percentage": 25
    }
  }
}
```

**Response (503 Service Unavailable)** - When unhealthy

#### `GET /api/health/ready`

Kubernetes readiness probe. Returns 200 when ready to receive traffic.

**Response (200 OK)**
```json
{
  "ready": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": true,
    "environment": true
  }
}
```

#### `GET /api/health/live`

Kubernetes liveness probe. Returns 200 if process is running.

**Response (200 OK)**
```json
{
  "alive": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### CSRF Token

#### `GET /api/csrf`

Get CSRF token for mutation requests.

**Response (200 OK)**
```json
{
  "csrfToken": "abc123..."
}
```

### Metrics

#### `GET /api/metrics`

Prometheus-compatible metrics endpoint.

**Headers** (optional, if METRICS_TOKEN is set)
```
Authorization: Bearer <token>
```

**Response (200 OK)**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/health",status="200"} 42

# HELP users_total Total number of users
# TYPE users_total gauge
users_total 150
```

### File Upload

#### `POST /api/upload/avatar`

Upload user avatar image.

**Request**
- Content-Type: `multipart/form-data`
- Body: `file` - Image file (max 5MB, jpg/png/gif/webp)

**Response (200 OK)**
```json
{
  "url": "/uploads/avatars/abc123.jpg"
}
```

---

## tRPC Procedures

All tRPC procedures are accessed via `POST /api/trpc/[router].[procedure]`.

### Auth Router (`auth.*`)

#### `auth.login` (mutation)

Authenticate user and create session.

**Input**
```typescript
{
  email: string;    // Email address
  password: string; // Password (in demo, any password works)
}
```

**Output**
```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: "EMPLOYEE" | "MANAGER" | "COWORKER";
  };
}
```

#### `auth.logout` (mutation)

End current session.

**Output**
```typescript
{ success: true }
```

#### `auth.getCurrentUser` (query)

Get current authenticated user.

**Output**
```typescript
{
  id: string;
  email: string;
  name: string;
  role: "EMPLOYEE" | "MANAGER" | "COWORKER";
  avatar?: string;
} | null
```

---

### User Router (`user.*`)

#### `user.getById` (query)

Get user profile by ID. Managers see all fields; employees see limited fields.

**Input**
```typescript
{
  id: string; // User CUID
}
```

**Output**
```typescript
{
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  position?: string;
  title?: string;
  bio?: string;
  avatar?: string;
  phoneNumber?: string;
  // ... address fields
  // Sensitive fields (managers only):
  salary?: number;
  ssn?: string;
  dateOfBirth?: string;
  performanceRating?: number;
}
```

#### `user.getAll` (query)

Get paginated list of users.

**Input**
```typescript
{
  limit?: number;      // Default: 20, Max: 100
  skip?: number;       // Offset for pagination
  cursor?: string;     // Cursor for cursor-based pagination
  search?: string;     // Search by name
  department?: string; // Filter by department
  role?: "EMPLOYEE" | "MANAGER" | "COWORKER";
}
```

**Output**
```typescript
{
  users: User[];
  total: number;
}
```

#### `user.update` (mutation)

Update non-sensitive profile fields.

**Input**
```typescript
{
  id: string;
  data: {
    name?: string;
    department?: string;
    position?: string;
    title?: string;
    bio?: string;
    avatar?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}
```

#### `user.updateSensitive` (mutation) - Manager Only

Update sensitive profile fields.

**Input**
```typescript
{
  id: string;
  data: {
    salary?: number;
    ssn?: string;        // Format: XXX-XX-XXXX
    dateOfBirth?: Date;
    performanceRating?: number; // 1-5
  };
}
```

#### `user.softDelete` (mutation) - Manager Only

Soft delete a user account.

**Input**
```typescript
{ id: string }
```

#### `user.restore` (mutation) - Manager Only

Restore a soft-deleted user account.

**Input**
```typescript
{ id: string }
```

#### `user.getDepartments` (query)

Get list of unique departments.

**Output**
```typescript
string[]
```

---

### Feedback Router (`feedback.*`)

#### `feedback.create` (mutation)

Create new feedback for a user.

**Input**
```typescript
{
  receiverId: string;
  content: string;      // Min 10 chars, Max 2000 chars
  useAIPolish?: boolean; // Use AI to polish feedback
}
```

**Output**
```typescript
{
  id: string;
  content: string;
  polishedContent?: string;
  isPolished: boolean;
  giverId: string;
  receiverId: string;
  createdAt: Date;
}
```

#### `feedback.getForUser` (query)

Get feedback for a specific user.

**Input**
```typescript
{
  userId: string;
  asGiver?: boolean;  // Get feedback given by user
  asReceiver?: boolean; // Get feedback received by user (default)
  skip?: number;
  take?: number;
}
```

**Output**
```typescript
{
  feedback: FeedbackWithUsers[];
  total: number;
}
```

#### `feedback.polish` (mutation)

Polish existing feedback with AI.

**Input**
```typescript
{ id: string }
```

#### `feedback.delete` (mutation)

Soft delete feedback.

**Input**
```typescript
{ id: string }
```

---

### Absence Router (`absence.*`)

#### `absence.create` (mutation)

Create absence request.

**Input**
```typescript
{
  startDate: Date;
  endDate: Date;
  reason: string;
}
```

#### `absence.getForUser` (query)

Get absence requests for a user.

**Input**
```typescript
{
  userId: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  skip?: number;
  take?: number;
}
```

#### `absence.approve` (mutation) - Manager Only

Approve an absence request.

**Input**
```typescript
{ id: string }
```

#### `absence.reject` (mutation) - Manager Only

Reject an absence request.

**Input**
```typescript
{ id: string }
```

#### `absence.cancel` (mutation)

Cancel own pending absence request.

**Input**
```typescript
{ id: string }
```

---

### Notification Router (`notification.*`)

#### `notification.getAll` (query)

Get all notifications for current user.

**Input**
```typescript
{
  unreadOnly?: boolean;
  skip?: number;
  take?: number;
}
```

**Output**
```typescript
{
  notifications: Notification[];
  total: number;
  unreadCount: number;
}
```

#### `notification.markAsRead` (mutation)

Mark notification as read.

**Input**
```typescript
{ id: string }
```

#### `notification.markAllAsRead` (mutation)

Mark all notifications as read.

---

### Dashboard Router (`dashboard.*`)

#### `dashboard.getStats` (query) - Manager Only

Get dashboard statistics.

**Output**
```typescript
{
  totalEmployees: number;
  totalDepartments: number;
  pendingAbsences: number;
  recentFeedback: number;
  departmentBreakdown: { department: string; count: number }[];
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid input |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## TypeScript Client Usage

```typescript
import { trpc } from '@/lib/trpc/client';

// Query
const { data: user } = trpc.user.getById.useQuery({ id: 'abc123' });

// Mutation
const updateUser = trpc.user.update.useMutation();
await updateUser.mutateAsync({
  id: 'abc123',
  data: { name: 'New Name' }
});
```

---

## Postman Collection

A Postman collection is available at `/docs/postman-collection.json` for testing the API manually.

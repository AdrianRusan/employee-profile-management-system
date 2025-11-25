# Clean Architecture - Source Code Structure

This directory contains the production-ready clean architecture implementation following Uncle Bob's principles.

## Directory Structure

```
src/
├── domain/                      # 🔵 DOMAIN LAYER (Innermost - No Dependencies)
│   ├── entities/               # Business objects with behavior
│   │   ├── User.ts            # User aggregate root
│   │   ├── Absence.ts         # Absence aggregate root
│   │   └── Feedback.ts        # Feedback aggregate root
│   ├── value-objects/         # Immutable values with validation
│   │   ├── DateRange.ts       # Date range with business logic
│   │   ├── Email.ts           # Validated email address
│   │   └── EncryptedField.ts  # Encrypted sensitive data marker
│   └── repositories/          # Repository interfaces (no implementation)
│       ├── IUserRepository.ts
│       ├── IAbsenceRepository.ts
│       └── IFeedbackRepository.ts
│
├── application/                # 🟢 APPLICATION LAYER (Use Cases)
│   ├── use-cases/             # Business workflows
│   │   ├── absence/
│   │   │   ├── CreateAbsenceUseCase.ts
│   │   │   ├── ApproveAbsenceUseCase.ts
│   │   │   └── GetAbsencesUseCase.ts
│   │   ├── feedback/
│   │   │   ├── CreateFeedbackUseCase.ts
│   │   │   ├── PolishFeedbackUseCase.ts
│   │   │   └── GetFeedbackUseCase.ts
│   │   └── user/
│   │       ├── GetUserUseCase.ts
│   │       ├── UpdateUserUseCase.ts
│   │       └── DeleteUserUseCase.ts
│   ├── dtos/                  # Data Transfer Objects
│   │   ├── UserDTO.ts
│   │   ├── AbsenceDTO.ts
│   │   └── FeedbackDTO.ts
│   └── ports/                 # Interfaces for external services
│       ├── ILogger.ts         # Logging abstraction
│       ├── IEncryption.ts     # Encryption service interface
│       └── IAIService.ts      # AI service interface
│
├── infrastructure/             # 🔴 INFRASTRUCTURE LAYER (Outermost)
│   ├── persistence/
│   │   └── prisma/
│   │       ├── repositories/   # Repository implementations
│   │       │   ├── PrismaUserRepository.ts
│   │       │   ├── PrismaAbsenceRepository.ts
│   │       │   └── PrismaFeedbackRepository.ts
│   │       └── mappers/        # Prisma ↔ Domain conversion
│   │           ├── UserMapper.ts
│   │           ├── AbsenceMapper.ts
│   │           └── FeedbackMapper.ts
│   ├── services/              # External service implementations
│   │   ├── PinoLogger.ts      # Logger implementation
│   │   ├── CryptoEncryption.ts
│   │   └── OpenAIService.ts
│   └── di/                    # Dependency Injection
│       └── container.ts       # DI container configuration
│
└── presentation/               # 🟡 PRESENTATION LAYER (API)
    ├── api/
    │   └── trpc/
    │       ├── routers/       # tRPC controllers (thin)
    │       │   ├── absence.ts
    │       │   ├── feedback.ts
    │       │   ├── user.ts
    │       │   └── dashboard.ts
    │       └── context.ts     # tRPC context setup
    └── dtos/                  # API-specific DTOs (if needed)
```

## Layer Dependencies (Dependency Rule)

```
┌─────────────────────────────────────────┐
│         PRESENTATION LAYER              │
│         (API Controllers)               │
│   Depends on: Application Layer         │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│        APPLICATION LAYER                │
│        (Use Cases, DTOs, Ports)         │
│   Depends on: Domain Layer Only         │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│          DOMAIN LAYER                   │
│   (Entities, Value Objects, Interfaces) │
│   Depends on: NOTHING                   │
└─────────────────────────────────────────┘
               ↑
               │
┌──────────────┴──────────────────────────┐
│       INFRASTRUCTURE LAYER              │
│  (Repositories, External Services, DI)  │
│   Depends on: Domain & Application      │
└─────────────────────────────────────────┘
```

**KEY RULE**: Dependencies only point inward. Domain layer has NO dependencies!

## Quick Start

### 1. Create a New Entity

```typescript
// src/domain/entities/YourEntity.ts
export interface YourEntityProps {
  id: string;
  // ... properties
  createdAt: Date;
  updatedAt: Date;
}

export class YourEntity {
  private constructor(private props: YourEntityProps) {
    this.validate();
  }

  static create(/* params */): YourEntity {
    return new YourEntity({
      id: crypto.randomUUID(),
      // ... props
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: YourEntityProps): YourEntity {
    return new YourEntity(props);
  }

  private validate(): void {
    // Validation logic
  }

  // Business methods here

  toObject(): YourEntityProps {
    return { ...this.props };
  }
}
```

### 2. Create a Repository Interface

```typescript
// src/domain/repositories/IYourRepository.ts
export interface IYourRepository {
  findById(id: string): Promise<YourEntity | null>;
  save(entity: YourEntity): Promise<YourEntity>;
  delete(id: string): Promise<void>;
}
```

### 3. Implement the Repository

```typescript
// src/infrastructure/persistence/prisma/repositories/PrismaYourRepository.ts
export class PrismaYourRepository implements IYourRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<YourEntity | null> {
    const prismaData = await this.prisma.yourModel.findUnique({ where: { id } });
    return prismaData ? YourMapper.toDomain(prismaData) : null;
  }

  // ... implement other methods
}
```

### 4. Create a Use Case

```typescript
// src/application/use-cases/your-feature/YourUseCase.ts
export class YourUseCase {
  constructor(
    private readonly repository: IYourRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: YourDTO): Promise<YourOutputDTO> {
    this.logger.info('Executing use case');

    // 1. Validate input
    // 2. Get entities from repositories
    // 3. Apply business logic (call entity methods)
    // 4. Save via repositories
    // 5. Return DTO

    return outputDTO;
  }
}
```

### 5. Register in DI Container

```typescript
// src/infrastructure/di/container.ts
private _yourRepository: IYourRepository;
private _yourUseCase: YourUseCase;

// In constructor:
this._yourRepository = new PrismaYourRepository(this._prisma);
this._yourUseCase = new YourUseCase(this._yourRepository, this._logger);

// Getter:
get yourUseCase(): YourUseCase {
  return this._yourUseCase;
}
```

### 6. Use in tRPC Router

```typescript
// src/presentation/api/trpc/routers/your-router.ts
import { container } from '../../../../infrastructure/di/container';

export const yourRouter = router({
  yourEndpoint: protectedProcedure
    .input(yourSchema)
    .mutation(async ({ input }) => {
      return container.yourUseCase.execute(input);
    }),
});
```

## Patterns and Practices

### ✅ DO

- **Domain Layer**: Pure business logic, no framework dependencies
- **Use Cases**: One class per use case, single responsibility
- **DTOs**: Separate types for input/output
- **Repositories**: Interface in domain, implementation in infrastructure
- **Validation**: Business rules in entities, structural validation in DTOs/schemas
- **Error Handling**: Throw domain exceptions, catch in presentation layer
- **Testing**: Unit test domain entities, integration test use cases

### ❌ DON'T

- **Don't** import Prisma types in domain layer
- **Don't** put business logic in repositories
- **Don't** let presentation layer access repositories directly
- **Don't** create circular dependencies
- **Don't** use DTOs in domain layer (use entities)
- **Don't** mix concerns (HTTP in use cases, business logic in controllers)

## Testing Examples

### Domain Entity Test

```typescript
import { describe, it, expect } from 'vitest';
import { YourEntity } from '../YourEntity';

describe('YourEntity', () => {
  it('should validate business rules', () => {
    expect(() => YourEntity.create(/* invalid data */)).toThrow();
  });

  it('should perform business logic', () => {
    const entity = YourEntity.create(/* valid data */);
    entity.doBusinessLogic();
    expect(entity.someProperty).toBe(expectedValue);
  });
});
```

### Use Case Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { YourUseCase } from '../YourUseCase';

describe('YourUseCase', () => {
  it('should execute successfully', async () => {
    // Arrange
    const mockRepository = {
      findById: vi.fn().mockResolvedValue(mockEntity),
      save: vi.fn().mockResolvedValue(savedEntity),
    };
    const mockLogger = { info: vi.fn(), error: vi.fn() };
    const useCase = new YourUseCase(mockRepository, mockLogger);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toEqual(expectedOutput);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
```

## Benefits

### 🎯 Testability
- Pure functions easy to test
- Mock repositories for use case tests
- No database required for domain tests

### 🔧 Maintainability
- Clear separation of concerns
- Easy to locate code
- Single responsibility

### 🚀 Flexibility
- Swap implementations without changing logic
- Can change database without touching domain
- Can change framework without rewriting business rules

### 📈 Scalability
- Domain layer becomes reusable library
- Can split into microservices
- Clear API boundaries

## Resources

- [CLEAN_ARCHITECTURE_IMPLEMENTATION_GUIDE.md](../CLEAN_ARCHITECTURE_IMPLEMENTATION_GUIDE.md) - Complete implementation guide
- [Clean Architecture Book](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164) - Robert C. Martin
- [DDD Book](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215) - Eric Evans

## Questions?

Check the implementation guide or review existing code examples in each layer.

import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../server/db';

// Domain Repository Interfaces
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IAbsenceRepository } from '../../domain/repositories/IAbsenceRepository';
import { IFeedbackRepository } from '../../domain/repositories/IFeedbackRepository';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IOrganizationRepository } from '../../domain/repositories/IOrganizationRepository';

// Infrastructure Repository Implementations
import { PrismaUserRepository } from '../persistence/prisma/repositories/PrismaUserRepository';
import { PrismaAbsenceRepository } from '../persistence/prisma/repositories/PrismaAbsenceRepository';
import { PrismaFeedbackRepository } from '../persistence/prisma/repositories/PrismaFeedbackRepository';
import { PrismaNotificationRepository } from '../persistence/prisma/repositories/PrismaNotificationRepository';
import { PrismaOrganizationRepository } from '../persistence/prisma/repositories/PrismaOrganizationRepository';

// Application Ports
import { ILogger } from '../../application/ports/ILogger';
import { IEncryption } from '../../application/ports/IEncryption';
import { IAIService } from '../../application/ports/IAIService';

// Infrastructure Service Implementations
import { PinoLogger } from '../services/PinoLogger';
import { CryptoEncryption } from '../services/CryptoEncryption';
import { HuggingFaceAIService } from '../services/HuggingFaceAIService';

// Use Cases - Absence
import { CreateAbsenceUseCase } from '../../application/use-cases/absence/CreateAbsenceUseCase';
import { GetAbsencesUseCase } from '../../application/use-cases/absence/GetAbsencesUseCase';
import { ApproveAbsenceUseCase } from '../../application/use-cases/absence/ApproveAbsenceUseCase';
import { RejectAbsenceUseCase } from '../../application/use-cases/absence/RejectAbsenceUseCase';
import { DeleteAbsenceUseCase } from '../../application/use-cases/absence/DeleteAbsenceUseCase';
import { GetAbsenceStatisticsUseCase } from '../../application/use-cases/absence/GetAbsenceStatisticsUseCase';

// Use Cases - User
import { GetUserUseCase } from '../../application/use-cases/user/GetUserUseCase';
import { ListUsersUseCase } from '../../application/use-cases/user/ListUsersUseCase';
import { UpdateUserProfileUseCase } from '../../application/use-cases/user/UpdateUserProfileUseCase';
import { UpdateSensitiveFieldsUseCase } from '../../application/use-cases/user/UpdateSensitiveFieldsUseCase';
import { DeleteUserUseCase } from '../../application/use-cases/user/DeleteUserUseCase';
import { RestoreUserUseCase } from '../../application/use-cases/user/RestoreUserUseCase';

// Use Cases - Feedback
import { CreateFeedbackUseCase } from '../../application/use-cases/feedback/CreateFeedbackUseCase';
import { PolishFeedbackUseCase } from '../../application/use-cases/feedback/PolishFeedbackUseCase';
import { GetFeedbackUseCase } from '../../application/use-cases/feedback/GetFeedbackUseCase';
import { DeleteFeedbackUseCase } from '../../application/use-cases/feedback/DeleteFeedbackUseCase';

// Use Cases - Dashboard
import { GetDashboardMetricsUseCase } from '../../application/use-cases/dashboard/GetDashboardMetricsUseCase';

// Use Cases - Notification
import { CreateNotificationUseCase } from '../../application/use-cases/notification/CreateNotificationUseCase';
import { GetNotificationsUseCase } from '../../application/use-cases/notification/GetNotificationsUseCase';
import { MarkNotificationReadUseCase } from '../../application/use-cases/notification/MarkNotificationReadUseCase';
import { MarkAllNotificationsReadUseCase } from '../../application/use-cases/notification/MarkAllNotificationsReadUseCase';

// Use Cases - Organization
import { GetOrganizationUseCase } from '../../application/use-cases/organization/GetOrganizationUseCase';
import { GetOrganizationSettingsUseCase } from '../../application/use-cases/organization/GetOrganizationSettingsUseCase';
import { UpdateOrganizationSettingsUseCase } from '../../application/use-cases/organization/UpdateOrganizationSettingsUseCase';
import { CompleteOnboardingUseCase } from '../../application/use-cases/organization/CompleteOnboardingUseCase';

/**
 * Dependency Injection Container
 *
 * Manages all dependencies and their lifecycles in the application.
 * Follows the Dependency Inversion Principle by depending on abstractions (interfaces)
 * rather than concrete implementations.
 *
 * Responsibilities:
 * - Create and wire up all dependencies
 * - Provide singleton access to services and repositories
 * - Ensure proper dependency injection for all use cases
 * - Manage the application's object graph
 *
 * Benefits:
 * - Centralized dependency management
 * - Easy to swap implementations (e.g., replace Prisma with another ORM)
 * - Simplified testing (can inject mocks)
 * - Clear visibility of all application dependencies
 *
 * Usage:
 * ```typescript
 * import { container } from '@/src/infrastructure/di/container';
 *
 * // In tRPC routers
 * const result = await container.createAbsenceUseCase.execute(input);
 * ```
 */
export class Container {
  private static instance: Container;

  // Infrastructure Dependencies
  private _prisma: PrismaClient;
  private _logger: ILogger;
  private _encryption: IEncryption;
  private _aiService: IAIService;

  // Repository Implementations
  private _userRepository: IUserRepository;
  private _absenceRepository: IAbsenceRepository;
  private _feedbackRepository: IFeedbackRepository;
  private _notificationRepository: INotificationRepository;
  private _organizationRepository: IOrganizationRepository;

  // Use Cases - Absence
  private _createAbsenceUseCase: CreateAbsenceUseCase;
  private _getAbsencesUseCase: GetAbsencesUseCase;
  private _approveAbsenceUseCase: ApproveAbsenceUseCase;
  private _rejectAbsenceUseCase: RejectAbsenceUseCase;
  private _deleteAbsenceUseCase: DeleteAbsenceUseCase;
  private _getAbsenceStatisticsUseCase: GetAbsenceStatisticsUseCase;

  // Use Cases - User
  private _getUserUseCase: GetUserUseCase;
  private _listUsersUseCase: ListUsersUseCase;
  private _updateUserProfileUseCase: UpdateUserProfileUseCase;
  private _updateSensitiveFieldsUseCase: UpdateSensitiveFieldsUseCase;
  private _deleteUserUseCase: DeleteUserUseCase;
  private _restoreUserUseCase: RestoreUserUseCase;

  // Use Cases - Feedback
  private _createFeedbackUseCase: CreateFeedbackUseCase;
  private _polishFeedbackUseCase: PolishFeedbackUseCase;
  private _getFeedbackUseCase: GetFeedbackUseCase;
  private _deleteFeedbackUseCase: DeleteFeedbackUseCase;

  // Use Cases - Dashboard
  private _getDashboardMetricsUseCase: GetDashboardMetricsUseCase;

  // Use Cases - Notification
  private _createNotificationUseCase: CreateNotificationUseCase;
  private _getNotificationsUseCase: GetNotificationsUseCase;
  private _markNotificationReadUseCase: MarkNotificationReadUseCase;
  private _markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase;

  // Use Cases - Organization
  private _getOrganizationUseCase: GetOrganizationUseCase;
  private _getOrganizationSettingsUseCase: GetOrganizationSettingsUseCase;
  private _updateOrganizationSettingsUseCase: UpdateOrganizationSettingsUseCase;
  private _completeOnboardingUseCase: CompleteOnboardingUseCase;

  private constructor() {
    // Initialize infrastructure dependencies
    this._prisma = prisma;
    this._logger = new PinoLogger();
    this._encryption = new CryptoEncryption();
    this._aiService = new HuggingFaceAIService();

    // Initialize repositories with their dependencies
    this._userRepository = new PrismaUserRepository(this._prisma, this._encryption);
    this._absenceRepository = new PrismaAbsenceRepository(this._prisma);
    this._feedbackRepository = new PrismaFeedbackRepository(this._prisma);
    this._notificationRepository = new PrismaNotificationRepository(this._prisma);
    this._organizationRepository = new PrismaOrganizationRepository(this._prisma);

    // Initialize use cases with their dependencies

    // Absence Use Cases
    this._createAbsenceUseCase = new CreateAbsenceUseCase(
      this._absenceRepository,
      this._userRepository,
      this._logger
    );
    this._getAbsencesUseCase = new GetAbsencesUseCase(
      this._absenceRepository,
      this._userRepository,
      this._logger
    );
    this._approveAbsenceUseCase = new ApproveAbsenceUseCase(
      this._absenceRepository,
      this._userRepository,
      this._logger
    );
    this._rejectAbsenceUseCase = new RejectAbsenceUseCase(
      this._absenceRepository,
      this._userRepository,
      this._logger
    );
    this._deleteAbsenceUseCase = new DeleteAbsenceUseCase(
      this._absenceRepository,
      this._userRepository,
      this._logger
    );
    this._getAbsenceStatisticsUseCase = new GetAbsenceStatisticsUseCase(
      this._absenceRepository,
      this._userRepository,
      this._logger
    );

    // User Use Cases
    this._getUserUseCase = new GetUserUseCase(
      this._userRepository,
      this._logger
    );
    this._listUsersUseCase = new ListUsersUseCase(
      this._userRepository,
      this._logger
    );
    this._updateUserProfileUseCase = new UpdateUserProfileUseCase(
      this._userRepository,
      this._logger
    );
    this._updateSensitiveFieldsUseCase = new UpdateSensitiveFieldsUseCase(
      this._userRepository,
      this._encryption,
      this._logger
    );
    this._deleteUserUseCase = new DeleteUserUseCase(
      this._userRepository,
      this._logger
    );
    this._restoreUserUseCase = new RestoreUserUseCase(
      this._userRepository,
      this._logger
    );

    // Feedback Use Cases
    this._createFeedbackUseCase = new CreateFeedbackUseCase(
      this._feedbackRepository,
      this._userRepository,
      this._logger
    );
    this._polishFeedbackUseCase = new PolishFeedbackUseCase(
      this._feedbackRepository,
      this._aiService,
      this._logger
    );
    this._getFeedbackUseCase = new GetFeedbackUseCase(
      this._feedbackRepository,
      this._userRepository,
      this._logger
    );
    this._deleteFeedbackUseCase = new DeleteFeedbackUseCase(
      this._feedbackRepository,
      this._userRepository,
      this._logger
    );

    // Dashboard Use Cases
    this._getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
      this._absenceRepository,
      this._feedbackRepository,
      this._userRepository,
      this._logger
    );

    // Notification Use Cases
    this._createNotificationUseCase = new CreateNotificationUseCase(
      this._notificationRepository,
      this._logger
    );
    this._getNotificationsUseCase = new GetNotificationsUseCase(
      this._notificationRepository,
      this._logger
    );
    this._markNotificationReadUseCase = new MarkNotificationReadUseCase(
      this._notificationRepository,
      this._logger
    );
    this._markAllNotificationsReadUseCase = new MarkAllNotificationsReadUseCase(
      this._notificationRepository,
      this._logger
    );

    // Organization Use Cases
    this._getOrganizationUseCase = new GetOrganizationUseCase(
      this._organizationRepository
    );
    this._getOrganizationSettingsUseCase = new GetOrganizationSettingsUseCase(
      this._organizationRepository
    );
    this._updateOrganizationSettingsUseCase = new UpdateOrganizationSettingsUseCase(
      this._organizationRepository
    );
    this._completeOnboardingUseCase = new CompleteOnboardingUseCase(
      this._organizationRepository
    );
  }

  /**
   * Get the singleton container instance
   * Ensures only one container exists throughout the application lifecycle
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Reset the container instance (useful for testing)
   * WARNING: Only use this in test environments
   */
  static resetInstance(): void {
    Container.instance = null as any;
  }

  // ==================== Infrastructure Getters ====================

  /**
   * Get the Prisma client instance
   * Useful for custom queries or transactions
   */
  get prisma(): PrismaClient {
    return this._prisma;
  }

  /**
   * Get the logger instance
   * For custom logging outside of use cases
   */
  get logger(): ILogger {
    return this._logger;
  }

  /**
   * Get the encryption service
   * For custom encryption/decryption operations
   */
  get encryption(): IEncryption {
    return this._encryption;
  }

  /**
   * Get the AI service
   * For custom AI operations
   */
  get aiService(): IAIService {
    return this._aiService;
  }

  // ==================== Repository Getters ====================

  /**
   * Get the User repository
   * Useful for direct repository access in complex scenarios
   */
  get userRepository(): IUserRepository {
    return this._userRepository;
  }

  /**
   * Get the Absence repository
   * Useful for direct repository access in complex scenarios
   */
  get absenceRepository(): IAbsenceRepository {
    return this._absenceRepository;
  }

  /**
   * Get the Feedback repository
   * Useful for direct repository access in complex scenarios
   */
  get feedbackRepository(): IFeedbackRepository {
    return this._feedbackRepository;
  }

  /**
   * Get the Notification repository
   * Useful for direct repository access in complex scenarios
   */
  get notificationRepository(): INotificationRepository {
    return this._notificationRepository;
  }

  // ==================== Use Case Getters - Absence ====================

  get createAbsenceUseCase(): CreateAbsenceUseCase {
    return this._createAbsenceUseCase;
  }

  get getAbsencesUseCase(): GetAbsencesUseCase {
    return this._getAbsencesUseCase;
  }

  get approveAbsenceUseCase(): ApproveAbsenceUseCase {
    return this._approveAbsenceUseCase;
  }

  get rejectAbsenceUseCase(): RejectAbsenceUseCase {
    return this._rejectAbsenceUseCase;
  }

  get deleteAbsenceUseCase(): DeleteAbsenceUseCase {
    return this._deleteAbsenceUseCase;
  }

  get getAbsenceStatisticsUseCase(): GetAbsenceStatisticsUseCase {
    return this._getAbsenceStatisticsUseCase;
  }

  // ==================== Use Case Getters - User ====================

  get getUserUseCase(): GetUserUseCase {
    return this._getUserUseCase;
  }

  get listUsersUseCase(): ListUsersUseCase {
    return this._listUsersUseCase;
  }

  get updateUserProfileUseCase(): UpdateUserProfileUseCase {
    return this._updateUserProfileUseCase;
  }

  // ==================== Use Case Getters - Feedback ====================

  get createFeedbackUseCase(): CreateFeedbackUseCase {
    return this._createFeedbackUseCase;
  }

  get polishFeedbackUseCase(): PolishFeedbackUseCase {
    return this._polishFeedbackUseCase;
  }

  get getFeedbackUseCase(): GetFeedbackUseCase {
    return this._getFeedbackUseCase;
  }

  get deleteFeedbackUseCase(): DeleteFeedbackUseCase {
    return this._deleteFeedbackUseCase;
  }

  // ==================== Use Case Getters - Dashboard ====================

  get getDashboardMetricsUseCase(): GetDashboardMetricsUseCase {
    return this._getDashboardMetricsUseCase;
  }

  // ==================== Additional Use Case Getters - User ====================

  get updateSensitiveFieldsUseCase(): UpdateSensitiveFieldsUseCase {
    return this._updateSensitiveFieldsUseCase;
  }

  get deleteUserUseCase(): DeleteUserUseCase {
    return this._deleteUserUseCase;
  }

  get restoreUserUseCase(): RestoreUserUseCase {
    return this._restoreUserUseCase;
  }

  // ==================== Use Case Getters - Notification ====================

  get createNotificationUseCase(): CreateNotificationUseCase {
    return this._createNotificationUseCase;
  }

  get getNotificationsUseCase(): GetNotificationsUseCase {
    return this._getNotificationsUseCase;
  }

  get markNotificationReadUseCase(): MarkNotificationReadUseCase {
    return this._markNotificationReadUseCase;
  }

  get markAllNotificationsReadUseCase(): MarkAllNotificationsReadUseCase {
    return this._markAllNotificationsReadUseCase;
  }

  // ==================== Repository Getter - Organization ====================

  /**
   * Get the Organization repository
   * Useful for direct repository access in complex scenarios
   */
  get organizationRepository(): IOrganizationRepository {
    return this._organizationRepository;
  }

  // ==================== Use Case Getters - Organization ====================

  get getOrganizationUseCase(): GetOrganizationUseCase {
    return this._getOrganizationUseCase;
  }

  get getOrganizationSettingsUseCase(): GetOrganizationSettingsUseCase {
    return this._getOrganizationSettingsUseCase;
  }

  get updateOrganizationSettingsUseCase(): UpdateOrganizationSettingsUseCase {
    return this._updateOrganizationSettingsUseCase;
  }

  get completeOnboardingUseCase(): CompleteOnboardingUseCase {
    return this._completeOnboardingUseCase;
  }
}

/**
 * Export singleton container instance
 * This is the primary way to access the container throughout the application
 *
 * @example
 * import { container } from '@/src/infrastructure/di/container';
 *
 * // In a tRPC router
 * export const absenceRouter = router({
 *   create: protectedProcedure
 *     .input(absenceRequestSchema)
 *     .mutation(async ({ ctx, input }) => {
 *       return container.createAbsenceUseCase.execute({
 *         userId: ctx.session.userId,
 *         startDate: input.startDate,
 *         endDate: input.endDate,
 *         reason: input.reason,
 *       });
 *     }),
 * });
 */
export const container = Container.getInstance();

import { IAbsenceRepository } from '../../../domain/repositories/IAbsenceRepository';
import { IFeedbackRepository } from '../../../domain/repositories/IFeedbackRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ILogger } from '../../ports/ILogger';
import { AbsenceStatus } from '../../../domain/entities/Absence';
import { Feedback } from '../../../domain/entities/Feedback';

export interface GetDashboardMetricsInput {
  userId: string;
}

export interface GetDashboardMetricsOutput {
  user: {
    name: string;
    role: string;
    department: string | null;
  };
  absences: {
    totalDays: number;
    approvedDays: number;
    pendingRequests: number;
    rejectedRequests: number;
  };
  feedback: {
    totalReceived: number;
    totalGiven: number;
    polishedCount: number;
  };
  recentAbsences: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    status: string;
    totalDays: number;
  }>;
  recentFeedback: Array<{
    id: string;
    giverId: string;
    receiverId: string;
    content: string;
    createdAt: Date;
  }>;
  managerMetrics?: {
    teamSize: number;
    pendingApprovals: number;
    avgPerformance: number | null;
  };
}

/**
 * Get Dashboard Metrics Use Case
 * Retrieves comprehensive dashboard metrics for a user
 */
export class GetDashboardMetricsUseCase {
  constructor(
    private readonly absenceRepository: IAbsenceRepository,
    private readonly feedbackRepository: IFeedbackRepository,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: GetDashboardMetricsInput): Promise<GetDashboardMetricsOutput> {
    this.logger.debug({ userId: input.userId }, 'Getting dashboard metrics');

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Execute all queries in parallel for performance
    const [absenceStats, feedbackStats, recentAbsences, recentFeedback] = await Promise.all([
      this.absenceRepository.getStatistics(input.userId),
      this.feedbackRepository.getStatistics(input.userId),
      this.absenceRepository.findByUserId(input.userId),
      this.feedbackRepository.findByReceiverId(input.userId),
    ]);

    // Get the 5 most recent absences and feedback
    const recentAbsencesResult = recentAbsences.slice(0, 5);
    const recentFeedbackList = recentFeedback.feedbacks.slice(0, 5);

    const output: GetDashboardMetricsOutput = {
      user: {
        name: user.name,
        role: user.role,
        department: user.department || null,
      },
      absences: {
        totalDays: absenceStats.totalDays,
        approvedDays: absenceStats.approvedDays,
        pendingRequests: absenceStats.pendingRequests,
        rejectedRequests: absenceStats.rejectedRequests,
      },
      feedback: {
        totalReceived: feedbackStats.receivedCount,
        totalGiven: feedbackStats.givenCount,
        polishedCount: feedbackStats.polishedCount,
      },
      recentAbsences: recentAbsencesResult.map(a => ({
        id: a.id,
        startDate: a.dateRange.start,
        endDate: a.dateRange.end,
        status: a.status,
        totalDays: a.getTotalDays(),
      })),
      recentFeedback: recentFeedbackList.map((f: Feedback) => ({
        id: f.id,
        giverId: f.giverId,
        receiverId: f.receiverId,
        content: f.content.substring(0, 100), // Preview only
        createdAt: f.createdAt,
      })),
    };

    // Add manager-specific metrics if user is a manager
    if (user.role === 'MANAGER' && user.department) {
      const teamMembers = await this.userRepository.findAll({
        department: user.department,
        includeDeleted: false,
      });

      const pendingAbsences = await this.absenceRepository.findAll({
        status: AbsenceStatus.PENDING,
      });

      // Calculate average performance rating for team
      const performanceRatings = teamMembers.users
        .map(u => u.performanceRating)
        .filter((rating): rating is number => rating !== null && rating !== undefined);

      const avgPerformance = performanceRatings.length > 0
        ? performanceRatings.reduce((sum, rating) => sum + rating, 0) / performanceRatings.length
        : null;

      output.managerMetrics = {
        teamSize: teamMembers.users.length,
        pendingApprovals: pendingAbsences.absences.length,
        avgPerformance,
      };
    }

    return output;
  }
}

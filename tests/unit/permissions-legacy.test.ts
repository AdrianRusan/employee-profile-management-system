import { describe, it, expect } from 'vitest';
import {
  canViewSensitiveData,
  canEditProfile,
  canViewFeedback,
  canApproveAbsence,
  canGiveFeedback,
  canDeleteFeedback,
} from '@/lib/permissions';
import { Role } from '@prisma/client';

describe('Legacy permission functions (deprecated)', () => {
  describe('canViewSensitiveData', () => {
    it('allows managers to view any user sensitive data', () => {
      expect(canViewSensitiveData('MANAGER', 'manager-id', 'employee-id')).toBe(true);
    });

    it('allows users to view their own sensitive data', () => {
      expect(canViewSensitiveData('EMPLOYEE', 'user-id', 'user-id')).toBe(true);
    });

    it('denies employees viewing other employees sensitive data', () => {
      expect(canViewSensitiveData('EMPLOYEE', 'user1-id', 'user2-id')).toBe(false);
    });
  });

  describe('canEditProfile', () => {
    it('allows managers to edit any profile', () => {
      expect(canEditProfile('MANAGER', 'manager-id', 'employee-id')).toBe(true);
    });

    it('allows users to edit their own profile', () => {
      expect(canEditProfile('EMPLOYEE', 'user-id', 'user-id')).toBe(true);
    });

    it('denies employees editing other profiles', () => {
      expect(canEditProfile('EMPLOYEE', 'user1-id', 'user2-id')).toBe(false);
    });
  });

  describe('canViewFeedback', () => {
    it('allows managers to view all feedback', () => {
      expect(canViewFeedback('MANAGER', 'manager-id', 'receiver-id', 'giver-id')).toBe(true);
    });

    it('allows users to view feedback they received', () => {
      expect(canViewFeedback('EMPLOYEE', 'user-id', 'user-id', 'giver-id')).toBe(true);
    });

    it('allows users to view feedback they gave', () => {
      expect(canViewFeedback('EMPLOYEE', 'user-id', 'receiver-id', 'user-id')).toBe(true);
    });

    it('denies users viewing feedback they are not involved in', () => {
      expect(canViewFeedback('EMPLOYEE', 'user-id', 'receiver-id', 'giver-id')).toBe(false);
    });

    it('denies viewing feedback when giver is not specified and user is not receiver', () => {
      expect(canViewFeedback('EMPLOYEE', 'user-id', 'receiver-id', undefined)).toBe(false);
    });
  });

  describe('canApproveAbsence', () => {
    it('allows managers to approve absences', () => {
      expect(canApproveAbsence('MANAGER')).toBe(true);
    });

    it('denies employees approving absences', () => {
      expect(canApproveAbsence('EMPLOYEE')).toBe(false);
    });
  });

  describe('canGiveFeedback', () => {
    it('returns true for all users (basic check)', () => {
      expect(canGiveFeedback()).toBe(true);
    });
  });

  describe('canDeleteFeedback', () => {
    it('allows managers to delete any feedback', () => {
      expect(canDeleteFeedback('MANAGER', 'manager-id', 'giver-id')).toBe(true);
    });

    it('allows users to delete their own feedback', () => {
      expect(canDeleteFeedback('EMPLOYEE', 'user-id', 'user-id')).toBe(true);
    });

    it('denies users deleting feedback they did not give', () => {
      expect(canDeleteFeedback('EMPLOYEE', 'user-id', 'other-user-id')).toBe(false);
    });
  });
});

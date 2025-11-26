import { describe, it, expect, beforeEach } from 'vitest';
import { User, Role } from '@/src/domain/entities/User';
import { Email } from '@/src/domain/value-objects/Email';

describe('User Entity', () => {
  const createTestUser = (overrides: Partial<Parameters<typeof User.create>[0]> = {}) => {
    return User.create({
      id: 'test-user-id',
      email: Email.create('test@example.com'),
      name: 'Test User',
      role: Role.EMPLOYEE,
      department: 'Engineering',
      ...overrides,
    });
  };

  describe('create', () => {
    it('should create a user with valid properties', () => {
      const user = createTestUser();

      expect(user.id).toBe('test-user-id');
      expect(user.email.value).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe(Role.EMPLOYEE);
      expect(user.department).toBe('Engineering');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for empty name', () => {
      expect(() => createTestUser({ name: '' })).toThrow('User name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => createTestUser({ name: '   ' })).toThrow('User name cannot be empty');
    });

    it('should throw error for invalid performance rating (too low)', () => {
      expect(() => createTestUser({ performanceRating: 0 })).toThrow(
        'Performance rating must be between 1 and 5'
      );
    });

    it('should throw error for invalid performance rating (too high)', () => {
      expect(() => createTestUser({ performanceRating: 6 })).toThrow(
        'Performance rating must be between 1 and 5'
      );
    });

    it('should accept valid performance rating', () => {
      const user = createTestUser({ performanceRating: 4 });
      expect(user.performanceRating).toBe(4);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute user from persistence', () => {
      const now = new Date();
      const user = User.reconstitute({
        id: 'persisted-id',
        email: Email.create('persisted@example.com'),
        name: 'Persisted User',
        role: Role.MANAGER,
        department: 'Sales',
        createdAt: now,
        updatedAt: now,
      });

      expect(user.id).toBe('persisted-id');
      expect(user.name).toBe('Persisted User');
      expect(user.role).toBe(Role.MANAGER);
    });
  });

  describe('role checks', () => {
    it('should correctly identify manager role', () => {
      const manager = createTestUser({ role: Role.MANAGER });
      expect(manager.isManager()).toBe(true);
      expect(manager.isEmployee()).toBe(false);
    });

    it('should correctly identify employee role', () => {
      const employee = createTestUser({ role: Role.EMPLOYEE });
      expect(employee.isEmployee()).toBe(true);
      expect(employee.isManager()).toBe(false);
    });

    it('should correctly identify coworker role', () => {
      const coworker = createTestUser({ role: Role.COWORKER });
      expect(coworker.isEmployee()).toBe(false);
      expect(coworker.isManager()).toBe(false);
    });
  });

  describe('canViewSensitiveDataOf', () => {
    it('should allow user to view own sensitive data', () => {
      const user = createTestUser();
      expect(user.canViewSensitiveDataOf(user)).toBe(true);
    });

    it('should allow manager to view sensitive data of same department', () => {
      const manager = createTestUser({
        id: 'manager-id',
        role: Role.MANAGER,
        department: 'Engineering',
      });
      const employee = createTestUser({
        id: 'employee-id',
        role: Role.EMPLOYEE,
        department: 'Engineering',
      });

      expect(manager.canViewSensitiveDataOf(employee)).toBe(true);
    });

    it('should not allow manager to view sensitive data of different department', () => {
      const manager = createTestUser({
        id: 'manager-id',
        role: Role.MANAGER,
        department: 'Engineering',
      });
      const employee = createTestUser({
        id: 'employee-id',
        role: Role.EMPLOYEE,
        department: 'Sales',
      });

      expect(manager.canViewSensitiveDataOf(employee)).toBe(false);
    });

    it('should not allow employee to view other user sensitive data', () => {
      const employee1 = createTestUser({
        id: 'employee-1',
        department: 'Engineering',
      });
      const employee2 = createTestUser({
        id: 'employee-2',
        department: 'Engineering',
      });

      expect(employee1.canViewSensitiveDataOf(employee2)).toBe(false);
    });

    it('should not allow manager without department to view sensitive data', () => {
      const manager = createTestUser({
        id: 'manager-id',
        role: Role.MANAGER,
        department: undefined,
      });
      const employee = createTestUser({
        id: 'employee-id',
        department: 'Engineering',
      });

      expect(manager.canViewSensitiveDataOf(employee)).toBe(false);
    });
  });

  describe('canApproveAbsences', () => {
    it('should allow manager to approve absences', () => {
      const manager = createTestUser({ role: Role.MANAGER });
      expect(manager.canApproveAbsences()).toBe(true);
    });

    it('should not allow employee to approve absences', () => {
      const employee = createTestUser({ role: Role.EMPLOYEE });
      expect(employee.canApproveAbsences()).toBe(false);
    });
  });

  describe('canEditProfile', () => {
    it('should allow user to edit own profile', () => {
      const user = createTestUser();
      expect(user.canEditProfile(user)).toBe(true);
    });

    it('should allow manager to edit profile in same department', () => {
      const manager = createTestUser({
        id: 'manager-id',
        role: Role.MANAGER,
        department: 'Engineering',
      });
      const employee = createTestUser({
        id: 'employee-id',
        department: 'Engineering',
      });

      expect(manager.canEditProfile(employee)).toBe(true);
    });

    it('should not allow employee to edit other profiles', () => {
      const employee1 = createTestUser({ id: 'emp-1' });
      const employee2 = createTestUser({ id: 'emp-2' });

      expect(employee1.canEditProfile(employee2)).toBe(false);
    });
  });

  describe('canDeleteUser', () => {
    it('should not allow user to delete themselves', () => {
      const manager = createTestUser({ role: Role.MANAGER });
      expect(manager.canDeleteUser(manager)).toBe(false);
    });

    it('should allow manager to delete user in same department', () => {
      const manager = createTestUser({
        id: 'manager-id',
        role: Role.MANAGER,
        department: 'Engineering',
      });
      const employee = createTestUser({
        id: 'employee-id',
        department: 'Engineering',
      });

      expect(manager.canDeleteUser(employee)).toBe(true);
    });

    it('should not allow manager to delete user in different department', () => {
      const manager = createTestUser({
        id: 'manager-id',
        role: Role.MANAGER,
        department: 'Engineering',
      });
      const employee = createTestUser({
        id: 'employee-id',
        department: 'Sales',
      });

      expect(manager.canDeleteUser(employee)).toBe(false);
    });
  });

  describe('softDelete and restore', () => {
    it('should soft delete user', () => {
      const user = createTestUser();
      expect(user.isDeleted()).toBe(false);

      user.softDelete();

      expect(user.isDeleted()).toBe(true);
      expect(user.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw when soft deleting already deleted user', () => {
      const user = createTestUser();
      user.softDelete();

      expect(() => user.softDelete()).toThrow('User is already deleted');
    });

    it('should restore soft-deleted user', () => {
      const user = createTestUser();
      user.softDelete();
      expect(user.isDeleted()).toBe(true);

      user.restore();

      expect(user.isDeleted()).toBe(false);
      expect(user.deletedAt).toBeUndefined();
    });

    it('should throw when restoring non-deleted user', () => {
      const user = createTestUser();

      expect(() => user.restore()).toThrow('User is not deleted');
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', () => {
      const user = createTestUser();
      const originalUpdatedAt = user.updatedAt;

      // Small delay to ensure different timestamp
      user.updateProfile({
        name: 'Updated Name',
        department: 'Sales',
        bio: 'New bio',
      });

      expect(user.name).toBe('Updated Name');
      expect(user.department).toBe('Sales');
      expect(user.bio).toBe('New bio');
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should throw for empty name update', () => {
      const user = createTestUser();

      expect(() => user.updateProfile({ name: '' })).toThrow('Name cannot be empty');
    });

    it('should allow partial updates', () => {
      const user = createTestUser({ department: 'Engineering', bio: 'Original bio' });

      user.updateProfile({ bio: 'Updated bio' });

      expect(user.department).toBe('Engineering'); // Unchanged
      expect(user.bio).toBe('Updated bio'); // Updated
    });
  });

  describe('updateSensitiveFields', () => {
    it('should update salary', () => {
      const user = createTestUser();

      user.updateSensitiveFields({ salary: 100000 });

      expect(user.salary).toBe(100000);
    });

    it('should throw for negative salary', () => {
      const user = createTestUser();

      expect(() => user.updateSensitiveFields({ salary: -1000 })).toThrow(
        'Salary cannot be negative'
      );
    });

    it('should update performance rating', () => {
      const user = createTestUser();

      user.updateSensitiveFields({ performanceRating: 5 });

      expect(user.performanceRating).toBe(5);
    });

    it('should throw for invalid performance rating', () => {
      const user = createTestUser();

      expect(() => user.updateSensitiveFields({ performanceRating: 0 })).toThrow(
        'Performance rating must be between 1 and 5'
      );
    });
  });

  describe('toObject', () => {
    it('should return all properties', () => {
      const user = createTestUser({
        department: 'Engineering',
        salary: 100000,
      });

      const obj = user.toObject();

      expect(obj.id).toBe('test-user-id');
      expect(obj.name).toBe('Test User');
      expect(obj.department).toBe('Engineering');
      expect(obj.salary).toBe(100000);
      expect(obj.createdAt).toBeInstanceOf(Date);
    });
  });
});

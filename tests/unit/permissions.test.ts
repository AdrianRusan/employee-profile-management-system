import { describe, it, expect } from 'vitest';
import { Permissions, assertPermission, SessionUser } from '@/lib/permissions';
import { Role } from '@prisma/client';

describe('Permissions.user.viewSensitive', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };
  const anotherEmployee: SessionUser = { id: '3', role: 'EMPLOYEE' as Role, email: 'other@test.com' };

  describe('Manager permissions', () => {
    it('allows managers to view any employee sensitive data', () => {
      expect(Permissions.user.viewSensitive(manager, employee)).toBe(true);
      expect(Permissions.user.viewSensitive(manager, anotherEmployee)).toBe(true);
    });

    it('allows managers to view their own sensitive data', () => {
      expect(Permissions.user.viewSensitive(manager, manager)).toBe(true);
    });

    it('allows managers to view other managers sensitive data', () => {
      const anotherManager: SessionUser = { id: '4', role: 'MANAGER' as Role, email: 'manager2@test.com' };
      expect(Permissions.user.viewSensitive(manager, anotherManager)).toBe(true);
    });
  });

  describe('Employee permissions', () => {
    it('allows employees to view their own sensitive data', () => {
      expect(Permissions.user.viewSensitive(employee, employee)).toBe(true);
    });

    it('denies employees viewing other employees sensitive data', () => {
      expect(Permissions.user.viewSensitive(employee, anotherEmployee)).toBe(false);
    });

    it('denies employees viewing manager sensitive data', () => {
      expect(Permissions.user.viewSensitive(employee, manager)).toBe(false);
    });
  });
});

describe('Permissions.user.edit', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };
  const anotherEmployee: SessionUser = { id: '3', role: 'EMPLOYEE' as Role, email: 'other@test.com' };

  it('allows managers to edit any user profile', () => {
    expect(Permissions.user.edit(manager, employee)).toBe(true);
    expect(Permissions.user.edit(manager, anotherEmployee)).toBe(true);
  });

  it('allows managers to edit their own profile', () => {
    expect(Permissions.user.edit(manager, manager)).toBe(true);
  });

  it('allows employees to edit their own profile', () => {
    expect(Permissions.user.edit(employee, employee)).toBe(true);
  });

  it('denies employees editing other employees profiles', () => {
    expect(Permissions.user.edit(employee, anotherEmployee)).toBe(false);
  });

  it('denies employees editing manager profiles', () => {
    expect(Permissions.user.edit(employee, manager)).toBe(false);
  });
});

describe('Permissions.user.delete', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };

  it('allows managers to delete employee accounts', () => {
    expect(Permissions.user.delete(manager, employee)).toBe(true);
  });

  it('denies managers deleting their own account (safety check)', () => {
    expect(Permissions.user.delete(manager, manager)).toBe(false);
  });

  it('denies employees deleting any accounts', () => {
    expect(Permissions.user.delete(employee, employee)).toBe(false);
    expect(Permissions.user.delete(employee, manager)).toBe(false);
  });
});

describe('Permissions.user.view', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };

  it('allows all authenticated users to view profiles', () => {
    expect(Permissions.user.view(manager, employee)).toBe(true);
    expect(Permissions.user.view(employee, manager)).toBe(true);
    expect(Permissions.user.view(employee, employee)).toBe(true);
  });
});

describe('Permissions.user.updateSensitive', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };

  it('allows only managers to update sensitive fields', () => {
    expect(Permissions.user.updateSensitive(manager)).toBe(true);
  });

  it('denies employees updating sensitive fields', () => {
    expect(Permissions.user.updateSensitive(employee)).toBe(false);
  });
});

describe('Permissions.feedback.give', () => {
  const user1: SessionUser = { id: '1', role: 'EMPLOYEE' as Role, email: 'user1@test.com' };
  const user2: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'user2@test.com' };

  it('allows giving feedback to other users', () => {
    expect(Permissions.feedback.give(user1, user2)).toBe(true);
  });

  it('denies giving feedback to self', () => {
    expect(Permissions.feedback.give(user1, user1)).toBe(false);
  });
});

describe('Permissions.feedback.view', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const giver: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'giver@test.com' };
  const receiver: SessionUser = { id: '3', role: 'EMPLOYEE' as Role, email: 'receiver@test.com' };
  const other: SessionUser = { id: '4', role: 'EMPLOYEE' as Role, email: 'other@test.com' };

  const feedback = { giverId: giver.id, receiverId: receiver.id };

  it('allows managers to view all feedback', () => {
    expect(Permissions.feedback.view(manager, feedback)).toBe(true);
  });

  it('allows feedback givers to view their feedback', () => {
    expect(Permissions.feedback.view(giver, feedback)).toBe(true);
  });

  it('allows feedback receivers to view feedback they received', () => {
    expect(Permissions.feedback.view(receiver, feedback)).toBe(true);
  });

  it('denies unrelated users viewing feedback', () => {
    expect(Permissions.feedback.view(other, feedback)).toBe(false);
  });
});

describe('Permissions.feedback.edit', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const giver: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'giver@test.com' };
  const other: SessionUser = { id: '3', role: 'EMPLOYEE' as Role, email: 'other@test.com' };

  const feedback = { giverId: giver.id };

  it('allows managers to edit any feedback', () => {
    expect(Permissions.feedback.edit(manager, feedback)).toBe(true);
  });

  it('allows feedback givers to edit their own feedback', () => {
    expect(Permissions.feedback.edit(giver, feedback)).toBe(true);
  });

  it('denies other users editing feedback', () => {
    expect(Permissions.feedback.edit(other, feedback)).toBe(false);
  });
});

describe('Permissions.absence.create', () => {
  const employee: SessionUser = { id: '1', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };
  const manager: SessionUser = { id: '2', role: 'MANAGER' as Role, email: 'manager@test.com' };

  it('allows all authenticated users to create absence requests', () => {
    expect(Permissions.absence.create(employee)).toBe(true);
    expect(Permissions.absence.create(manager)).toBe(true);
  });
});

describe('Permissions.absence.view', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };
  const other: SessionUser = { id: '3', role: 'EMPLOYEE' as Role, email: 'other@test.com' };

  const absence = { userId: employee.id };

  it('allows managers to view all absence requests', () => {
    expect(Permissions.absence.view(manager, absence)).toBe(true);
  });

  it('allows users to view their own absence requests', () => {
    expect(Permissions.absence.view(employee, absence)).toBe(true);
  });

  it('denies users viewing other users absence requests', () => {
    expect(Permissions.absence.view(other, absence)).toBe(false);
  });
});

describe('Permissions.absence.approve', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };

  it('allows only managers to approve/reject absence requests', () => {
    expect(Permissions.absence.approve(manager)).toBe(true);
  });

  it('denies employees approving/rejecting absence requests', () => {
    expect(Permissions.absence.approve(employee)).toBe(false);
  });
});

describe('Permissions.absence.edit', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };
  const other: SessionUser = { id: '3', role: 'EMPLOYEE' as Role, email: 'other@test.com' };

  it('allows managers to edit pending requests', () => {
    const pendingAbsence = { userId: employee.id, status: 'PENDING' as const };
    expect(Permissions.absence.edit(manager, pendingAbsence)).toBe(true);
  });

  it('denies managers editing approved requests', () => {
    const approvedAbsence = { userId: employee.id, status: 'APPROVED' as const };
    expect(Permissions.absence.edit(manager, approvedAbsence)).toBe(false);
  });

  it('allows employees to edit their own pending requests', () => {
    const pendingAbsence = { userId: employee.id, status: 'PENDING' as const };
    expect(Permissions.absence.edit(employee, pendingAbsence)).toBe(true);
  });

  it('denies employees editing their approved requests', () => {
    const approvedAbsence = { userId: employee.id, status: 'APPROVED' as const };
    expect(Permissions.absence.edit(employee, approvedAbsence)).toBe(false);
  });

  it('denies employees editing other users requests', () => {
    const otherPendingAbsence = { userId: other.id, status: 'PENDING' as const };
    expect(Permissions.absence.edit(employee, otherPendingAbsence)).toBe(false);
  });
});

describe('Permissions.absence.delete', () => {
  const manager: SessionUser = { id: '1', role: 'MANAGER' as Role, email: 'manager@test.com' };
  const employee: SessionUser = { id: '2', role: 'EMPLOYEE' as Role, email: 'employee@test.com' };
  const other: SessionUser = { id: '3', role: 'EMPLOYEE' as Role, email: 'other@test.com' };

  it('allows managers to delete pending requests', () => {
    const pendingAbsence = { userId: employee.id, status: 'PENDING' as const };
    expect(Permissions.absence.delete(manager, pendingAbsence)).toBe(true);
  });

  it('denies managers deleting approved requests', () => {
    const approvedAbsence = { userId: employee.id, status: 'APPROVED' as const };
    expect(Permissions.absence.delete(manager, approvedAbsence)).toBe(false);
  });

  it('allows employees to delete their own pending requests', () => {
    const pendingAbsence = { userId: employee.id, status: 'PENDING' as const };
    expect(Permissions.absence.delete(employee, pendingAbsence)).toBe(true);
  });

  it('denies employees deleting their approved requests', () => {
    const approvedAbsence = { userId: employee.id, status: 'APPROVED' as const };
    expect(Permissions.absence.delete(employee, approvedAbsence)).toBe(false);
  });

  it('denies employees deleting other users requests', () => {
    const otherPendingAbsence = { userId: other.id, status: 'PENDING' as const };
    expect(Permissions.absence.delete(employee, otherPendingAbsence)).toBe(false);
  });
});

describe('assertPermission', () => {
  it('does not throw when permission is granted', () => {
    expect(() => assertPermission(true)).not.toThrow();
  });

  it('throws error when permission is denied', () => {
    expect(() => assertPermission(false)).toThrow('You do not have permission to perform this action');
  });

  it('throws custom error message when provided', () => {
    expect(() => assertPermission(false, 'Custom error message')).toThrow('Custom error message');
  });
});

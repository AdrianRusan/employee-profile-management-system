import { describe, it, expect } from 'vitest';
import { Feedback } from '@/src/domain/entities/Feedback';

describe('Feedback Entity', () => {
  const validContent = 'This is valid feedback content that is at least 10 characters.';

  describe('create', () => {
    it('should create feedback with valid properties', () => {
      const feedback = Feedback.create('giver-id', 'receiver-id', validContent);

      expect(feedback.giverId).toBe('giver-id');
      expect(feedback.receiverId).toBe('receiver-id');
      expect(feedback.content).toBe(validContent);
      expect(feedback.isPolished).toBe(false);
      expect(feedback.polishedContent).toBeUndefined();
      expect(feedback.createdAt).toBeInstanceOf(Date);
      expect(feedback.id).toBeDefined();
    });

    it('should use provided id if given', () => {
      const feedback = Feedback.create('giver-id', 'receiver-id', validContent, 'custom-id');
      expect(feedback.id).toBe('custom-id');
    });

    it('should throw when giving feedback to yourself', () => {
      expect(() => Feedback.create('same-user', 'same-user', validContent)).toThrow(
        'Cannot give feedback to yourself'
      );
    });

    it('should throw for content less than 10 characters', () => {
      expect(() => Feedback.create('giver', 'receiver', 'short')).toThrow(
        'Feedback content must be at least 10 characters'
      );
    });

    it('should throw for empty content', () => {
      expect(() => Feedback.create('giver', 'receiver', '')).toThrow(
        'Feedback content must be at least 10 characters'
      );
    });

    it('should throw for content exceeding 5000 characters', () => {
      const longContent = 'a'.repeat(5001);
      expect(() => Feedback.create('giver', 'receiver', longContent)).toThrow(
        'Feedback content cannot exceed 5000 characters'
      );
    });

    it('should accept content at boundary (10 chars)', () => {
      const feedback = Feedback.create('giver', 'receiver', '1234567890');
      expect(feedback.content).toBe('1234567890');
    });

    it('should accept content at boundary (5000 chars)', () => {
      const content = 'a'.repeat(5000);
      const feedback = Feedback.create('giver', 'receiver', content);
      expect(feedback.content.length).toBe(5000);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute feedback from persistence', () => {
      const now = new Date();
      const feedback = Feedback.reconstitute({
        id: 'persisted-id',
        giverId: 'giver',
        receiverId: 'receiver',
        content: validContent,
        polishedContent: 'Polished version',
        isPolished: true,
        createdAt: now,
        updatedAt: now,
      });

      expect(feedback.id).toBe('persisted-id');
      expect(feedback.isPolished).toBe(true);
      expect(feedback.polishedContent).toBe('Polished version');
    });
  });

  describe('polishContent', () => {
    it('should polish feedback content', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);

      feedback.polishContent('This is the polished version of the feedback.');

      expect(feedback.isPolished).toBe(true);
      expect(feedback.polishedContent).toBe('This is the polished version of the feedback.');
    });

    it('should throw for empty polished content', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);

      expect(() => feedback.polishContent('')).toThrow('Polished content cannot be empty');
    });

    it('should throw for whitespace-only polished content', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);

      expect(() => feedback.polishContent('   ')).toThrow('Polished content cannot be empty');
    });

    it('should throw when polishing deleted feedback', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);
      feedback.softDelete();

      expect(() => feedback.polishContent('polished')).toThrow('Cannot polish deleted feedback');
    });
  });

  describe('resetPolish', () => {
    it('should reset polished content', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);
      feedback.polishContent('Polished content');
      expect(feedback.isPolished).toBe(true);

      feedback.resetPolish();

      expect(feedback.isPolished).toBe(false);
      expect(feedback.polishedContent).toBeUndefined();
    });
  });

  describe('updateContent', () => {
    it('should update feedback content', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);
      const newContent = 'This is updated feedback content.';

      feedback.updateContent(newContent);

      expect(feedback.content).toBe(newContent);
    });

    it('should reset polish when content is updated', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);
      feedback.polishContent('Polished version');
      expect(feedback.isPolished).toBe(true);

      feedback.updateContent('Updated content is here.');

      expect(feedback.isPolished).toBe(false);
      expect(feedback.polishedContent).toBeUndefined();
    });

    it('should throw when updating deleted feedback', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);
      feedback.softDelete();

      expect(() => feedback.updateContent('new content')).toThrow('Cannot update deleted feedback');
    });

    it('should throw for content too short', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);

      expect(() => feedback.updateContent('short')).toThrow(
        'Feedback content must be at least 10 characters'
      );
    });

    it('should throw for content too long', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);

      expect(() => feedback.updateContent('a'.repeat(5001))).toThrow(
        'Feedback content cannot exceed 5000 characters'
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete feedback', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);
      expect(feedback.isDeleted()).toBe(false);

      feedback.softDelete();

      expect(feedback.isDeleted()).toBe(true);
      expect(feedback.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw when deleting already deleted feedback', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);
      feedback.softDelete();

      expect(() => feedback.softDelete()).toThrow('Feedback is already deleted');
    });
  });

  describe('getDisplayContent', () => {
    it('should return original content when not polished', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);

      expect(feedback.getDisplayContent()).toBe(validContent);
    });

    it('should return polished content when available', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent);
      feedback.polishContent('Polished version');

      expect(feedback.getDisplayContent()).toBe('Polished version');
    });
  });

  describe('isFromUser / isForUser', () => {
    it('should correctly identify feedback giver', () => {
      const feedback = Feedback.create('giver-id', 'receiver-id', validContent);

      expect(feedback.isFromUser('giver-id')).toBe(true);
      expect(feedback.isFromUser('receiver-id')).toBe(false);
      expect(feedback.isFromUser('other-id')).toBe(false);
    });

    it('should correctly identify feedback receiver', () => {
      const feedback = Feedback.create('giver-id', 'receiver-id', validContent);

      expect(feedback.isForUser('receiver-id')).toBe(true);
      expect(feedback.isForUser('giver-id')).toBe(false);
      expect(feedback.isForUser('other-id')).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should return all properties', () => {
      const feedback = Feedback.create('giver', 'receiver', validContent, 'test-id');

      const obj = feedback.toObject();

      expect(obj.id).toBe('test-id');
      expect(obj.giverId).toBe('giver');
      expect(obj.receiverId).toBe('receiver');
      expect(obj.content).toBe(validContent);
      expect(obj.isPolished).toBe(false);
      expect(obj.createdAt).toBeInstanceOf(Date);
    });
  });
});

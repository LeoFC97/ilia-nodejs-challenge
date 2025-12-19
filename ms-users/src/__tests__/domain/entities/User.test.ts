import { User } from '../../../domain/entities/User';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.password).toBe('password123');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should auto-generate id when not provided', () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password456'
      };

      const user = User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('jane@example.com');
    });
  });

  describe('restore', () => {
    it('should restore a user with complete data', () => {
      const userData = {
        id: 'test-uuid',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      const user = User.restore(userData);

      expect(user.id).toBe('test-uuid');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.createdAt).toEqual(new Date('2023-01-01'));
      expect(user.updatedAt).toEqual(new Date('2023-01-02'));
    });

    it('should throw error when restoring without id', () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password456'
      };

      expect(() => User.restore(userData as any))
        .toThrow('ID and createdAt are required for restoring a user');
    });

    it('should throw error when restoring without createdAt', () => {
      const userData = {
        id: 'test-uuid',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password456'
      };

      expect(() => User.restore(userData as any))
        .toThrow('ID and createdAt are required for restoring a user');
    });
  });

  describe('validation', () => {
    it('should throw error for missing first name', () => {
      const userData = {
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      expect(() => User.create(userData))
        .toThrow('First name is required');
    });

    it('should throw error for missing last name', () => {
      const userData = {
        firstName: 'John',
        lastName: '',
        email: 'john@example.com',
        password: 'password123'
      };

      expect(() => User.create(userData))
        .toThrow('Last name is required');
    });

    it('should throw error for missing email', () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        password: 'password123'
      };

      expect(() => User.create(userData))
        .toThrow('Email is required');
    });

    it('should throw error for invalid email format', () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      expect(() => User.create(userData))
        .toThrow('Invalid email format');
    });

    it('should throw error for missing password', () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: ''
      };

      expect(() => User.create(userData))
        .toThrow('Password is required');
    });

    it('should throw error for short password', () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '12345'
      };

      expect(() => User.create(userData))
        .toThrow('Password must be at least 6 characters long');
    });
  });

  describe('password update', () => {
    it('should update password successfully', () => {
      const user = User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'oldpassword123'
      });

      const newPassword = 'newpassword456';
      user.updatePassword(newPassword);
      expect(user.password).toBe(newPassword);
    });

    it('should throw error for empty new password', () => {
      const user = User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'oldpassword123'
      });

      expect(() => user.updatePassword(''))
        .toThrow('Password must be at least 6 characters long');
    });

    it('should throw error for short new password', () => {
      const user = User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'oldpassword123'
      });

      expect(() => user.updatePassword('12345'))
        .toThrow('Password must be at least 6 characters long');
    });
  });

  describe('getters', () => {
    it('should provide access to all properties', () => {
      const userData = {
        id: 'test-uuid',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      };

      const user = User.restore(userData);

      expect(user.id).toBe('test-uuid');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.password).toBe('password123');
      expect(user.createdAt).toEqual(new Date('2023-01-01'));
      expect(user.updatedAt).toEqual(new Date('2023-01-02'));
    });
  });
});
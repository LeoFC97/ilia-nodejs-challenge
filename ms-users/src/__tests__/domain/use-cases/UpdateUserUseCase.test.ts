import { UpdateUserUseCase } from '../../../domain/use-cases/UpdateUserUseCase';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { User } from '../../../domain/entities/User';

describe('UpdateUserUseCase', () => {
  let updateUserUseCase: UpdateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Mock do repositório
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    updateUserUseCase = new UpdateUserUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update user firstName successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const originalUser = User.restore({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      });

      const updatedUser = User.restore({
        id: userId,
        firstName: 'Jonathan',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(originalUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await updateUserUseCase.execute({
        id: userId,
        firstName: 'Jonathan'
      });

      // Assert
      expect(result.firstName).toBe('Jonathan');
      expect(result.lastName).toBe('Doe'); // Should remain unchanged
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(originalUser);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should update user lastName successfully', async () => {
      // Arrange
      const userId = 'user-456';
      const originalUser = User.restore({
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T11:00:00Z'),
        updatedAt: new Date('2024-01-15T11:00:00Z')
      });

      const updatedUser = User.restore({
        id: userId,
        firstName: 'Jane',
        lastName: 'Johnson',
        email: 'jane.smith@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T11:00:00Z'),
        updatedAt: new Date('2024-01-16T11:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(originalUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await updateUserUseCase.execute({
        id: userId,
        lastName: 'Johnson'
      });

      // Assert
      expect(result.firstName).toBe('Jane'); // Should remain unchanged
      expect(result.lastName).toBe('Johnson');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(originalUser);
    });

    it('should update both firstName and lastName', async () => {
      // Arrange
      const userId = 'user-789';
      const originalUser = User.restore({
        id: userId,
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z')
      });

      const updatedUser = User.restore({
        id: userId,
        firstName: 'Robert',
        lastName: 'Williams',
        email: 'bob.wilson@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-16T12:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(originalUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await updateUserUseCase.execute({
        id: userId,
        firstName: 'Robert',
        lastName: 'Williams'
      });

      // Assert
      expect(result.firstName).toBe('Robert');
      expect(result.lastName).toBe('Williams');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(originalUser);
    });

    it('should not change user when no updates provided', async () => {
      // Arrange
      const userId = 'user-no-change';
      const originalUser = User.restore({
        id: userId,
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T13:00:00Z'),
        updatedAt: new Date('2024-01-15T13:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(originalUser);
      mockUserRepository.update.mockResolvedValue(originalUser);

      // Act
      const result = await updateUserUseCase.execute({
        id: userId
        // No firstName or lastName provided
      });

      // Assert
      expect(result.firstName).toBe('Alice');
      expect(result.lastName).toBe('Brown');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(originalUser);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(updateUserUseCase.execute({
        id: userId,
        firstName: 'New Name'
      })).rejects.toThrow('User not found');

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should handle empty string values', async () => {
      // Arrange
      const userId = 'user-empty-strings';
      const originalUser = User.restore({
        id: userId,
        firstName: 'Original',
        lastName: 'User',
        email: 'original@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T14:00:00Z'),
        updatedAt: new Date('2024-01-15T14:00:00Z')
      });

      const updatedUser = User.restore({
        id: userId,
        firstName: 'Original', // Should remain unchanged due to empty string
        lastName: 'User', // Should remain unchanged due to empty string
        email: 'original@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T14:00:00Z'),
        updatedAt: new Date('2024-01-16T14:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(originalUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await updateUserUseCase.execute({
        id: userId,
        firstName: '',
        lastName: ''
      });

      // Assert
      expect(result.firstName).toBe('Original');
      expect(result.lastName).toBe('User');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(originalUser);
    });

    it('should handle undefined values correctly', async () => {
      // Arrange
      const userId = 'user-undefined';
      const originalUser = User.restore({
        id: userId,
        firstName: 'Undefined',
        lastName: 'Test',
        email: 'undefined@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T15:00:00Z'),
        updatedAt: new Date('2024-01-15T15:00:00Z')
      });

      const updatedUser = User.restore({
        id: userId,
        firstName: 'Updated',
        lastName: 'Test',
        email: 'undefined@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T15:00:00Z'),
        updatedAt: new Date('2024-01-16T15:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(originalUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await updateUserUseCase.execute({
        id: userId,
        firstName: 'Updated',
        lastName: undefined
      });

      // Assert
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Test'); // Should remain unchanged
      expect(mockUserRepository.update).toHaveBeenCalledWith(originalUser);
    });

    it('should preserve immutable properties', async () => {
      // Arrange
      const userId = 'user-preserve';
      const createdAt = new Date('2024-01-15T16:00:00Z');
      const originalUpdatedAt = new Date('2024-01-15T16:00:00Z');
      
      const originalUser = User.restore({
        id: userId,
        firstName: 'Preserve',
        lastName: 'Props',
        email: 'preserve@example.com',
        password: 'hashedpassword',
        createdAt,
        updatedAt: originalUpdatedAt
      });

      const updatedUser = User.restore({
        id: userId,
        firstName: 'Updated',
        lastName: 'Props',
        email: 'preserve@example.com',
        password: 'hashedpassword',
        createdAt, // Should be preserved
        updatedAt: new Date('2024-01-16T16:00:00Z') // Should be updated
      });

      mockUserRepository.findById.mockResolvedValue(originalUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await updateUserUseCase.execute({
        id: userId,
        firstName: 'Updated'
      });

      // Assert
      expect(result.id).toBe(userId);
      expect(result.email).toBe('preserve@example.com');
      expect(result.password).toBe('hashedpassword');
      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).not.toEqual(originalUpdatedAt);
    });

    it('should throw error when repository update fails', async () => {
      // Arrange
      const userId = 'user-update-fail';
      const originalUser = User.restore({
        id: userId,
        firstName: 'Update',
        lastName: 'Fail',
        email: 'updatefail@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T17:00:00Z'),
        updatedAt: new Date('2024-01-15T17:00:00Z')
      });

      const repositoryError = new Error('Database update failed');
      mockUserRepository.findById.mockResolvedValue(originalUser);
      mockUserRepository.update.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(updateUserUseCase.execute({
        id: userId,
        firstName: 'New Name'
      })).rejects.toThrow('Database update failed');

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).toHaveBeenCalledWith(originalUser);
    });

    it('should throw error when repository findById fails', async () => {
      // Arrange
      const userId = 'user-find-fail';
      const repositoryError = new Error('Database query failed');
      mockUserRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(updateUserUseCase.execute({
        id: userId,
        firstName: 'New Name'
      })).rejects.toThrow('Database query failed');

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
});
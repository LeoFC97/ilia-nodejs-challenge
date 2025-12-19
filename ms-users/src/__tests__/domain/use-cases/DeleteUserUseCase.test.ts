import { DeleteUserUseCase } from '../../../domain/use-cases/DeleteUserUseCase';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { User } from '../../../domain/entities/User';

describe('DeleteUserUseCase', () => {
  let deleteUserUseCase: DeleteUserUseCase;
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

    deleteUserUseCase = new DeleteUserUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete user successfully when user exists and deletion succeeds', async () => {
      // Arrange
      const userId = 'user-123';
      const user = User.restore({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue(true);

      // Act
      await deleteUserUseCase.execute({ id: userId });

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(deleteUserUseCase.execute({ id: userId })).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when deletion fails even though user exists', async () => {
      // Arrange
      const userId = 'user-delete-fail';
      const user = User.restore({
        id: userId,
        firstName: 'Delete',
        lastName: 'Fail',
        email: 'deletefail@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T11:00:00Z'),
        updatedAt: new Date('2024-01-15T11:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue(false); // Deletion failed

      // Act & Assert
      await expect(deleteUserUseCase.execute({ id: userId })).rejects.toThrow(
        'Failed to delete user'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should handle empty string ID', async () => {
      // Arrange
      const userId = '';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(deleteUserUseCase.execute({ id: userId })).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith('');
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should handle UUID format ID correctly', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = User.restore({
        id: userId,
        firstName: 'UUID',
        lastName: 'User',
        email: 'uuid@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue(true);

      // Act
      await deleteUserUseCase.execute({ id: userId });

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should pass correct ID to both repository methods', async () => {
      // Arrange
      const userId = 'specific-user-id-test';
      const user = User.restore({
        id: userId,
        firstName: 'Specific',
        lastName: 'Test',
        email: 'specific@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T13:00:00Z'),
        updatedAt: new Date('2024-01-15T13:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue(true);

      // Act
      await deleteUserUseCase.execute({ id: userId });

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('specific-user-id-test');
      expect(mockUserRepository.delete).toHaveBeenCalledWith('specific-user-id-test');
    });

    it('should throw error when findById repository call fails', async () => {
      // Arrange
      const userId = 'user-find-error';
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(deleteUserUseCase.execute({ id: userId })).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when delete repository call fails', async () => {
      // Arrange
      const userId = 'user-delete-error';
      const user = User.restore({
        id: userId,
        firstName: 'Delete',
        lastName: 'Error',
        email: 'deleteerror@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T14:00:00Z'),
        updatedAt: new Date('2024-01-15T14:00:00Z')
      });

      const repositoryError = new Error('Database delete operation failed');
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(deleteUserUseCase.execute({ id: userId })).rejects.toThrow(
        'Database delete operation failed'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should handle user with special characters in ID', async () => {
      // Arrange
      const userId = 'user-with-special@chars#123';
      const user = User.restore({
        id: userId,
        firstName: 'Special',
        lastName: 'Chars',
        email: 'special@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T15:00:00Z'),
        updatedAt: new Date('2024-01-15T15:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue(true);

      // Act
      await deleteUserUseCase.execute({ id: userId });

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should not call delete if user not found even with valid ID format', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(deleteUserUseCase.execute({ id: userId })).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should handle concurrent deletion attempts for same user', async () => {
      // Arrange
      const userId = 'concurrent-delete-user';
      const user = User.restore({
        id: userId,
        firstName: 'Concurrent',
        lastName: 'Delete',
        email: 'concurrent@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T16:00:00Z'),
        updatedAt: new Date('2024-01-15T16:00:00Z')
      });

      // First call succeeds, second call user not found
      mockUserRepository.findById
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);
      mockUserRepository.delete.mockResolvedValue(true);

      // Act
      const promise1 = deleteUserUseCase.execute({ id: userId });
      const promise2 = deleteUserUseCase.execute({ id: userId });

      // Assert
      await expect(promise1).resolves.toBeUndefined();
      await expect(promise2).rejects.toThrow('User not found');

      expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
    });
  });
});
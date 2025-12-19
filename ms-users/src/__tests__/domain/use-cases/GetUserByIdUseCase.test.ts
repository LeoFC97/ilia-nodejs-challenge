import { GetUserByIdUseCase } from '../../../domain/use-cases/GetUserByIdUseCase';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { User } from '../../../domain/entities/User';

describe('GetUserByIdUseCase', () => {
  let getUserByIdUseCase: GetUserByIdUseCase;
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

    getUserByIdUseCase = new GetUserByIdUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user when found by ID', async () => {
      // Arrange
      const userId = 'user-123';
      const user = User.restore({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword123',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await getUserByIdUseCase.execute({ id: userId });

      // Assert
      expect(result).toBe(user);
      expect(result.id).toBe(userId);
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      const userId = 'non-existent-user';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(getUserByIdUseCase.execute({ id: userId })).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should pass correct ID parameter to repository', async () => {
      // Arrange
      const userId = 'specific-user-id-123';
      const user = User.restore({
        id: userId,
        firstName: 'Specific',
        lastName: 'User',
        email: 'specific@example.com',
        password: 'hashedpass',
        createdAt: new Date('2024-01-15T12:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      await getUserByIdUseCase.execute({ id: userId });

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('specific-user-id-123');
    });

    it('should handle empty string ID', async () => {
      // Arrange
      const userId = '';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(getUserByIdUseCase.execute({ id: userId })).rejects.toThrow(
        'User not found'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith('');
    });

    it('should handle UUID format ID', async () => {
      // Arrange
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = User.restore({
        id: userId,
        firstName: 'UUID',
        lastName: 'User',
        email: 'uuid@example.com',
        password: 'hashedpass',
        createdAt: new Date('2024-01-15T14:00:00Z'),
        updatedAt: new Date('2024-01-15T14:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await getUserByIdUseCase.execute({ id: userId });

      // Assert
      expect(result.id).toBe(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should preserve all user properties', async () => {
      // Arrange
      const userId = 'preserve-props-user';
      const createdAt = new Date('2024-01-15T12:30:45.123Z');
      const updatedAt = new Date('2024-01-16T08:15:30.456Z');
      
      const user = User.restore({
        id: userId,
        firstName: 'Preserve',
        lastName: 'Properties',
        email: 'preserve.properties@example.com',
        password: 'complexhashedpassword123',
        createdAt,
        updatedAt
      });

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await getUserByIdUseCase.execute({ id: userId });

      // Assert
      expect(result.id).toBe(userId);
      expect(result.firstName).toBe('Preserve');
      expect(result.lastName).toBe('Properties');
      expect(result.email).toBe('preserve.properties@example.com');
      expect(result.password).toBe('complexhashedpassword123');
      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).toEqual(updatedAt);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const userId = 'error-user';
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(getUserByIdUseCase.execute({ id: userId })).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in ID', async () => {
      // Arrange
      const userId = 'user-with-special@chars#123';
      const user = User.restore({
        id: userId,
        firstName: 'Special',
        lastName: 'Chars',
        email: 'special@example.com',
        password: 'hashedpass',
        createdAt: new Date('2024-01-15T16:00:00Z'),
        updatedAt: new Date('2024-01-15T16:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await getUserByIdUseCase.execute({ id: userId });

      // Assert
      expect(result.id).toBe(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle concurrent requests for same user ID', async () => {
      // Arrange
      const userId = 'concurrent-user';
      const user = User.restore({
        id: userId,
        firstName: 'Concurrent',
        lastName: 'Test',
        email: 'concurrent@example.com',
        password: 'hashedpass',
        createdAt: new Date('2024-01-15T18:00:00Z'),
        updatedAt: new Date('2024-01-15T18:00:00Z')
      });

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const promise1 = getUserByIdUseCase.execute({ id: userId });
      const promise2 = getUserByIdUseCase.execute({ id: userId });
      
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Assert
      expect(result1).toEqual(result2);
      expect(result1.id).toBe(userId);
      expect(result2.id).toBe(userId);
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent requests for different user IDs', async () => {
      // Arrange
      const userId1 = 'user-001';
      const userId2 = 'user-002';
      
      const user1 = User.restore({
        id: userId1,
        firstName: 'User1',
        lastName: 'Test',
        email: 'user1@example.com',
        password: 'hashedpass1',
        createdAt: new Date('2024-01-15T19:00:00Z'),
        updatedAt: new Date('2024-01-15T19:00:00Z')
      });
      
      const user2 = User.restore({
        id: userId2,
        firstName: 'User2',
        lastName: 'Test',
        email: 'user2@example.com',
        password: 'hashedpass2',
        createdAt: new Date('2024-01-15T20:00:00Z'),
        updatedAt: new Date('2024-01-15T20:00:00Z')
      });

      mockUserRepository.findById
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      // Act
      const promise1 = getUserByIdUseCase.execute({ id: userId1 });
      const promise2 = getUserByIdUseCase.execute({ id: userId2 });
      
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Assert
      expect(result1.id).toBe(userId1);
      expect(result1.firstName).toBe('User1');
      expect(result2.id).toBe(userId2);
      expect(result2.firstName).toBe('User2');
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
    });
  });
});
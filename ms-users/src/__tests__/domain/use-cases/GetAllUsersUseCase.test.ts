import { GetAllUsersUseCase } from '../../../domain/use-cases/GetAllUsersUseCase';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { User } from '../../../domain/entities/User';

describe('GetAllUsersUseCase', () => {
  let getAllUsersUseCase: GetAllUsersUseCase;
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

    getAllUsersUseCase = new GetAllUsersUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all users from repository', async () => {
      // Arrange
      const users = [
        User.restore({
          id: 'user-001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'hashedpass123',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        }),
        User.restore({
          id: 'user-002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'hashedpass456',
          createdAt: new Date('2024-01-15T11:00:00Z'),
          updatedAt: new Date('2024-01-15T11:00:00Z')
        })
      ];

      mockUserRepository.findAll.mockResolvedValue(users);

      // Act
      const result = await getAllUsersUseCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('user-001');
      expect(result[0].firstName).toBe('John');
      expect(result[0].lastName).toBe('Doe');
      expect(result[1].id).toBe('user-002');
      expect(result[1].firstName).toBe('Jane');
      expect(result[1].lastName).toBe('Smith');
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockUserRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await getAllUsersUseCase.execute();

      // Assert
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return users in order returned by repository', async () => {
      // Arrange
      const users = [
        User.restore({
          id: 'user-003',
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob.wilson@example.com',
          password: 'hashedpass789',
          createdAt: new Date('2024-01-15T15:00:00Z'),
          updatedAt: new Date('2024-01-15T15:00:00Z')
        }),
        User.restore({
          id: 'user-001',
          firstName: 'Alice',
          lastName: 'Brown',
          email: 'alice.brown@example.com',
          password: 'hashedpass111',
          createdAt: new Date('2024-01-15T09:00:00Z'),
          updatedAt: new Date('2024-01-15T09:00:00Z')
        })
      ];

      mockUserRepository.findAll.mockResolvedValue(users);

      // Act
      const result = await getAllUsersUseCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      // Order should be maintained as returned by repository
      expect(result[0].id).toBe('user-003');
      expect(result[0].firstName).toBe('Bob');
      expect(result[1].id).toBe('user-001');
      expect(result[1].firstName).toBe('Alice');
    });

    it('should handle large numbers of users', async () => {
      // Arrange
      const users = Array.from({ length: 100 }, (_, index) => 
        User.restore({
          id: `user-${String(index + 1).padStart(3, '0')}`,
          firstName: `User${index + 1}`,
          lastName: 'Test',
          email: `user${index + 1}@example.com`,
          password: `hashedpass${index + 1}`,
          createdAt: new Date(`2024-01-15T${String(index % 24).padStart(2, '0')}:00:00Z`),
          updatedAt: new Date(`2024-01-15T${String(index % 24).padStart(2, '0')}:00:00Z`)
        })
      );

      mockUserRepository.findAll.mockResolvedValue(users);

      // Act
      const result = await getAllUsersUseCase.execute();

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0].firstName).toBe('User1');
      expect(result[99].firstName).toBe('User100');
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.findAll.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(getAllUsersUseCase.execute()).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle repository returning null gracefully', async () => {
      // Arrange
      // Simulate repository returning null (edge case)
      mockUserRepository.findAll.mockResolvedValue(null as any);

      // Act & Assert
      const result = await getAllUsersUseCase.execute();
      
      // Should receive null as returned by repository
      expect(result).toBeNull();
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should preserve all user properties', async () => {
      // Arrange
      const user = User.restore({
        id: 'user-preserve',
        firstName: 'Preserve',
        lastName: 'Properties',
        email: 'preserve@example.com',
        password: 'hashedpassword',
        createdAt: new Date('2024-01-15T12:30:45Z'),
        updatedAt: new Date('2024-01-16T08:15:30Z')
      });

      mockUserRepository.findAll.mockResolvedValue([user]);

      // Act
      const result = await getAllUsersUseCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-preserve');
      expect(result[0].firstName).toBe('Preserve');
      expect(result[0].lastName).toBe('Properties');
      expect(result[0].email).toBe('preserve@example.com');
      expect(result[0].password).toBe('hashedpassword');
      expect(result[0].createdAt).toEqual(new Date('2024-01-15T12:30:45Z'));
      expect(result[0].updatedAt).toEqual(new Date('2024-01-16T08:15:30Z'));
    });

    it('should handle concurrent calls correctly', async () => {
      // Arrange
      const users = [
        User.restore({
          id: 'concurrent-user',
          firstName: 'Concurrent',
          lastName: 'Test',
          email: 'concurrent@example.com',
          password: 'hashedpass',
          createdAt: new Date('2024-01-15T12:00:00Z'),
          updatedAt: new Date('2024-01-15T12:00:00Z')
        })
      ];

      mockUserRepository.findAll.mockResolvedValue(users);

      // Act
      const promise1 = getAllUsersUseCase.execute();
      const promise2 = getAllUsersUseCase.execute();
      
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Assert
      expect(result1).toEqual(result2);
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(2);
    });
  });
});
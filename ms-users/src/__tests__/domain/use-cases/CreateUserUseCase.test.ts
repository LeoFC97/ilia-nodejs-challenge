import { CreateUserUseCase } from '../../../domain/use-cases/CreateUserUseCase';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { User } from '../../../domain/entities/User';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock UserRepository
const mockUserRepository: jest.Mocked<UserRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    createUserUseCase = new CreateUserUseCase(mockUserRepository);
    
    // Setup default bcrypt mock
    mockedBcrypt.hash.mockResolvedValue('hashedpassword123' as never);
  });

  describe('execute', () => {
    const validUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    it('should create a user successfully', async () => {
      // Arrange
      const expectedUser = User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashedpassword123'
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(expectedUser);

      // Act
      const result = await createUserUseCase.execute(validUserData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.any(User)
      );
      expect(result).toBe(expectedUser);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const existingUser = User.create({
        firstName: 'Existing',
        lastName: 'User',
        email: 'john@example.com',
        password: 'hashedpassword'
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(createUserUseCase.execute(validUserData))
        .rejects
        .toThrow('User with this email already exists');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const invalidEmailData = {
        ...validUserData,
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(createUserUseCase.execute(invalidEmailData))
        .rejects
        .toThrow('Invalid email format');

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for missing first name', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const invalidNameData = {
        ...validUserData,
        firstName: ''
      };

      // Act & Assert
      await expect(createUserUseCase.execute(invalidNameData))
        .rejects
        .toThrow('First name is required');

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should handle validation errors from User entity', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      const invalidData = {
        firstName: '',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // Act & Assert
      await expect(createUserUseCase.execute(invalidData))
        .rejects
        .toThrow('First name is required');

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(createUserUseCase.execute(validUserData))
        .rejects
        .toThrow('Database error');

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should handle bcrypt hash errors', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockRejectedValue(new Error('Bcrypt error') as never);

      // Act & Assert
      await expect(createUserUseCase.execute(validUserData))
        .rejects
        .toThrow('Bcrypt error');

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockedBcrypt.hash).toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
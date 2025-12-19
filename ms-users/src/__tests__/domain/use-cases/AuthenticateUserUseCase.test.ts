import { AuthenticateUserUseCase } from '../../../domain/use-cases/AuthenticateUserUseCase';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { User } from '../../../domain/entities/User';
import bcrypt from 'bcrypt';

// Mock dependencies
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

describe('AuthenticateUserUseCase', () => {
  let authenticateUserUseCase: AuthenticateUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    
    authenticateUserUseCase = new AuthenticateUserUseCase(
      mockUserRepository,
      'test-secret',
      '1h'
    );
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  describe('execute', () => {
    const validCredentials = {
      email: 'john@example.com',
      password: 'password123'
    };

    const mockUser = User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashedpassword123'
    });

    it('should authenticate user successfully', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await authenticateUserUseCase.execute(validCredentials);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword123');
      expect(result.user).toBe(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authenticateUserUseCase.execute(validCredentials))
        .rejects
        .toThrow('Invalid email or password');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is incorrect', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authenticateUserUseCase.execute(validCredentials))
        .rejects
        .toThrow('Invalid email or password');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword123');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(authenticateUserUseCase.execute(validCredentials))
        .rejects
        .toThrow('Database error');

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
    });

    it('should handle bcrypt compare errors', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockRejectedValue(new Error('Bcrypt error') as never);

      // Act & Assert
      await expect(authenticateUserUseCase.execute(validCredentials))
        .rejects
        .toThrow('Bcrypt error');

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockedBcrypt.compare).toHaveBeenCalled();
    });
  });
});
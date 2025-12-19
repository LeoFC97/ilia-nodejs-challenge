import { Request, Response } from 'express';
import { AuthController } from '../../../presentation/controllers/AuthController';
import { AuthenticateUserUseCase } from '../../../domain/use-cases/AuthenticateUserUseCase';
import { User } from '../../../domain/entities/User';

// Mock do Logger
jest.mock('../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      auth: jest.fn(),
      debug: jest.fn()
    })
  }
}));

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthenticateUserUseCase: jest.Mocked<AuthenticateUserUseCase>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Mock do use case
    mockAuthenticateUserUseCase = {
      execute: jest.fn()
    } as any;

    // Mock do Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    authController = new AuthController(mockAuthenticateUserUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          user: {
            email: 'john.doe@example.com',
            password: 'password123'
          }
        },
        correlationId: 'test-correlation-id'
      } as any;
    });

    it('should authenticate user successfully with valid credentials', async () => {
      // Arrange
      const user = User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword123'
      });

      const accessToken = 'jwt.token.here';

      const authResponse = {
        user,
        accessToken
      };

      mockAuthenticateUserUseCase.execute.mockResolvedValue(authResponse);

      // Act
      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthenticateUserUseCase.execute).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'password123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: user.toJSON(),
        access_token: accessToken
      });
    });

    it('should return 400 for missing user object', async () => {
      // Arrange
      mockRequest.body = {
        // user object missing
      };

      // Act
      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthenticateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for missing email', async () => {
      // Arrange
      mockRequest.body = {
        user: {
          password: 'password123'
          // email missing
        }
      };

      // Act
      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthenticateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for missing password', async () => {
      // Arrange
      mockRequest.body = {
        user: {
          email: 'john.doe@example.com'
          // password missing
        }
      };

      // Act
      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthenticateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockAuthenticateUserUseCase.execute.mockRejectedValue(
        new Error('Invalid email or password')
      );

      // Act
      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthenticateUserUseCase.execute).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'password123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      mockAuthenticateUserUseCase.execute.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await authController.authenticate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});
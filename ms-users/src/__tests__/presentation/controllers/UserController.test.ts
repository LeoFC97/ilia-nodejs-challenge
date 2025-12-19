import { Request, Response } from 'express';
import { UserController } from '../../../presentation/controllers/UserController';
import { CreateUserUseCase } from '../../../domain/use-cases/CreateUserUseCase';
import { GetAllUsersUseCase } from '../../../domain/use-cases/GetAllUsersUseCase';
import { GetUserByIdUseCase } from '../../../domain/use-cases/GetUserByIdUseCase';
import { UpdateUserUseCase } from '../../../domain/use-cases/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../../domain/use-cases/DeleteUserUseCase';
import { User } from '../../../domain/entities/User';
import { AuthenticatedRequest } from '../../../infrastructure/middleware/AuthMiddleware';

// Mock do Logger
jest.mock('../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      user: jest.fn(),
      debug: jest.fn()
    })
  }
}));

describe('UserController', () => {
  let userController: UserController;
  let mockCreateUserUseCase: jest.Mocked<CreateUserUseCase>;
  let mockGetAllUsersUseCase: jest.Mocked<GetAllUsersUseCase>;
  let mockGetUserByIdUseCase: jest.Mocked<GetUserByIdUseCase>;
  let mockUpdateUserUseCase: jest.Mocked<UpdateUserUseCase>;
  let mockDeleteUserUseCase: jest.Mocked<DeleteUserUseCase>;
  let mockRequest: Partial<Request>;
  let mockAuthenticatedRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Mock dos use cases
    mockCreateUserUseCase = {
      execute: jest.fn()
    } as any;

    mockGetAllUsersUseCase = {
      execute: jest.fn()
    } as any;

    mockGetUserByIdUseCase = {
      execute: jest.fn()
    } as any;

    mockUpdateUserUseCase = {
      execute: jest.fn()
    } as any;

    mockDeleteUserUseCase = {
      execute: jest.fn()
    } as any;

    // Mock do Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    userController = new UserController(
      mockCreateUserUseCase,
      mockGetAllUsersUseCase,
      mockGetUserByIdUseCase,
      mockUpdateUserUseCase,
      mockDeleteUserUseCase
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123'
        },
        correlationId: 'test-correlation-id'
      } as any;
    });

    it('should create user successfully with valid data', async () => {
      // Arrange
      const user = User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword123'
      });

      mockCreateUserUseCase.execute.mockResolvedValue(user);

      // Act
      await userController.createUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(user.toJSON());
    });

    it('should return 400 for missing first_name', async () => {
      // Arrange
      mockRequest.body = {
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      // Act
      await userController.createUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '"first_name" is required',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should return 400 for invalid email format', async () => {
      // Arrange
      mockRequest.body = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      // Act
      await userController.createUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '"email" must be a valid email',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should return 400 for short password', async () => {
      // Arrange
      mockRequest.body = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: '123'
      };

      // Act
      await userController.createUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '"password" length must be at least 6 characters long',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should return 400 when user already exists', async () => {
      // Arrange
      mockCreateUserUseCase.execute.mockRejectedValue(
        new Error('User with this email already exists')
      );

      // Act
      await userController.createUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User with this email already exists',
        code: 'VALIDATION_ERROR'
      });
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      mockCreateUserUseCase.execute.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await userController.createUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error during user creation',
        code: 'UNEXPECTED_ERROR'
      });
    });
  });

  describe('getAllUsers', () => {
    beforeEach(() => {
      mockAuthenticatedRequest = {
        user: { userId: 'auth-user-123' }
      } as AuthenticatedRequest;
    });

    it('should return all users successfully', async () => {
      // Arrange
      const users = [
        User.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'hashedpass1'
        }),
        User.create({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'hashedpass2'
        })
      ];

      mockGetAllUsersUseCase.execute.mockResolvedValue(users);

      // Act
      await userController.getAllUsers(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockGetAllUsersUseCase.execute).toHaveBeenCalledWith();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([
        users[0].toJSON(),
        users[1].toJSON()
      ]);
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockGetAllUsersUseCase.execute.mockResolvedValue([]);

      // Act
      await userController.getAllUsers(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 when use case fails', async () => {
      // Arrange
      mockGetAllUsersUseCase.execute.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      await userController.getAllUsers(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });

  describe('getUserById', () => {
    beforeEach(() => {
      mockAuthenticatedRequest = {
        params: { id: 'user-123' },
        user: { userId: 'auth-user-123' }
      } as any;
    });

    it('should return user by ID successfully', async () => {
      // Arrange
      const user = User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedpassword'
      });

      mockGetUserByIdUseCase.execute.mockResolvedValue(user);

      // Act
      await userController.getUserById(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith({
        id: 'user-123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(user.toJSON());
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      mockGetUserByIdUseCase.execute.mockRejectedValue(
        new Error('User not found')
      );

      // Act
      await userController.getUserById(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });

    it('should return 500 for other errors', async () => {
      // Arrange
      mockGetUserByIdUseCase.execute.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      await userController.getUserById(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      mockAuthenticatedRequest = {
        params: { id: 'user-123' },
        body: {
          first_name: 'Updated',
          last_name: 'Name'
        },
        user: { userId: 'auth-user-123' }
      } as any;
    });

    it('should update user successfully', async () => {
      // Arrange
      const updatedUser = User.create({
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        password: 'hashedpassword'
      });

      mockUpdateUserUseCase.execute.mockResolvedValue(updatedUser);

      // Act
      await userController.updateUser(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-123',
        firstName: 'Updated',
        lastName: 'Name'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedUser.toJSON());
    });

    it('should return 400 for validation errors', async () => {
      // Arrange
      mockAuthenticatedRequest.body = {
        first_name: '', // Empty first name
        last_name: 'Name'
      };

      // Act
      await userController.updateUser(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockUpdateUserUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      mockUpdateUserUseCase.execute.mockRejectedValue(
        new Error('User not found')
      );

      // Act
      await userController.updateUser(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      mockAuthenticatedRequest = {
        params: { id: 'user-123' },
        user: { userId: 'auth-user-123' }
      } as any;
    });

    it('should delete user successfully', async () => {
      // Arrange
      mockDeleteUserUseCase.execute.mockResolvedValue();

      // Act
      await userController.deleteUser(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockDeleteUserUseCase.execute).toHaveBeenCalledWith({
        id: 'user-123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User deleted successfully'
      });
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      mockDeleteUserUseCase.execute.mockRejectedValue(
        new Error('User not found')
      );

      // Act
      await userController.deleteUser(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });

    it('should return 500 for other errors', async () => {
      // Arrange
      mockDeleteUserUseCase.execute.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      await userController.deleteUser(
        mockAuthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });
  });
});
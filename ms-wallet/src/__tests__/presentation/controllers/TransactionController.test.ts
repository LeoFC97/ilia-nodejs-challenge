import { Response } from 'express';
import { TransactionController } from '../../../presentation/controllers/TransactionController';
import { CreateTransactionUseCase } from '../../../domain/use-cases/CreateTransactionUseCase';
import { GetTransactionsUseCase } from '../../../domain/use-cases/GetTransactionsUseCase';
import { GetBalanceUseCase } from '../../../domain/use-cases/GetBalanceUseCase';
import { Transaction, TransactionType } from '../../../domain/entities/Transaction';
import { AuthenticatedRequest } from '../../../infrastructure/middleware/AuthMiddleware';

// Mock do Logger
jest.mock('../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    })
  }
}));

describe('TransactionController', () => {
  let transactionController: TransactionController;
  let mockCreateTransactionUseCase: jest.Mocked<CreateTransactionUseCase>;
  let mockGetTransactionsUseCase: jest.Mocked<GetTransactionsUseCase>;
  let mockGetBalanceUseCase: jest.Mocked<GetBalanceUseCase>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Mock dos use cases
    mockCreateTransactionUseCase = {
      execute: jest.fn()
    } as any;

    mockGetTransactionsUseCase = {
      execute: jest.fn()
    } as any;

    mockGetBalanceUseCase = {
      execute: jest.fn()
    } as any;

    // Mock do Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    transactionController = new TransactionController(
      mockCreateTransactionUseCase,
      mockGetTransactionsUseCase,
      mockGetBalanceUseCase
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a CREDIT transaction successfully', async () => {
      // Arrange
      mockRequest = {
        body: {
          amount: 10000,
          type: 'CREDIT'
        },
        user: {
          userId: 'user-123'
        },
        correlationId: 'test-correlation',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-user-agent')
      } as any;

      const transaction = Transaction.create({
        userId: 'user-123',
        amount: 10000,
        type: TransactionType.CREDIT
      });

      mockCreateTransactionUseCase.execute.mockResolvedValue(transaction);

      // Act
      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateTransactionUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        amount: 10000,
        type: TransactionType.CREDIT
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(transaction);
    });

    it('should return 400 for missing user ID', async () => {
      // Arrange
      mockRequest = {
        body: {
          amount: 10000,
          type: 'CREDIT'
        },
        user: undefined, // No user in request
        correlationId: 'test-correlation'
      } as any;

      // Act
      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateTransactionUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User ID not found in token',
        code: 'INVALID_USER_TOKEN'
      });
    });

    it('should return 400 for missing amount', async () => {
      // Arrange
      mockRequest = {
        body: {
          type: 'CREDIT'
          // amount missing
        },
        user: {
          userId: 'user-123'
        },
        correlationId: 'test-correlation'
      } as any;

      // Act
      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateTransactionUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        missingFields: ['amount'],
        requiredFields: ['amount', 'type']
      });
    });

    it('should return 400 for invalid amount', async () => {
      // Arrange
      mockRequest = {
        body: {
          amount: -1000, // Invalid negative amount
          type: 'CREDIT'
        },
        user: {
          userId: 'user-123'
        },
        correlationId: 'test-correlation'
      } as any;

      // Act
      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateTransactionUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid amount - must be a positive number',
        provided: -1000
      });
    });

    it('should return 400 for invalid transaction type', async () => {
      // Arrange
      mockRequest = {
        body: {
          amount: 10000,
          type: 'INVALID_TYPE'
        },
        user: {
          userId: 'user-123'
        },
        correlationId: 'test-correlation'
      } as any;

      // Act
      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockCreateTransactionUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid transaction type. Must be CREDIT or DEBIT',
        provided: 'INVALID_TYPE'
      });
    });

    it('should handle insufficient funds for DEBIT transaction', async () => {
      // Arrange
      mockRequest = {
        body: {
          amount: 10000,
          type: 'DEBIT'
        },
        user: {
          userId: 'user-123'
        },
        correlationId: 'test-correlation'
      } as any;

      // Mock balance check to return insufficient funds
      mockGetBalanceUseCase.execute.mockResolvedValue({ amount: 5000 });

      // Act
      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockGetBalanceUseCase.execute).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(mockCreateTransactionUseCase.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Insufficient funds for this transaction',
        code: 'INSUFFICIENT_FUNDS',
        currentBalance: 5000,
        requestedAmount: 10000
      });
    });

    it('should handle use case errors', async () => {
      // Arrange
      mockRequest = {
        body: {
          amount: 10000,
          type: 'CREDIT'
        },
        user: {
          userId: 'user-123'
        },
        correlationId: 'test-correlation'
      } as any;

      mockCreateTransactionUseCase.execute.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error during transaction creation',
        code: 'UNEXPECTED_ERROR'
      });
    });
  });

  describe('getTransactions', () => {
    it('should get transactions successfully', async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: 'user-123'
        },
        query: {},
        correlationId: 'test-correlation'
      } as any;

      const transactions = [
        Transaction.create({
          userId: 'user-123',
          amount: 10000,
          type: TransactionType.CREDIT
        })
      ];

      mockGetTransactionsUseCase.execute.mockResolvedValue(transactions);

      // Act
      await transactionController.getTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockGetTransactionsUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        type: undefined
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(transactions);
    });
  });

  describe('getBalance', () => {
    it('should get user balance successfully', async () => {
      // Arrange
      mockRequest = {
        user: {
          userId: 'user-123'
        },
        correlationId: 'test-correlation'
      } as any;

      const balance = { amount: 25000 };
      mockGetBalanceUseCase.execute.mockResolvedValue(balance);

      // Act
      await transactionController.getBalance(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      // Assert
      expect(mockGetBalanceUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(balance);
    });
  });
});
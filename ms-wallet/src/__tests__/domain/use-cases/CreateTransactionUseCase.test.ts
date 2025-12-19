import { CreateTransactionUseCase } from '../../../domain/use-cases/CreateTransactionUseCase';
import { TransactionRepository } from '../../../domain/repositories/TransactionRepository';
import { Transaction, TransactionType } from '../../../domain/entities/Transaction';

// Mock do Logger para evitar saída de log durante os testes
jest.mock('../../../infrastructure/logging/Logger', () => ({
  Logger: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn()
    })
  }
}));

describe('CreateTransactionUseCase', () => {
  let createTransactionUseCase: CreateTransactionUseCase;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    // Mock do repositório
    mockTransactionRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      getBalance: jest.fn()
    };

    createTransactionUseCase = new CreateTransactionUseCase(mockTransactionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a transaction with valid CREDIT data', async () => {
      // Arrange
      const request = {
        userId: 'user-123',
        amount: 10000, // R$ 100.00
        type: TransactionType.CREDIT
      };

      const createdTransaction = Transaction.create(request);
      mockTransactionRepository.save.mockResolvedValue(createdTransaction);

      // Act
      const result = await createTransactionUseCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(request.userId);
      expect(result.amount).toBe(request.amount);
      expect(result.type).toBe(request.type);
      expect(mockTransactionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTransactionRepository.save).toHaveBeenCalledWith(expect.any(Transaction));
    });

    it('should create a transaction with valid DEBIT data', async () => {
      // Arrange
      const request = {
        userId: 'user-456',
        amount: 5000, // R$ 50.00
        type: TransactionType.DEBIT
      };

      const createdTransaction = Transaction.create(request);
      mockTransactionRepository.save.mockResolvedValue(createdTransaction);

      // Act
      const result = await createTransactionUseCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(request.userId);
      expect(result.amount).toBe(request.amount);
      expect(result.type).toBe(request.type);
      expect(mockTransactionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid amount (zero)', async () => {
      // Arrange
      const request = {
        userId: 'user-123',
        amount: 0, // Invalid amount
        type: TransactionType.CREDIT
      };

      // Act & Assert
      await expect(createTransactionUseCase.execute(request)).rejects.toThrow(
        'Amount must be greater than 0'
      );
      
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for invalid amount (negative)', async () => {
      // Arrange
      const request = {
        userId: 'user-123',
        amount: -1000,
        type: TransactionType.CREDIT
      };

      // Act & Assert
      await expect(createTransactionUseCase.execute(request)).rejects.toThrow(
        'Amount must be greater than 0'
      );
      
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for missing userId', async () => {
      // Arrange
      const request = {
        userId: '', // Empty userId
        amount: 10000,
        type: TransactionType.CREDIT
      };

      // Act & Assert
      await expect(createTransactionUseCase.execute(request)).rejects.toThrow(
        'User ID is required'
      );
      
      expect(mockTransactionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const request = {
        userId: 'user-123',
        amount: 10000,
        type: TransactionType.CREDIT
      };

      const repositoryError = new Error('Database connection failed');
      mockTransactionRepository.save.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(createTransactionUseCase.execute(request)).rejects.toThrow(
        'Database connection failed'
      );
      
      expect(mockTransactionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle large amounts correctly', async () => {
      // Arrange
      const request = {
        userId: 'user-789',
        amount: 999999999, // Large amount
        type: TransactionType.CREDIT
      };

      const createdTransaction = Transaction.create(request);
      mockTransactionRepository.save.mockResolvedValue(createdTransaction);

      // Act
      const result = await createTransactionUseCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.amount).toBe(request.amount);
      expect(mockTransactionRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should auto-generate transaction ID', async () => {
      // Arrange
      const request = {
        userId: 'user-123',
        amount: 10000,
        type: TransactionType.CREDIT
      };

      const createdTransaction = Transaction.create(request);
      mockTransactionRepository.save.mockResolvedValue(createdTransaction);

      // Act
      const result = await createTransactionUseCase.execute(request);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.id).not.toBe('');
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('should set createdAt timestamp', async () => {
      // Arrange
      const request = {
        userId: 'user-123',
        amount: 10000,
        type: TransactionType.CREDIT
      };

      const createdTransaction = Transaction.create(request);
      mockTransactionRepository.save.mockResolvedValue(createdTransaction);

      // Act
      const result = await createTransactionUseCase.execute(request);

      // Assert
      expect(result.createdAt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
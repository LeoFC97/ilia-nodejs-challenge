import { GetTransactionsUseCase } from '../../../domain/use-cases/GetTransactionsUseCase';
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

describe('GetTransactionsUseCase', () => {
  let getTransactionsUseCase: GetTransactionsUseCase;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    // Mock do repositório
    mockTransactionRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      getBalance: jest.fn()
    };

    getTransactionsUseCase = new GetTransactionsUseCase(mockTransactionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user transactions without type filter', async () => {
      // Arrange
      const userId = 'user-123';
      const transactions = [
        Transaction.restore({
          id: 'tx-001',
          userId,
          amount: 10000,
          type: TransactionType.CREDIT,
          createdAt: new Date('2024-01-15T10:00:00Z')
        }),
        Transaction.restore({
          id: 'tx-002',
          userId,
          amount: 5000,
          type: TransactionType.DEBIT,
          createdAt: new Date('2024-01-15T11:00:00Z')
        })
      ];

      mockTransactionRepository.findByUserId.mockResolvedValue(transactions);

      // Act
      const result = await getTransactionsUseCase.execute({
        userId
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-001');
      expect(result[0].type).toBe(TransactionType.CREDIT);
      expect(result[1].id).toBe('tx-002');
      expect(result[1].type).toBe(TransactionType.DEBIT);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        { type: undefined }
      );
    });

    it('should return user transactions with CREDIT type filter', async () => {
      // Arrange
      const userId = 'user-456';
      const transactions = [
        Transaction.restore({
          id: 'tx-003',
          userId,
          amount: 15000,
          type: TransactionType.CREDIT,
          createdAt: new Date('2024-01-15T12:00:00Z')
        })
      ];

      mockTransactionRepository.findByUserId.mockResolvedValue(transactions);

      // Act
      const result = await getTransactionsUseCase.execute({
        userId,
        type: TransactionType.CREDIT
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-003');
      expect(result[0].type).toBe(TransactionType.CREDIT);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        { type: TransactionType.CREDIT }
      );
    });

    it('should return user transactions with DEBIT type filter', async () => {
      // Arrange
      const userId = 'user-789';
      const transactions = [
        Transaction.restore({
          id: 'tx-004',
          userId,
          amount: 8000,
          type: TransactionType.DEBIT,
          createdAt: new Date('2024-01-15T13:00:00Z')
        })
      ];

      mockTransactionRepository.findByUserId.mockResolvedValue(transactions);

      // Act
      const result = await getTransactionsUseCase.execute({
        userId,
        type: TransactionType.DEBIT
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-004');
      expect(result[0].type).toBe(TransactionType.DEBIT);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        { type: TransactionType.DEBIT }
      );
    });

    it('should return empty array when user has no transactions', async () => {
      // Arrange
      const userId = 'user-empty';
      mockTransactionRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await getTransactionsUseCase.execute({
        userId
      });

      // Assert
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        { type: undefined }
      );
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const userId = 'user-error';
      const repositoryError = new Error('Database query failed');
      mockTransactionRepository.findByUserId.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(getTransactionsUseCase.execute({ userId })).rejects.toThrow(
        'Database query failed'
      );

      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        { type: undefined }
      );
    });

    it('should handle userId validation', async () => {
      // Arrange
      const userId = '';
      const transactions: Transaction[] = [];
      mockTransactionRepository.findByUserId.mockResolvedValue(transactions);

      // Act
      const result = await getTransactionsUseCase.execute({
        userId
      });

      // Assert
      expect(result).toEqual([]);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        { type: undefined }
      );
    });

    it('should maintain transaction ordering from repository', async () => {
      // Arrange
      const userId = 'user-order';
      const transactions = [
        Transaction.restore({
          id: 'tx-latest',
          userId,
          amount: 3000,
          type: TransactionType.CREDIT,
          createdAt: new Date('2024-01-15T15:00:00Z')
        }),
        Transaction.restore({
          id: 'tx-oldest',
          userId,
          amount: 2000,
          type: TransactionType.DEBIT,
          createdAt: new Date('2024-01-15T09:00:00Z')
        })
      ];

      mockTransactionRepository.findByUserId.mockResolvedValue(transactions);

      // Act
      const result = await getTransactionsUseCase.execute({
        userId
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-latest');
      expect(result[1].id).toBe('tx-oldest');
      // Order should be maintained as returned by repository
    });

    it('should pass correct filters to repository', async () => {
      // Arrange
      const userId = 'user-filters';
      const type = TransactionType.CREDIT;
      mockTransactionRepository.findByUserId.mockResolvedValue([]);

      // Act
      await getTransactionsUseCase.execute({
        userId,
        type
      });

      // Assert
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        { type: TransactionType.CREDIT }
      );
    });
  });
});
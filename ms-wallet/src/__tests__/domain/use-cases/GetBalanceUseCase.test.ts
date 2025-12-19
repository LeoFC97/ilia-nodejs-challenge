import { GetBalanceUseCase } from '../../../domain/use-cases/GetBalanceUseCase';
import { TransactionRepository, Balance } from '../../../domain/repositories/TransactionRepository';

describe('GetBalanceUseCase', () => {
  let getBalanceUseCase: GetBalanceUseCase;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    // Mock do repositório
    mockTransactionRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      getBalance: jest.fn()
    };

    getBalanceUseCase = new GetBalanceUseCase(mockTransactionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user balance with positive amount', async () => {
      // Arrange
      const userId = 'user-123';
      const expectedBalance: Balance = { amount: 25000 }; // R$ 250.00
      
      mockTransactionRepository.getBalance.mockResolvedValue(expectedBalance);

      // Act
      const result = await getBalanceUseCase.execute({ userId });

      // Assert
      expect(result).toEqual(expectedBalance);
      expect(result.amount).toBe(25000);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith(userId);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledTimes(1);
    });

    it('should return zero balance for new user', async () => {
      // Arrange
      const userId = 'user-new';
      const expectedBalance: Balance = { amount: 0 };
      
      mockTransactionRepository.getBalance.mockResolvedValue(expectedBalance);

      // Act
      const result = await getBalanceUseCase.execute({ userId });

      // Assert
      expect(result).toEqual(expectedBalance);
      expect(result.amount).toBe(0);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith(userId);
    });

    it('should return negative balance when debits exceed credits', async () => {
      // Arrange
      const userId = 'user-negative';
      const expectedBalance: Balance = { amount: -5000 }; // -R$ 50.00
      
      mockTransactionRepository.getBalance.mockResolvedValue(expectedBalance);

      // Act
      const result = await getBalanceUseCase.execute({ userId });

      // Assert
      expect(result).toEqual(expectedBalance);
      expect(result.amount).toBe(-5000);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith(userId);
    });

    it('should handle large balance amounts', async () => {
      // Arrange
      const userId = 'user-large';
      const expectedBalance: Balance = { amount: 999999999 }; // Large amount
      
      mockTransactionRepository.getBalance.mockResolvedValue(expectedBalance);

      // Act
      const result = await getBalanceUseCase.execute({ userId });

      // Assert
      expect(result).toEqual(expectedBalance);
      expect(result.amount).toBe(999999999);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith(userId);
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const userId = 'user-error';
      const repositoryError = new Error('Database connection failed');
      
      mockTransactionRepository.getBalance.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(getBalanceUseCase.execute({ userId })).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith(userId);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledTimes(1);
    });

    it('should handle empty userId', async () => {
      // Arrange
      const userId = '';
      const expectedBalance: Balance = { amount: 0 };
      
      mockTransactionRepository.getBalance.mockResolvedValue(expectedBalance);

      // Act
      const result = await getBalanceUseCase.execute({ userId });

      // Assert
      expect(result).toEqual(expectedBalance);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith(userId);
    });

    it('should handle repository returning null or undefined gracefully', async () => {
      // Arrange
      const userId = 'user-null';
      
      // Simulate repository returning null (some edge case)
      mockTransactionRepository.getBalance.mockResolvedValue(null as any);

      // Act & Assert
      const result = await getBalanceUseCase.execute({ userId });
      
      // Should receive null as returned by repository
      expect(result).toBeNull();
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith(userId);
    });

    it('should pass userId parameter correctly to repository', async () => {
      // Arrange
      const userId = 'user-specific-id-123';
      const expectedBalance: Balance = { amount: 12345 };
      
      mockTransactionRepository.getBalance.mockResolvedValue(expectedBalance);

      // Act
      await getBalanceUseCase.execute({ userId });

      // Assert
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith(userId);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledWith('user-specific-id-123');
    });

    it('should handle concurrent requests for same user', async () => {
      // Arrange
      const userId = 'user-concurrent';
      const expectedBalance: Balance = { amount: 10000 };
      
      mockTransactionRepository.getBalance.mockResolvedValue(expectedBalance);

      // Act
      const promise1 = getBalanceUseCase.execute({ userId });
      const promise2 = getBalanceUseCase.execute({ userId });
      
      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Assert
      expect(result1).toEqual(expectedBalance);
      expect(result2).toEqual(expectedBalance);
      expect(mockTransactionRepository.getBalance).toHaveBeenCalledTimes(2);
    });
  });
});
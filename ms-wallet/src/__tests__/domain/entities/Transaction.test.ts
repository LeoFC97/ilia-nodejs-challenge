import { Transaction, TransactionType } from '../../../domain/entities/Transaction';

describe('Transaction Entity', () => {
  describe('create', () => {
    it('should create a transaction with valid data', () => {
      const transactionData = {
        userId: 'user123',
        amount: 100.50,
        type: TransactionType.CREDIT
      };

      const transaction = Transaction.create(transactionData);

      expect(transaction.id).toBeDefined();
      expect(transaction.userId).toBe('user123');
      expect(transaction.type).toBe(TransactionType.CREDIT);
      expect(transaction.amount).toBe(100.50);
      expect(transaction.createdAt).toBeInstanceOf(Date);
    });

    it('should auto-generate id when not provided', () => {
      const transactionData = {
        userId: 'user456',
        amount: 50.25,
        type: TransactionType.DEBIT
      };

      const transaction = Transaction.create(transactionData);

      expect(transaction.id).toBeDefined();
      expect(transaction.userId).toBe('user456');
      expect(transaction.type).toBe(TransactionType.DEBIT);
      expect(transaction.amount).toBe(50.25);
    });
  });

  describe('restore', () => {
    it('should restore a transaction with complete data', () => {
      const transactionData = {
        id: 'trans-123',
        userId: 'user123',
        amount: 100.00,
        type: TransactionType.CREDIT,
        createdAt: new Date('2023-01-01')
      };

      const transaction = Transaction.restore(transactionData);

      expect(transaction.id).toBe('trans-123');
      expect(transaction.userId).toBe('user123');
      expect(transaction.amount).toBe(100.00);
      expect(transaction.type).toBe(TransactionType.CREDIT);
      expect(transaction.createdAt).toEqual(new Date('2023-01-01'));
    });

    it('should throw error when restoring without id', () => {
      const transactionData = {
        userId: 'user123',
        amount: 100.00,
        type: TransactionType.CREDIT
      };

      expect(() => Transaction.restore(transactionData as any))
        .toThrow('ID and createdAt are required for restoring a transaction');
    });

    it('should throw error when restoring without createdAt', () => {
      const transactionData = {
        id: 'trans-123',
        userId: 'user123',
        amount: 100.00,
        type: TransactionType.CREDIT
      };

      expect(() => Transaction.restore(transactionData as any))
        .toThrow('ID and createdAt are required for restoring a transaction');
    });
  });

  describe('validation', () => {
    it('should throw error for missing userId', () => {
      const transactionData = {
        userId: '',
        amount: 100.00,
        type: TransactionType.CREDIT
      };

      expect(() => Transaction.create(transactionData))
        .toThrow('User ID is required');
    });

    it('should throw error for invalid amount', () => {
      const transactionData = {
        userId: 'user123',
        amount: -50.00,
        type: TransactionType.CREDIT
      };

      expect(() => Transaction.create(transactionData))
        .toThrow('Amount must be greater than 0');
    });

    it('should throw error for zero amount', () => {
      const transactionData = {
        userId: 'user123',
        amount: 0,
        type: TransactionType.CREDIT
      };

      expect(() => Transaction.create(transactionData))
        .toThrow('Amount must be greater than 0');
    });
  });

  describe('getters', () => {
    it('should provide access to all properties', () => {
      const transactionData = {
        id: 'trans-123',
        userId: 'user123',
        amount: 100.00,
        type: TransactionType.CREDIT,
        createdAt: new Date('2023-01-01')
      };

      const transaction = Transaction.restore(transactionData);

      expect(transaction.id).toBe('trans-123');
      expect(transaction.userId).toBe('user123');
      expect(transaction.amount).toBe(100.00);
      expect(transaction.type).toBe(TransactionType.CREDIT);
      expect(transaction.createdAt).toEqual(new Date('2023-01-01'));
    });
  });
});
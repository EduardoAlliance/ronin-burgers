import { getDatabase, closeDatabase } from '../database';
import { Category, Product, Order, OrderItem, Expense } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 200;

async function withRetry<T>(
  operation: () => Promise<T>,
  context: string = 'database'
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await getDatabase();
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`DB ${context} failed (attempt ${attempt}/${MAX_RETRIES}):`, lastError.message);

      if (lastError.message.includes('NullPointerException') ||
          lastError.message.includes('prepareAsync') ||
          lastError.message.includes('execAsync') ||
          lastError.message.includes('getAllAsync')) {
        console.log('Reconnecting database due to native error...');
        await closeDatabase();
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw new Error(`DB ${context} failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

async function executeWrite(sql: string, params: any[] = []) {
  return withRetry(async () => {
    const db = await getDatabase();
    return await db.runAsync(sql, params);
  }, 'write');
}

async function executeQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
  return withRetry(async () => {
    const db = await getDatabase();
    return await db.getAllAsync<T>(sql, params);
  }, 'query');
}

async function executeQueryFirst<T>(sql: string, params: any[] = []): Promise<T | null> {
  return withRetry(async () => {
    const db = await getDatabase();
    return await db.getFirstAsync<T>(sql, params);
  }, 'queryFirst');
}

// Categories
export const createCategory = async (name: string, sortOrder: number = 0): Promise<number> => {
  const result = await executeWrite('INSERT INTO categories (name, sort_order) VALUES (?, ?)', [name, sortOrder]);
  return result.lastInsertRowId;
};

export const getCategories = async (): Promise<Category[]> => {
  return executeQuery<Category>('SELECT * FROM categories ORDER BY sort_order, name');
};

export const updateCategory = async (id: number, name: string, sortOrder: number): Promise<void> => {
  await executeWrite('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?', [name, sortOrder, id]);
};

export const deleteCategory = async (id: number): Promise<void> => {
  await executeWrite('DELETE FROM categories WHERE id = ?', [id]);
};

// Products
export const createProduct = async (name: string, price: number, categoryId: number | null): Promise<number> => {
  const result = await executeWrite('INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)', [name, price, categoryId]);
  return result.lastInsertRowId;
};

export const getProducts = async (activeOnly: boolean = false): Promise<Product[]> => {
  let sql = 'SELECT * FROM products';
  if (activeOnly) sql += ' WHERE is_active = 1';
  sql += ' ORDER BY name';
  return executeQuery<Product>(sql);
};

export const getProductsByCategory = async (categoryId: number): Promise<Product[]> => {
  return executeQuery<Product>('SELECT * FROM products WHERE category_id = ? AND is_active = 1 ORDER BY name', [categoryId]);
};

export const updateProduct = async (id: number, name: string, price: number, categoryId: number | null, isActive: number): Promise<void> => {
  await executeWrite('UPDATE products SET name = ?, price = ?, category_id = ?, is_active = ? WHERE id = ?',
    [name, price, categoryId, isActive, id]);
};

export const deleteProduct = async (id: number): Promise<void> => {
  await executeWrite('DELETE FROM products WHERE id = ?', [id]);
};

// Orders
export const createOrder = async (total: number, paymentMethod: 'cash' | 'card', items: { productId: number; quantity: number; unitPrice: number }[], customerName = ''): Promise<number> => {
  const result = await executeWrite('INSERT INTO orders (total, payment_method, customer_name) VALUES (?, ?, ?)', [total, paymentMethod, customerName]);
  const orderId = result.lastInsertRowId;

  for (const item of items) {
    await executeWrite(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
      [orderId, item.productId, item.quantity, item.unitPrice]
    );
  }

  return orderId;
};

export const getOrders = async (limit: number = 100): Promise<Order[]> => {
  return executeQuery<Order>('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?', [limit]);
};

export const getOrdersByDate = async (startDate: number, endDate: number): Promise<Order[]> => {
  return executeQuery<Order>(
    'SELECT * FROM orders WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC',
    [startDate, endDate]
  );
};

export const getOrderById = async (id: number): Promise<Order | null> => {
  return executeQueryFirst<Order>('SELECT * FROM orders WHERE id = ?', [id]);
};

export const updateOrderStatus = async (id: number, status: Order['status']): Promise<void> => {
  await executeWrite('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
};

export const getOrderItems = async (orderId: number): Promise<OrderItem[]> => {
  return executeQuery<OrderItem>('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
};

export const cancelOrder = async (orderId: number, reason: string): Promise<void> => {
  await executeWrite('INSERT INTO cancellations (order_id, reason) VALUES (?, ?)', [orderId, reason]);
  await executeWrite('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', orderId]);
};

// Expenses
export const createExpense = async (type: string, description: string, amount: number, date: number): Promise<number> => {
  const result = await executeWrite('INSERT INTO expenses (type, description, amount, date) VALUES (?, ?, ?, ?)', [type, description, amount, date]);
  return result.lastInsertRowId;
};

export const getExpenses = async (limit: number = 100): Promise<Expense[]> => {
  return executeQuery<Expense>('SELECT * FROM expenses ORDER BY date DESC LIMIT ?', [limit]);
};

export const getExpensesByDate = async (startDate: number, endDate: number): Promise<Expense[]> => {
  return executeQuery<Expense>(
    'SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate]
  );
};

export const deleteExpense = async (id: number): Promise<void> => {
  await executeWrite('DELETE FROM expenses WHERE id = ?', [id]);
};

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isClosing = false;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  try {
    if (dbInstance && !isClosing) {
      try {
        await dbInstance.getFirstAsync('SELECT 1');
        return dbInstance;
      } catch {
        console.warn('Database connection lost, recreating...');
        dbInstance = null;
      }
    }

    isClosing = false;
    dbInstance = await SQLite.openDatabaseAsync('ronin_burgers.db');

    if (Platform.OS === 'android') {
      await dbInstance.execAsync('PRAGMA journal_mode = WAL');
      await dbInstance.execAsync('PRAGMA synchronous = NORMAL');
    }

    return dbInstance;
  } catch (error) {
    console.error('Error opening database:', error);
    await new Promise(resolve => setTimeout(resolve, 100));
    return getDatabase();
  }
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance && !isClosing) {
    isClosing = true;
    try {
      await dbInstance.closeAsync();
    } catch (error) {
      console.warn('Error closing database:', error);
    } finally {
      dbInstance = null;
      isClosing = false;
    }
  }
}

if (__DEV__) {
  (globalThis as any).__cleanupDatabase = closeDatabase;
}

export const initDatabase = async (): Promise<void> => {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category_id INTEGER,
      image TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
      customer_name TEXT DEFAULT '',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cancellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
  `);

  try {
    await database.execAsync("ALTER TABLE orders ADD COLUMN customer_name TEXT DEFAULT ''");
  } catch {}
};

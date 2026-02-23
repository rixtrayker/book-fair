import { Pool, PoolClient, QueryResult } from 'pg';
import { ConfigService } from '@nestjs/config';

let pool: Pool | null = null;

export const initDatabase = async (configService?: ConfigService): Promise<void> => {
  if (pool) return;

  const config = configService ? {
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    user: configService.get<string>('database.user'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.name'),
  } : {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'kotobgy',
  };

  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  await createTables();
  console.log('Database initialized successfully');
};

const run = async (sql: string, params: any[] = []): Promise<QueryResult> => {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool.query(sql, params);
};

const all = async (sql: string, params: any[] = []): Promise<any[]> => {
  const result = await run(sql, params);
  return result.rows;
};

const get = async (sql: string, params: any[] = []): Promise<any | null> => {
  const result = await run(sql, params);
  return result.rows[0] || null;
};

const withTransaction = async <T>(work: (client: PoolClient) => Promise<T>): Promise<T> => {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const createTables = async (): Promise<void> => {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      is_managed BOOLEAN DEFAULT false,
      managed_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS publishers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      booth_number VARCHAR(50),
      hall_number VARCHAR(50),
      contact_info TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      title_normalized VARCHAR(500),
      author VARCHAR(255),
      author_normalized VARCHAR(255),
      isbn VARCHAR(20),
      publisher_id INTEGER REFERENCES publishers(id) ON DELETE SET NULL,
      original_price DECIMAL(10, 2),
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS lists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      visibility VARCHAR(20) DEFAULT 'private',
      share_token VARCHAR(36),
      assigned_collector_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS list_books (
      id SERIAL PRIMARY KEY,
      list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'pending',
      priority INTEGER DEFAULT 3,
      sort_order INTEGER DEFAULT 0,
      notes TEXT,
      assigned_collector_id INTEGER REFERENCES users(id),
      price DECIMAL(10, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS list_invitations (
      id SERIAL PRIMARY KEY,
      list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      collector_id INTEGER NOT NULL REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'pending',
      invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      responded_at TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS admin_book_tracking (
      id SERIAL PRIMARY KEY,
      list_book_id INTEGER NOT NULL UNIQUE REFERENCES list_books(id) ON DELETE CASCADE,
      admin_id INTEGER NOT NULL REFERENCES users(id),
      search_status VARCHAR(50) DEFAULT 'searching',
      actual_price DECIMAL(10, 2),
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      notes TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      admin_id INTEGER REFERENCES users(id),
      assigned_collector_id INTEGER REFERENCES users(id),
      visibility VARCHAR(20) DEFAULT 'private',
      total_price DECIMAL(10, 2) DEFAULT 0,
      shipping_status VARCHAR(50) DEFAULT 'pending',
      shipping_notes TEXT,
      shipping_tracking_serial VARCHAR(100),
      shipping_sticker_path VARCHAR(255),
      shipped_at TIMESTAMP,
      delivered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS order_books (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      list_book_id INTEGER NOT NULL REFERENCES list_books(id) ON DELETE CASCADE,
      actual_price DECIMAL(10, 2),
      purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      payload TEXT,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS collector_offers (
      id SERIAL PRIMARY KEY,
      collector_id INTEGER NOT NULL REFERENCES users(id),
      book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
      title_override VARCHAR(500),
      description TEXT,
      price DECIMAL(10, 2),
      quantity INTEGER DEFAULT 1,
      offer_type VARCHAR(20) DEFAULT 'available',
      visibility VARCHAR(20) DEFAULT 'public',
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS offer_targets (
      id SERIAL PRIMARY KEY,
      offer_id INTEGER NOT NULL REFERENCES collector_offers(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await createIndexes();
  await insertDefaultSettings();
};

const createIndexes = async (): Promise<void> => {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_books_title_normalized ON books(title_normalized)',
    'CREATE INDEX IF NOT EXISTS idx_books_author_normalized ON books(author_normalized)',
    'CREATE INDEX IF NOT EXISTS idx_list_books_list_id ON list_books(list_id)',
    'CREATE INDEX IF NOT EXISTS idx_list_books_book_id ON list_books(book_id)',
    'CREATE INDEX IF NOT EXISTS idx_list_books_assigned_collector ON list_books(assigned_collector_id)',
    'CREATE INDEX IF NOT EXISTS idx_list_books_status ON list_books(status)',
    'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_assigned_collector ON orders(assigned_collector_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_lists_assigned_collector ON lists(assigned_collector_id)',
    'CREATE INDEX IF NOT EXISTS idx_lists_share_token ON lists(share_token)',
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  ];

  for (const indexSql of indexes) {
    await run(indexSql);
  }
};

const insertDefaultSettings = async (): Promise<void> => {
  const existing = await get("SELECT key FROM system_settings WHERE key = 'email_notifications_enabled'");
  if (!existing) {
    await run("INSERT INTO system_settings (key, value, description) VALUES ('email_notifications_enabled', 'false', 'Enable email notifications')");
    await run("INSERT INTO system_settings (key, value, description) VALUES ('email_provider', 'sendgrid', 'Email service provider')");
  }
};

export { run, all, get, withTransaction, pool };

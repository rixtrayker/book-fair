const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bookfair.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
db.serialize(() => {
  // Create Books table
  db.run(`
    CREATE TABLE IF NOT EXISTS Books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT,
      publisher_id INTEGER,
      price REAL,
      notes TEXT,
      purchased INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (publisher_id) REFERENCES Publishers(id)
    )
  `);

  // Create Publishers/Booths table
  db.run(`
    CREATE TABLE IF NOT EXISTS Publishers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hall_number TEXT NOT NULL,
      column_number TEXT NOT NULL,
      contact_info TEXT,
      notes TEXT,
      visited INTEGER DEFAULT 0,
      visit_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Rentals table (keeping for compatibility, but not used in book fair context)
  db.run(`
    CREATE TABLE IF NOT EXISTS Rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      renter_name TEXT NOT NULL,
      renter_email TEXT NOT NULL,
      rental_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME NOT NULL,
      return_date DATETIME,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (book_id) REFERENCES Books(id)
    )
  `);

  console.log('Database schema initialized successfully');
});

module.exports = db;

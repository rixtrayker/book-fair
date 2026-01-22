const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ========================================
// PUBLISHER/BOOTH MANAGEMENT ENDPOINTS
// ========================================

// Get all publishers with optional filtering
app.get('/api/publishers', (req, res) => {
  const { hall_number, column_number, visited, search } = req.query;

  let sql = 'SELECT * FROM Publishers WHERE 1=1';
  const params = [];

  if (hall_number) {
    sql += ' AND hall_number = ?';
    params.push(hall_number);
  }

  if (column_number) {
    sql += ' AND column_number = ?';
    params.push(column_number);
  }

  if (visited !== undefined) {
    sql += ' AND visited = ?';
    params.push(visited === 'true' ? 1 : 0);
  }

  if (search) {
    sql += ' AND (name LIKE ? OR contact_info LIKE ? OR notes LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY hall_number, column_number';

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ publishers: rows });
  });
});

// Get a single publisher by ID
app.get('/api/publishers/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM Publishers WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Publisher not found' });
    }
    res.json({ publisher: row });
  });
});

// Add a new publisher
app.post('/api/publishers', (req, res) => {
  const { name, hall_number, column_number, contact_info, notes } = req.body;

  if (!name || !hall_number || !column_number) {
    return res.status(400).json({
      error: 'Missing required fields: name, hall_number, column_number'
    });
  }

  const sql = 'INSERT INTO Publishers (name, hall_number, column_number, contact_info, notes) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [name, hall_number, column_number, contact_info || '', notes || ''], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'Publisher added successfully',
      publisher: {
        id: this.lastID,
        name,
        hall_number,
        column_number,
        contact_info: contact_info || '',
        notes: notes || '',
        visited: 0
      }
    });
  });
});

// Update a publisher
app.put('/api/publishers/:id', (req, res) => {
  const { id } = req.params;
  const { name, hall_number, column_number, contact_info, notes } = req.body;

  if (!name || !hall_number || !column_number) {
    return res.status(400).json({
      error: 'Missing required fields: name, hall_number, column_number'
    });
  }

  const sql = 'UPDATE Publishers SET name = ?, hall_number = ?, column_number = ?, contact_info = ?, notes = ? WHERE id = ?';
  db.run(sql, [name, hall_number, column_number, contact_info || '', notes || '', id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Publisher not found' });
    }
    res.json({
      message: 'Publisher updated successfully',
      publisher: { id, name, hall_number, column_number, contact_info, notes }
    });
  });
});

// Mark publisher as visited/unvisited
app.patch('/api/publishers/:id/visit', (req, res) => {
  const { id } = req.params;
  const { visited } = req.body;

  const visitedValue = visited ? 1 : 0;
  const visitDate = visited ? new Date().toISOString() : null;

  const sql = 'UPDATE Publishers SET visited = ?, visit_date = ? WHERE id = ?';
  db.run(sql, [visitedValue, visitDate, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Publisher not found' });
    }
    res.json({
      message: visited ? 'Publisher marked as visited' : 'Visit status removed',
      publisher: { id, visited: visitedValue, visit_date: visitDate }
    });
  });
});

// Delete a publisher
app.delete('/api/publishers/:id', (req, res) => {
  const { id } = req.params;

  // Check if publisher has books
  db.get('SELECT COUNT(*) as count FROM Books WHERE publisher_id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row.count > 0) {
      return res.status(400).json({
        error: `Cannot delete publisher with ${row.count} associated books`
      });
    }

    db.run('DELETE FROM Publishers WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Publisher not found' });
      }
      res.json({ message: 'Publisher deleted successfully' });
    });
  });
});

// Get unique hall numbers
app.get('/api/publishers/filters/halls', (req, res) => {
  db.all('SELECT DISTINCT hall_number FROM Publishers ORDER BY hall_number', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ halls: rows.map(r => r.hall_number) });
  });
});

// Get unique column numbers for a hall
app.get('/api/publishers/filters/columns', (req, res) => {
  const { hall_number } = req.query;

  let sql = 'SELECT DISTINCT column_number FROM Publishers';
  const params = [];

  if (hall_number) {
    sql += ' WHERE hall_number = ?';
    params.push(hall_number);
  }

  sql += ' ORDER BY column_number';

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ columns: rows.map(r => r.column_number) });
  });
});

// ========================================
// BOOK MANAGEMENT ENDPOINTS
// ========================================

// Get all books with optional filtering
app.get('/api/books', (req, res) => {
  const { publisher_id, purchased, search } = req.query;

  let sql = `
    SELECT b.*, p.name as publisher_name, p.hall_number, p.column_number
    FROM Books b
    LEFT JOIN Publishers p ON b.publisher_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (publisher_id) {
    sql += ' AND b.publisher_id = ?';
    params.push(publisher_id);
  }

  if (purchased !== undefined) {
    sql += ' AND b.purchased = ?';
    params.push(purchased === 'true' ? 1 : 0);
  }

  if (search) {
    sql += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.notes LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY b.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ books: rows });
  });
});

// Get a single book by ID
app.get('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT b.*, p.name as publisher_name, p.hall_number, p.column_number
    FROM Books b
    LEFT JOIN Publishers p ON b.publisher_id = p.id
    WHERE b.id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ book: row });
  });
});

// Add a new book
app.post('/api/books', (req, res) => {
  const { title, author, isbn, publisher_id, price, notes } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Missing required fields: title, author' });
  }

  const sql = 'INSERT INTO Books (title, author, isbn, publisher_id, price, notes, purchased) VALUES (?, ?, ?, ?, ?, ?, 0)';
  db.run(sql, [title, author, isbn || '', publisher_id || null, price || null, notes || ''], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'Book added successfully',
      book: {
        id: this.lastID,
        title,
        author,
        isbn: isbn || '',
        publisher_id: publisher_id || null,
        price: price || null,
        notes: notes || '',
        purchased: 0
      }
    });
  });
});

// Update a book
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, publisher_id, price, notes } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Missing required fields: title, author' });
  }

  const sql = 'UPDATE Books SET title = ?, author = ?, isbn = ?, publisher_id = ?, price = ?, notes = ? WHERE id = ?';
  db.run(sql, [title, author, isbn || '', publisher_id || null, price || null, notes || '', id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({
      message: 'Book updated successfully',
      book: { id, title, author, isbn, publisher_id, price, notes }
    });
  });
});

// Mark book as purchased/unpurchased
app.patch('/api/books/:id/purchase', (req, res) => {
  const { id } = req.params;
  const { purchased } = req.body;

  const purchasedValue = purchased ? 1 : 0;

  const sql = 'UPDATE Books SET purchased = ? WHERE id = ?';
  db.run(sql, [purchasedValue, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({
      message: purchased ? 'Book marked as purchased' : 'Purchase status removed',
      book: { id, purchased: purchasedValue }
    });
  });
});

// Delete a book
app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM Books WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  });
});

// ========================================
// STATISTICS ENDPOINTS
// ========================================

app.get('/api/stats', (req, res) => {
  db.get(`
    SELECT
      (SELECT COUNT(*) FROM Books) as total_books,
      (SELECT COUNT(*) FROM Books WHERE purchased = 1) as purchased_books,
      (SELECT COUNT(*) FROM Publishers) as total_publishers,
      (SELECT COUNT(*) FROM Publishers WHERE visited = 1) as visited_publishers
  `, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ stats: row });
  });
});

// ========================================
// SERVER START
// ========================================

app.listen(PORT, () => {
  console.log(`Book Fair Management System running on http://localhost:${PORT}`);
});

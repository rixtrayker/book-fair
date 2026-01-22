# Book Fair Management System

A complete web application for managing book inventory and rental operations at book fairs.

## Features

- Book inventory management (Add, Edit, Delete)
- Track book availability in real-time
- Rental management system
- Automatic availability tracking
- Overdue rental detection
- Clean, responsive web interface

## Technology Stack

- Backend: Node.js + Express.js
- Database: SQLite3
- Frontend: HTML, CSS, JavaScript (Vanilla)

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Books

- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get a specific book
- `POST /api/books` - Add a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book

### Rentals

- `GET /api/rentals` - Get all rentals (optional query: `?status=active` or `?status=returned`)
- `GET /api/rentals/:id` - Get a specific rental
- `POST /api/rentals` - Create a new rental
- `PATCH /api/rentals/:id/return` - Return a rented book

## Database Schema

### Books Table
- id (INTEGER, Primary Key)
- title (TEXT)
- author (TEXT)
- isbn (TEXT, Unique)
- quantity (INTEGER)
- available (INTEGER)
- created_at (DATETIME)

### Rentals Table
- id (INTEGER, Primary Key)
- book_id (INTEGER, Foreign Key)
- renter_name (TEXT)
- renter_email (TEXT)
- rental_date (DATETIME)
- due_date (DATETIME)
- return_date (DATETIME)
- status (TEXT: 'active' or 'returned')

## Testing the API

You can test the API endpoints using curl:

```bash
# Add a book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"The Great Gatsby","author":"F. Scott Fitzgerald","isbn":"978-0-7432-7356-5","quantity":5}'

# Get all books
curl http://localhost:3000/api/books

# Create a rental
curl -X POST http://localhost:3000/api/rentals \
  -H "Content-Type: application/json" \
  -d '{"book_id":1,"renter_name":"John Doe","renter_email":"john@example.com","due_date":"2026-01-30"}'

# Return a book
curl -X PATCH http://localhost:3000/api/rentals/1/return
```

## Features Detail

### Book Management
- Add new books with title, author, ISBN, and quantity
- Edit existing book information
- Delete books (only if no active rentals)
- Real-time availability tracking

### Rental Management
- Rent available books to customers
- Track rental dates and due dates
- Automatic overdue detection
- Return process updates availability automatically
- Filter rentals by status (active/returned)

## Project Structure

```
book-fair/
├── server.js           # Express server and API endpoints
├── database.js         # SQLite database setup and schema
├── package.json        # Project dependencies
├── bookfair.db        # SQLite database file (created automatically)
└── public/            # Frontend files
    ├── index.html     # Main HTML interface
    ├── styles.css     # Styling
    └── app.js         # Frontend JavaScript
```

## Security Features

- Input validation on all endpoints
- SQL injection prevention through parameterized queries
- Email format validation
- Transaction support for data consistency
- XSS prevention through HTML escaping

## Future Enhancements

- User authentication and authorization
- Advanced search and filtering
- Late fee calculation
- Email notifications for due dates
- Export reports to CSV/PDF
- Barcode scanning support

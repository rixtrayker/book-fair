# Book Fair Management System v2.0

A complete web application for managing book collections at book fairs with user lists, admin tracking, and order management.

## 🎯 Features

### User Features
- **Authentication**: Register and login with email/password
- **Multiple Lists**: Create and manage multiple book lists
- **Book Management**: Add books to lists with status (want/maybe/thinking/cancel) and priority (1-5)
- **Public Lists**: Make lists public for admins to see
- **Order Tracking**: View order status and shipping information
- **Bilingual**: Full support for English and Arabic

### Admin Features
- **Admin View**: See all public user lists with filtering by hall, booth, priority, status
- **Book Tracking**: Track search status (searching/found/purchased) for each book
- **Price Management**: Set actual prices and discounts
- **Smart Ordering**: Select books from multiple users and create consolidated orders
- **Shipping Management**: Update order shipping status (pending/shipped/delivered)
- **Publisher & Book Management**: Manage publishers and books database

## 🏗️ Architecture

- **Backend**: NestJS (TypeScript) + SQLite
- **Frontend**: React + Vite + i18next
- **Authentication**: JWT-based
- **Database**: SQLite with comprehensive schema

## 📊 Database Schema

### Users
- Authentication and role management (user/admin)

### Publishers
- Name, booth number, hall number, contact info

### Books
- Title, author, ISBN, publisher reference, price, category

### Lists
- User-owned lists with public/private visibility

### ListBooks
- Books in lists with status, priority, and notes

### AdminBookTracking
- Admin tracking of search status, actual prices, discounts

### Orders
- Purchase orders with shipping status

### OrderBooks
- Books included in each order

## 🚀 Installation

### Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📝 Usage

### First Time Setup

1. Start the backend server
2. Start the frontend server
3. Register a new user account
4. To create an admin account, manually update the database:

```bash
sqlite3 backend/bookfair.db
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### User Workflow

1. **Create Lists**: Create one or more lists for different purposes
2. **Add Books**: Browse books and add them to your lists
3. **Set Priorities**: Mark books with priority (1-5, where 5 is highest)
4. **Set Status**: Mark books as want/maybe/thinking/cancel
5. **Make Public**: Make lists public so admins can see them
6. **Track Orders**: View orders created by admins

### Admin Workflow

1. **View Public Lists**: See all public lists from users
2. **Filter & Sort**: Filter by hall, booth, priority to optimize collection routes
3. **Track Books**: Update search status as you find books
4. **Set Prices**: Enter actual prices and any discounts obtained
5. **Create Orders**: Select books (can be from multiple users) and create orders
6. **Update Shipping**: Update order status as you ship and deliver

## 🎨 Priority System

Books use a 1-5 priority system with color coding:
- **5** (Highest): Red badge
- **4**: Orange badge
- **3**: Yellow badge
- **2**: Light orange badge
- **1** (Lowest): Green badge

## 🌍 Internationalization

Toggle between English and Arabic using the language button in the header. The interface fully supports RTL layout for Arabic.

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (user/admin)
- SQL injection prevention
- Input validation

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users` - Get all users (admin only)

### Publishers
- `GET /api/publishers` - Get all publishers
- `POST /api/publishers` - Create publisher (admin)
- `PUT /api/publishers/:id` - Update publisher (admin)
- `DELETE /api/publishers/:id` - Delete publisher (admin)

### Books
- `GET /api/books` - Get all books (with optional search)
- `POST /api/books` - Create book (admin)
- `PUT /api/books/:id` - Update book (admin)
- `DELETE /api/books/:id` - Delete book (admin)

### Lists
- `GET /api/lists` - Get user's lists
- `GET /api/lists/public` - Get all public lists (admin)
- `POST /api/lists` - Create list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list
- `POST /api/lists/:id/books` - Add book to list
- `GET /api/lists/:id/books` - Get list books
- `PUT /api/lists/books/:id` - Update book in list
- `DELETE /api/lists/books/:id` - Remove book from list
- `POST /api/lists/merge` - Merge two lists

### Orders
- `GET /api/orders/admin-view` - Get admin view with filters (admin)
- `POST /api/orders/tracking` - Update book tracking (admin)
- `POST /api/orders` - Create order (admin)
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status (admin)

## 🛠️ Development

### Backend Structure
```
backend/
├── src/
│   ├── auth/          # Authentication module
│   ├── users/         # Users module
│   ├── publishers/    # Publishers module
│   ├── books/         # Books module
│   ├── lists/         # Lists module
│   ├── orders/        # Orders module
│   ├── database.ts    # Database setup
│   ├── app.module.ts  # Main app module
│   └── main.ts        # Entry point
└── bookfair.db        # SQLite database
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/    # Reusable components
│   ├── pages/         # Page components
│   ├── api.js         # API client
│   ├── i18n.js        # Internationalization
│   ├── App.jsx        # Main app component
│   └── main.jsx       # Entry point
└── index.html
```

## 🔄 Future Enhancements

- Real payment integration
- Real shipping integration
- Email notifications
- Advanced search and filtering
- Export reports (PDF/CSV)
- Mobile app
- Barcode scanning
- Book recommendations
- Bulk operations
- Analytics dashboard

## 📄 License

MIT

## 👥 Support

For issues or questions, please create an issue in the repository.

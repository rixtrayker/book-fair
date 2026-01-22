import { run } from './database';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await run(
    'INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    ['admin@bookfair.com', adminPassword, 'Admin User', 'admin']
  );

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  await run(
    'INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    ['user@bookfair.com', userPassword, 'Test User', 'user']
  );

  // Create publishers
  const publishers = [
    { name: 'Dar Al-Shorouk', hall: 'A', booth: '101' },
    { name: 'Nahdet Misr', hall: 'A', booth: '102' },
    { name: 'Dar Al-Adab', hall: 'B', booth: '201' },
    { name: 'Bloomsbury', hall: 'B', booth: '202' },
    { name: 'Penguin Random House', hall: 'C', booth: '301' },
  ];

  for (const pub of publishers) {
    await run(
      'INSERT OR IGNORE INTO publishers (name, hall_number, booth_number) VALUES (?, ?, ?)',
      [pub.name, pub.hall, pub.booth]
    );
  }

  // Create books
  const books = [
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '978-0062315007', publisher_id: 1, price: 150 },
    { title: '1984', author: 'George Orwell', isbn: '978-0451524935', publisher_id: 2, price: 120 },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0061120084', publisher_id: 3, price: 180 },
    { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0141439518', publisher_id: 4, price: 140 },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', publisher_id: 5, price: 160 },
    { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', isbn: '978-0060883287', publisher_id: 1, price: 200 },
    { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0316769174', publisher_id: 2, price: 130 },
    { title: 'Brave New World', author: 'Aldous Huxley', isbn: '978-0060850524', publisher_id: 3, price: 145 },
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0547928227', publisher_id: 4, price: 220 },
    { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', isbn: '978-0439708180', publisher_id: 5, price: 250 },
  ];

  for (const book of books) {
    await run(
      'INSERT OR IGNORE INTO books (title, author, isbn, publisher_id, original_price, category) VALUES (?, ?, ?, ?, ?, ?)',
      [book.title, book.author, book.isbn, book.publisher_id, book.price, 'Fiction']
    );
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('Admin: admin@bookfair.com / admin123');
  console.log('User: user@bookfair.com / user123');
}

seed().catch(console.error);

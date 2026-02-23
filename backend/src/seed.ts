import { run, initDatabase } from './database';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...');

  await initDatabase();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminResult = await run(
    "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id",
    ['admin@bookfair.com', adminPassword, 'Admin User', 'collector']
  );

  const userPassword = await bcrypt.hash('user123', 10);
  const userResult = await run(
    "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id",
    ['user@bookfair.com', userPassword, 'Test User', 'customer']
  );

  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  await run(
    "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id",
    ['superadmin@bookfair.com', superAdminPassword, 'Super Admin', 'super_admin']
  );

  const publishers = [
    { name: 'Dar Al-Shorouk', hall: 'A', booth: '101' },
    { name: 'Nahdet Misr', hall: 'A', booth: '102' },
    { name: 'Dar Al-Adab', hall: 'B', booth: '201' },
    { name: 'Bloomsbury', hall: 'B', booth: '202' },
    { name: 'Penguin Random House', hall: 'C', booth: '301' },
  ];

  for (const pub of publishers) {
    await run(
      'INSERT INTO publishers (name, hall_number, booth_number) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [pub.name, pub.hall, pub.booth]
    );
  }

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
      'INSERT INTO books (title, author, isbn, publisher_id, original_price, category) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
      [book.title, book.author, book.isbn, book.publisher_id, book.price, 'Fiction']
    );
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('Customer: user@bookfair.com / user123');
  console.log('Collector: admin@bookfair.com / admin123');
  console.log('Super Admin: superadmin@bookfair.com / superadmin123');
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

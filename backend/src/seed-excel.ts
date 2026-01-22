import { run, get, initDatabase } from './database';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';

async function seedFromExcel() {
  console.log('🌱 Seeding database from Excel...');
  
  await initDatabase();

  // Create users: Amr (user) and Mohamed (admin)
  const amrPassword = await bcrypt.hash('amr123', 10);
  const mohamedPassword = await bcrypt.hash('mohamed123', 10);
  
  await run('DELETE FROM users');
  await run(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    ['amr@bookfair.com', amrPassword, 'Amr', 'user']
  );
  await run(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    ['mohamed@bookfair.com', mohamedPassword, 'Mohamed', 'admin']
  );
  
  const amr = await get('SELECT * FROM users WHERE email = ?', ['amr@bookfair.com']);
  console.log('✅ Created users: Amr (user) and Mohamed (admin)');

  // Read Excel data
  const data = JSON.parse(fs.readFileSync('./seed-data.json', 'utf8'));
  console.log(`📚 Found ${data.length} books in Excel`);

  // Clear existing data
  await run('DELETE FROM order_books');
  await run('DELETE FROM orders');
  await run('DELETE FROM admin_book_tracking');
  await run('DELETE FROM list_books');
  await run('DELETE FROM lists');
  await run('DELETE FROM books');
  await run('DELETE FROM publishers');

  // Create publishers map
  const publishersMap = new Map();
  
  for (const row of data) {
    const publisherName = row['الدار'];
    if (publisherName && !publishersMap.has(publisherName)) {
      const hall = row['الصالة'] && row['الصالة'] !== '-' ? String(row['الصالة']) : null;
      const section = row['القسم'] && row['القسم'] !== '-' ? String(row['القسم']) : null;
      const booth = row['الرقم'] && row['الرقم'] !== '-' ? String(row['الرقم']) : null;
      
      const result = await run(
        'INSERT INTO publishers (name, hall_number, booth_number) VALUES (?, ?, ?)',
        [publisherName, hall, section && booth ? `${section}${booth}` : null]
      );
      publishersMap.set(publisherName, result.lastID);
    }
  }
  console.log(`✅ Created ${publishersMap.size} publishers`);

  // Create Amr's list
  const listResult = await run(
    'INSERT INTO lists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
    [amr.id, 'قائمة معرض الكتاب 2026', 'كتب معرض القاهرة الدولي للكتاب', 1]
  );
  const listId = listResult.lastID;
  console.log('✅ Created list for Amr');

  // Add books
  let booksAdded = 0;
  let privateBooks = 0;
  
  for (const row of data) {
    const title = row['الكتاب'];
    const publisherName = row['الدار'];
    const publisherId = publishersMap.get(publisherName);
    const hasCheckmark = row['الحالة'] === '✅';
    const action = row['استعلام عن السعر'];
    
    if (!title) continue;

    // Create book
    const bookResult = await run(
      'INSERT INTO books (title, publisher_id, category, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [title, publisherId || null, 'كتب']
    );
    const bookId = bookResult.lastID;

    // Determine status and priority
    let status = 'want';
    let priority = 3;
    
    if (action === 'شراء') {
      status = 'want';
      priority = 5;
    } else if (action === 'سعر') {
      status = 'maybe';
      priority = 3;
    }

    // Add to list with publisher name in notes
    const notes = `الناشر: ${publisherName || 'غير محدد'}`;
    await run(
      'INSERT INTO list_books (list_id, book_id, status, priority, notes) VALUES (?, ?, ?, ?, ?)',
      [listId, bookId, status, priority, notes]
    );
    
    booksAdded++;
    if (hasCheckmark) privateBooks++;
  }

  console.log(`✅ Added ${booksAdded} books to list`);
  console.log(`📌 ${privateBooks} books marked with ✅ (highlighted)`);

  // Create a private list for highlighted books
  const privateListResult = await run(
    'INSERT INTO lists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
    [amr.id, 'كتب مميزة', 'الكتب المحددة بعلامة ✅', 0]
  );
  const privateListId = privateListResult.lastID;

  // Add highlighted books to private list
  for (const row of data) {
    const hasCheckmark = row['الحالة'] === '✅';
    if (!hasCheckmark) continue;

    const title = row['الكتاب'];
    const publisherName = row['الدار'];
    const action = row['استعلام عن السعر'];
    
    if (!title) continue;

    const book = await get('SELECT * FROM books WHERE title = ?', [title]);
    if (!book) continue;

    let status = action === 'شراء' ? 'want' : 'maybe';
    let priority = action === 'شراء' ? 5 : 4;
    const notes = `الناشر: ${publisherName || 'غير محدد'}`;

    await run(
      'INSERT INTO list_books (list_id, book_id, status, priority, notes) VALUES (?, ?, ?, ?, ?)',
      [privateListId, book.id, status, priority, notes]
    );
  }

  console.log(`✅ Created private list with ${privateBooks} highlighted books`);
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Login credentials:');
  console.log('   User: amr@bookfair.com / amr123');
  console.log('   Admin: mohamed@bookfair.com / mohamed123');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - ${publishersMap.size} publishers`);
  console.log(`   - ${booksAdded} books`);
  console.log(`   - 2 lists (1 public, 1 private)`);
  console.log(`   - ${privateBooks} highlighted books in private list`);
}

seedFromExcel().catch(console.error).finally(() => process.exit(0));

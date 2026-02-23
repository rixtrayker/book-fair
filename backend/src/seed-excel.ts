import { run, get, all, initDatabase } from './database';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';

async function seedFromExcel() {
  console.log('🌱 Seeding database from Excel...');
  
  await initDatabase();

  const amrPassword = await bcrypt.hash('amr123', 10);
  const mohamedPassword = await bcrypt.hash('mohamed123', 10);
  
  await run('DELETE FROM order_books');
  await run('DELETE FROM orders');
  await run('DELETE FROM admin_book_tracking');
  await run('DELETE FROM list_books');
  await run('DELETE FROM lists');
  await run('DELETE FROM books');
  await run('DELETE FROM publishers');
  await run('DELETE FROM notifications');
  await run('DELETE FROM users WHERE email IN ($1, $2)', ['amr@bookfair.com', 'mohamed@bookfair.com']);
  
  const amrResult = await run(
    'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
    ['amr@bookfair.com', amrPassword, 'Amr', 'customer']
  );
  const amrId = amrResult.rows[0].id;
  
  const mohamedResult = await run(
    'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
    ['mohamed@bookfair.com', mohamedPassword, 'Mohamed', 'collector']
  );
  const mohamedId = mohamedResult.rows[0].id;
  
  console.log('✅ Created users: Amr (customer) and Mohamed (collector)');

  const data = JSON.parse(fs.readFileSync('./seed-data.json', 'utf8'));
  console.log(`📚 Found ${data.length} books in Excel`);

  const publishersMap = new Map();
  
  for (const row of data) {
    const publisherName = row['الدار'];
    if (publisherName && !publishersMap.has(publisherName)) {
      const hall = row['الصالة'] && row['الصالة'] !== '-' ? String(row['الصالة']) : null;
      const section = row['القسم'] && row['القسم'] !== '-' ? String(row['القسم']) : null;
      const booth = row['الرقم'] && row['الرقم'] !== '-' ? String(row['الرقم']) : null;
      
      const result = await run(
        'INSERT INTO publishers (name, hall_number, booth_number) VALUES ($1, $2, $3) RETURNING id',
        [publisherName, hall, section && booth ? `${section}${booth}` : null]
      );
      publishersMap.set(publisherName, result.rows[0].id);
    }
  }
  console.log(`✅ Created ${publishersMap.size} publishers`);

  const listResult = await run(
    "INSERT INTO lists (user_id, name, description, visibility) VALUES ($1, $2, $3, $4) RETURNING id",
    [amrId, 'قائمة معرض الكتاب 2026', 'كتب معرض القاهرة الدولي للكتاب', 'public']
  );
  const listId = listResult.rows[0].id;
  console.log('✅ Created list for Amr');

  let booksAdded = 0;
  let privateBooks = 0;
  
  for (const row of data) {
    const title = row['الكتاب'];
    const publisherName = row['الدار'];
    const publisherId = publishersMap.get(publisherName);
    const hasCheckmark = row['الحالة'] === '✅';
    const action = row['استعلام عن السعر'];
    
    if (!title) continue;

    const bookResult = await run(
      'INSERT INTO books (title, publisher_id, category, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
      [title, publisherId || null, 'كتب']
    );
    const bookId = bookResult.rows[0].id;

    let status = 'pending';
    let priority = 3;
    
    if (action === 'شراء') {
      status = 'pending';
      priority = 5;
    } else if (action === 'سعر') {
      status = 'pending';
      priority = 3;
    }

    const notes = `الناشر: ${publisherName || 'غير محدد'}`;
    await run(
      'INSERT INTO list_books (list_id, book_id, status, priority, notes) VALUES ($1, $2, $3, $4, $5)',
      [listId, bookId, status, priority, notes]
    );
    
    booksAdded++;
    if (hasCheckmark) privateBooks++;
  }

  console.log(`✅ Added ${booksAdded} books to list`);
  console.log(`📌 ${privateBooks} books marked with ✅ (highlighted)`);

  const privateListResult = await run(
    "INSERT INTO lists (user_id, name, description, visibility) VALUES ($1, $2, $3, $4) RETURNING id",
    [amrId, 'كتب مميزة', 'الكتب المحددة بعلامة ✅', 'private']
  );
  const privateListId = privateListResult.rows[0].id;

  for (const row of data) {
    const hasCheckmark = row['الحالة'] === '✅';
    if (!hasCheckmark) continue;

    const title = row['الكتاب'];
    const publisherName = row['الدار'];
    const action = row['استعلام عن السعر'];
    
    if (!title) continue;

    const book = await get('SELECT * FROM books WHERE title = $1', [title]);
    if (!book) continue;

    let status = action === 'شراء' ? 'pending' : 'pending';
    let priority = action === 'شراء' ? 5 : 4;
    const notes = `الناشر: ${publisherName || 'غير محدد'}`;

    await run(
      'INSERT INTO list_books (list_id, book_id, status, priority, notes) VALUES ($1, $2, $3, $4, $5)',
      [privateListId, book.id, status, priority, notes]
    );
  }

  console.log(`✅ Created private list with ${privateBooks} highlighted books`);
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Login credentials:');
  console.log('   Customer: amr@bookfair.com / amr123');
  console.log('   Collector: mohamed@bookfair.com / mohamed123');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - ${publishersMap.size} publishers`);
  console.log(`   - ${booksAdded} books`);
  console.log(`   - 2 lists (1 public, 1 private)`);
  console.log(`   - ${privateBooks} highlighted books in private list`);
  
  process.exit(0);
}

seedFromExcel().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

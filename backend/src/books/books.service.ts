import { Injectable, NotFoundException } from '@nestjs/common';
import { all, get, run, withTransaction } from '../database';
import { CreateBookDto, UpdateBookDto } from './books.dto';

function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[\u0622\u0623]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .toLowerCase();
}

@Injectable()
export class BooksService {
  async create(dto: CreateBookDto) {
    const titleNormalized = normalizeArabic(dto.title);
    const authorNormalized = dto.author ? normalizeArabic(dto.author) : null;
    
    const result = await run(
      `INSERT INTO books (title, title_normalized, author, author_normalized, isbn, publisher_id, original_price, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [dto.title, titleNormalized, dto.author, authorNormalized, dto.isbn, dto.publisher_id, dto.original_price, dto.category]
    );
    return await this.findOne(result.rows[0].id);
  }

  async findAll(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const books = await all(`
      SELECT b.*, p.name as publisher_name, p.booth_number, p.hall_number 
      FROM books b 
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.deleted_at IS NULL
      ORDER BY b.title
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await get('SELECT COUNT(*) as total FROM books WHERE deleted_at IS NULL');
    return {
      data: books,
      pagination: {
        total: parseInt(countResult.total, 10),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.total, 10) / limit)
      }
    };
  }

  async findOne(id: number) {
    const book = await get(`
      SELECT b.*, p.name as publisher_name, p.booth_number, p.hall_number 
      FROM books b 
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.id = $1 AND b.deleted_at IS NULL
    `, [id]);
    
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async search(query: string, limit: number = 20) {
    const normalizedQuery = normalizeArabic(query);
    return await all(`
      SELECT b.*, p.name as publisher_name, p.booth_number, p.hall_number 
      FROM books b 
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.deleted_at IS NULL
        AND (b.title ILIKE $1 OR b.title_normalized ILIKE $2 OR b.author ILIKE $3 OR b.author_normalized ILIKE $4 OR b.isbn ILIKE $5)
      ORDER BY 
        CASE WHEN b.title = $6 THEN 0 ELSE 1 END,
        CASE WHEN b.title ILIKE $7 THEN 0 ELSE 1 END,
        b.title
      LIMIT $8
    `, [`%${query}%`, `%${normalizedQuery}%`, `%${query}%`, `%${normalizedQuery}%`, `%${query}%`, query, `${query}%`, limit]);
  }

  async update(id: number, dto: UpdateBookDto) {
    const book = await get('SELECT * FROM books WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (dto.title) {
      fields.push(`title = $${paramIndex++}`, `title_normalized = $${paramIndex++}`);
      values.push(dto.title, normalizeArabic(dto.title));
    }
    if (dto.author !== undefined) {
      fields.push(`author = $${paramIndex++}`, `author_normalized = $${paramIndex++}`);
      values.push(dto.author, dto.author ? normalizeArabic(dto.author) : null);
    }
    if (dto.isbn !== undefined) { fields.push(`isbn = $${paramIndex++}`); values.push(dto.isbn); }
    if (dto.publisher_id !== undefined) { fields.push(`publisher_id = $${paramIndex++}`); values.push(dto.publisher_id); }
    if (dto.original_price !== undefined) { fields.push(`original_price = $${paramIndex++}`); values.push(dto.original_price); }
    if (dto.category !== undefined) { fields.push(`category = $${paramIndex++}`); values.push(dto.category); }
    
    if (fields.length === 0) {
      return this.findOne(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    await run(`UPDATE books SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return await this.findOne(id);
  }

  async remove(id: number) {
    return withTransaction(async (client) => {
      const book = await get(
        'SELECT * FROM books WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      if (!book) {
        throw new NotFoundException('Book not found');
      }

      const affectedData = await all(`
        SELECT 
          l.user_id,
          lb.assigned_collector_id,
          lb.id as list_book_id,
          l.id as list_id,
          l.name as list_name
        FROM list_books lb
        JOIN lists l ON lb.list_id = l.id
        WHERE lb.book_id = $1 AND lb.deleted_at IS NULL
      `, [id]);

      const usersToNotify = new Map<number, any[]>();
      const collectorsToNotify = new Map<number, any[]>();
      
      affectedData.forEach((row: any) => {
        if (row.user_id) {
          if (!usersToNotify.has(row.user_id)) usersToNotify.set(row.user_id, []);
          usersToNotify.get(row.user_id)!.push({
            listId: row.list_id,
            listName: row.list_name,
            bookTitle: book.title
          });
        }
        if (row.assigned_collector_id) {
          if (!collectorsToNotify.has(row.assigned_collector_id)) {
            collectorsToNotify.set(row.assigned_collector_id, []);
          }
          collectorsToNotify.get(row.assigned_collector_id)!.push({
            bookTitle: book.title
          });
        }
      });

      await client.query(
        'UPDATE list_books SET deleted_at = CURRENT_TIMESTAMP WHERE book_id = $1',
        [id]
      );

      await client.query(
        'UPDATE books SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      for (const [userId, items] of usersToNotify) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, payload) VALUES ($1, $2, $3, $4, $5)`,
          [userId, 'book_deleted', 'تم حذف كتاب من قائمتك', `تم حذف "${items[0].bookTitle}" من قائمتك`, JSON.stringify({ bookId: id, affectedLists: items })]
        );
      }

      for (const [collectorId, items] of collectorsToNotify) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, payload) VALUES ($1, $2, $3, $4, $5)`,
          [collectorId, 'book_deleted', 'تم حذف كتاب كان معين لك', `تم حذف "${items[0].bookTitle}" من النظام`, JSON.stringify({ bookId: id })]
        );
      }

      return { 
        deleted: true, 
        affectedUsers: usersToNotify.size,
        affectedCollectors: collectorsToNotify.size 
      };
    });
  }

  async restore(id: number) {
    return withTransaction(async (client) => {
      const book = await get('SELECT * FROM books WHERE id = $1', [id]);
      if (!book) {
        throw new NotFoundException('Book not found');
      }
      if (!book.deleted_at) {
        return { restored: false, message: 'Book is not deleted' };
      }

      await client.query(
        'UPDATE books SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      
      await client.query(
        'UPDATE list_books SET deleted_at = NULL WHERE book_id = $1',
        [id]
      );
      
      return { restored: true };
    });
  }
}

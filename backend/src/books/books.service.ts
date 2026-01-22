import { Injectable } from '@nestjs/common';
import { all, get, run } from '../database';
import { CreateBookDto, UpdateBookDto } from './books.dto';

@Injectable()
export class BooksService {
  async create(dto: CreateBookDto) {
    const result = await run(
      'INSERT INTO books (title, author, isbn, publisher_id, original_price, category) VALUES (?, ?, ?, ?, ?, ?)',
      [dto.title, dto.author, dto.isbn, dto.publisher_id, dto.original_price, dto.category]
    );
    return await this.findOne(result.lastID);
  }

  async findAll() {
    return await all(`
      SELECT b.*, p.name as publisher_name, p.booth_number, p.hall_number 
      FROM books b 
      LEFT JOIN publishers p ON b.publisher_id = p.id
      ORDER BY b.title
    `);
  }

  async findOne(id: number) {
    return await get(`
      SELECT b.*, p.name as publisher_name, p.booth_number, p.hall_number 
      FROM books b 
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.id = ?
    `, [id]);
  }

  async search(query: string) {
    return await all(`
      SELECT b.*, p.name as publisher_name, p.booth_number, p.hall_number 
      FROM books b 
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);
  }

  async update(id: number, dto: UpdateBookDto) {
    const fields = [];
    const values = [];
    
    if (dto.title) { fields.push('title = ?'); values.push(dto.title); }
    if (dto.author !== undefined) { fields.push('author = ?'); values.push(dto.author); }
    if (dto.isbn !== undefined) { fields.push('isbn = ?'); values.push(dto.isbn); }
    if (dto.publisher_id) { fields.push('publisher_id = ?'); values.push(dto.publisher_id); }
    if (dto.original_price) { fields.push('original_price = ?'); values.push(dto.original_price); }
    if (dto.category !== undefined) { fields.push('category = ?'); values.push(dto.category); }
    
    values.push(id);
    await run(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findOne(id);
  }

  async remove(id: number) {
    await run('DELETE FROM books WHERE id = ?', [id]);
    return { deleted: true };
  }
}

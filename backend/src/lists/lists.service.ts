import { Injectable, ForbiddenException } from '@nestjs/common';
import { all, get, run } from '../database';
import { CreateListDto, UpdateListDto, AddBookToListDto, UpdateListBookDto, MergeListsDto } from './lists.dto';

@Injectable()
export class ListsService {
  async create(userId: number, dto: CreateListDto) {
    const result = await run(
      'INSERT INTO lists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
      [userId, dto.name, dto.description, dto.is_public ? 1 : 0]
    );
    return await this.findOne(result.lastID, userId);
  }

  async findAll(userId: number) {
    return await all('SELECT * FROM lists WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }

  async findPublicLists() {
    return await all(`
      SELECT l.*, u.name as user_name, u.email as user_email
      FROM lists l
      JOIN users u ON l.user_id = u.id
      WHERE l.is_public = 1
      ORDER BY l.created_at DESC
    `);
  }

  async findOne(id: number, userId: number) {
    const list = await get('SELECT * FROM lists WHERE id = ?', [id]);
    if (!list) throw new ForbiddenException('List not found');
    if (list.user_id !== userId && !list.is_public) throw new ForbiddenException('Access denied');
    return list;
  }

  async update(id: number, userId: number, dto: UpdateListDto) {
    const list = await get('SELECT * FROM lists WHERE id = ? AND user_id = ?', [id, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');

    const fields = [];
    const values = [];
    
    if (dto.name) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.description !== undefined) { fields.push('description = ?'); values.push(dto.description); }
    if (dto.is_public !== undefined) { fields.push('is_public = ?'); values.push(dto.is_public ? 1 : 0); }
    
    values.push(id);
    await run(`UPDATE lists SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    const list = await get('SELECT * FROM lists WHERE id = ? AND user_id = ?', [id, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');
    
    await run('DELETE FROM lists WHERE id = ?', [id]);
    return { deleted: true };
  }

  async addBook(listId: number, userId: number, dto: AddBookToListDto) {
    const list = await get('SELECT * FROM lists WHERE id = ? AND user_id = ?', [listId, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');

    const result = await run(
      'INSERT INTO list_books (list_id, book_id, status, priority, notes) VALUES (?, ?, ?, ?, ?)',
      [listId, dto.book_id, dto.status || 'want', dto.priority || 3, dto.notes]
    );
    return await get('SELECT * FROM list_books WHERE id = ?', [result.lastID]);
  }

  async getListBooks(listId: number, userId: number) {
    const list = await this.findOne(listId, userId);
    
    return await all(`
      SELECT lb.*, b.title, b.author, b.isbn, b.original_price, b.category,
             p.name as publisher_name, p.booth_number, p.hall_number,
             abt.search_status, abt.actual_price, abt.discount_amount, abt.notes as admin_notes
      FROM list_books lb
      JOIN books b ON lb.book_id = b.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN admin_book_tracking abt ON lb.id = abt.list_book_id
      WHERE lb.list_id = ?
      ORDER BY lb.priority DESC, lb.created_at
    `, [listId]);
  }

  async updateListBook(listBookId: number, userId: number, dto: UpdateListBookDto) {
    const listBook = await get(`
      SELECT lb.* FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      WHERE lb.id = ? AND l.user_id = ?
    `, [listBookId, userId]);
    
    if (!listBook) throw new ForbiddenException('Book not found or access denied');

    const fields = [];
    const values = [];
    
    if (dto.status) { fields.push('status = ?'); values.push(dto.status); }
    if (dto.priority) { fields.push('priority = ?'); values.push(dto.priority); }
    if (dto.notes !== undefined) { fields.push('notes = ?'); values.push(dto.notes); }
    
    values.push(listBookId);
    await run(`UPDATE list_books SET ${fields.join(', ')} WHERE id = ?`, values);
    return await get('SELECT * FROM list_books WHERE id = ?', [listBookId]);
  }

  async removeListBook(listBookId: number, userId: number) {
    const listBook = await get(`
      SELECT lb.* FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      WHERE lb.id = ? AND l.user_id = ?
    `, [listBookId, userId]);
    
    if (!listBook) throw new ForbiddenException('Book not found or access denied');
    
    await run('DELETE FROM list_books WHERE id = ?', [listBookId]);
    return { deleted: true };
  }

  async mergeLists(userId: number, dto: MergeListsDto) {
    const sourceList = await get('SELECT * FROM lists WHERE id = ? AND user_id = ?', [dto.source_list_id, userId]);
    const targetList = await get('SELECT * FROM lists WHERE id = ? AND user_id = ?', [dto.target_list_id, userId]);
    
    if (!sourceList || !targetList) throw new ForbiddenException('Lists not found or access denied');

    await run('UPDATE list_books SET list_id = ? WHERE list_id = ?', [dto.target_list_id, dto.source_list_id]);
    await run('DELETE FROM lists WHERE id = ?', [dto.source_list_id]);
    
    return await this.findOne(dto.target_list_id, userId);
  }
}

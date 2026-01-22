import { Injectable } from '@nestjs/common';
import { all, get, run } from '../database';
import { UpdateTrackingDto, CreateOrderDto, UpdateOrderDto } from './orders.dto';

@Injectable()
export class OrdersService {
  async updateTracking(adminId: number, dto: UpdateTrackingDto) {
    const existing = await get(
      'SELECT * FROM admin_book_tracking WHERE list_book_id = ?',
      [dto.list_book_id]
    );

    if (existing) {
      const fields = [];
      const values = [];
      
      if (dto.search_status) { fields.push('search_status = ?'); values.push(dto.search_status); }
      if (dto.actual_price !== undefined) { fields.push('actual_price = ?'); values.push(dto.actual_price); }
      if (dto.discount_amount !== undefined) { fields.push('discount_amount = ?'); values.push(dto.discount_amount); }
      if (dto.notes !== undefined) { fields.push('notes = ?'); values.push(dto.notes); }
      fields.push('updated_at = CURRENT_TIMESTAMP');
      
      values.push(existing.id);
      await run(`UPDATE admin_book_tracking SET ${fields.join(', ')} WHERE id = ?`, values);
      return await get('SELECT * FROM admin_book_tracking WHERE id = ?', [existing.id]);
    } else {
      const result = await run(
        'INSERT INTO admin_book_tracking (list_book_id, admin_id, search_status, actual_price, discount_amount, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [dto.list_book_id, adminId, dto.search_status || 'searching', dto.actual_price, dto.discount_amount || 0, dto.notes]
      );
      return await get('SELECT * FROM admin_book_tracking WHERE id = ?', [result.lastID]);
    }
  }

  async getAdminView(filters?: { hall?: string; booth?: string; priority?: number; status?: string }) {
    let query = `
      SELECT lb.id as list_book_id, lb.status, lb.priority, lb.notes as user_notes,
             b.title, b.author, b.isbn, b.original_price, b.category,
             p.name as publisher_name, p.booth_number, p.hall_number,
             l.name as list_name, l.id as list_id,
             u.name as user_name, u.email as user_email, u.id as user_id,
             abt.search_status, abt.actual_price, abt.discount_amount, abt.notes as admin_notes
      FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      JOIN users u ON l.user_id = u.id
      JOIN books b ON lb.book_id = b.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN admin_book_tracking abt ON lb.id = abt.list_book_id
      WHERE l.is_public = 1
    `;

    const params = [];
    
    if (filters?.hall) {
      query += ' AND p.hall_number = ?';
      params.push(filters.hall);
    }
    if (filters?.booth) {
      query += ' AND p.booth_number = ?';
      params.push(filters.booth);
    }
    if (filters?.priority) {
      query += ' AND lb.priority = ?';
      params.push(filters.priority);
    }
    if (filters?.status) {
      query += ' AND lb.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY lb.priority DESC, p.hall_number, p.booth_number';
    
    return await all(query, params);
  }

  async createOrder(adminId: number, dto: CreateOrderDto) {
    const result = await run(
      'INSERT INTO orders (user_id, admin_id, shipping_status) VALUES (?, ?, ?)',
      [dto.user_id, adminId, 'pending']
    );
    
    const orderId = result.lastID;
    let totalPrice = 0;

    for (const listBookId of dto.list_book_ids) {
      const tracking = await get(
        'SELECT actual_price FROM admin_book_tracking WHERE list_book_id = ?',
        [listBookId]
      );
      
      const price = tracking?.actual_price || 0;
      totalPrice += price;

      await run(
        'INSERT INTO order_books (order_id, list_book_id, actual_price) VALUES (?, ?, ?)',
        [orderId, listBookId, price]
      );
    }

    await run('UPDATE orders SET total_price = ? WHERE id = ?', [totalPrice, orderId]);
    
    return await this.getOrder(orderId);
  }

  async getOrder(id: number) {
    const order = await get(`
      SELECT o.*, u.name as user_name, u.email as user_email,
             a.name as admin_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.admin_id = a.id
      WHERE o.id = ?
    `, [id]);

    const books = await all(`
      SELECT ob.*, lb.status, lb.priority,
             b.title, b.author, b.isbn
      FROM order_books ob
      JOIN list_books lb ON ob.list_book_id = lb.id
      JOIN books b ON lb.book_id = b.id
      WHERE ob.order_id = ?
    `, [id]);

    return { ...order, books };
  }

  async getUserOrders(userId: number) {
    return await all(`
      SELECT o.*, a.name as admin_name
      FROM orders o
      LEFT JOIN users a ON o.admin_id = a.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);
  }

  async getAllOrders() {
    return await all(`
      SELECT o.*, u.name as user_name, u.email as user_email,
             a.name as admin_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.admin_id = a.id
      ORDER BY o.created_at DESC
    `);
  }

  async updateOrder(id: number, dto: UpdateOrderDto) {
    await run('UPDATE orders SET shipping_status = ? WHERE id = ?', [dto.shipping_status, id]);
    return await this.getOrder(id);
  }
}

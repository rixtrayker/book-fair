import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { all, get, run, withTransaction } from '../database';
import { UpdateTrackingDto, CreateOrderDto, UpdateOrderDto, AssignCollectorDto } from './orders.dto';
import { UserRole } from '../common/constants';
import { IUser } from '../common/interfaces';

@Injectable()
export class OrdersService {
  async updateTracking(adminId: number, dto: UpdateTrackingDto, lang: string) {
    const existing = await get(
      'SELECT * FROM admin_book_tracking WHERE list_book_id = $1',
      [dto.list_book_id]
    );

    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (dto.search_status) { fields.push(`search_status = $${paramIndex++}`); values.push(dto.search_status); }
      if (dto.actual_price !== undefined) { fields.push(`actual_price = $${paramIndex++}`); values.push(dto.actual_price); }
      if (dto.discount_amount !== undefined) { fields.push(`discount_amount = $${paramIndex++}`); values.push(dto.discount_amount); }
      if (dto.notes !== undefined) { fields.push(`notes = $${paramIndex++}`); values.push(dto.notes); }
      fields.push('updated_at = CURRENT_TIMESTAMP');
      
      values.push(existing.id);
      await run(`UPDATE admin_book_tracking SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
      return await get('SELECT * FROM admin_book_tracking WHERE id = $1', [existing.id]);
    } else {
      const result = await run(
        'INSERT INTO admin_book_tracking (list_book_id, admin_id, search_status, actual_price, discount_amount, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [dto.list_book_id, adminId, dto.search_status || 'searching', dto.actual_price, dto.discount_amount || 0, dto.notes]
      );
      return await get('SELECT * FROM admin_book_tracking WHERE id = $1', [result.rows[0].id]);
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
      WHERE l.visibility = 'public' AND lb.deleted_at IS NULL AND l.deleted_at IS NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters?.hall) {
      query += ` AND p.hall_number = $${paramIndex++}`;
      params.push(filters.hall);
    }
    if (filters?.booth) {
      query += ` AND p.booth_number = $${paramIndex++}`;
      params.push(filters.booth);
    }
    if (filters?.priority) {
      query += ` AND lb.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }
    if (filters?.status) {
      query += ` AND lb.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    query += ' ORDER BY lb.priority DESC, p.hall_number, p.booth_number';
    
    return await all(query, params);
  }

  async createOrder(adminId: number, dto: CreateOrderDto, lang: string) {
    return withTransaction(async (client) => {
      const placeholders = dto.list_book_ids.map((_, i) => `$${i + 1}`).join(',');
      const listBooks = await all(
        `
          SELECT lb.id, l.user_id, l.visibility
          FROM list_books lb
          JOIN lists l ON lb.list_id = l.id
          WHERE lb.id IN (${placeholders})
          AND lb.deleted_at IS NULL AND l.deleted_at IS NULL
        `,
        dto.list_book_ids
      );

      if (listBooks.length !== dto.list_book_ids.length) {
        throw new NotFoundException('One or more books not found');
      }

      const hasOtherUser = listBooks.some((row: any) => row.user_id !== dto.user_id);
      if (hasOtherUser) {
        throw new BadRequestException('All books must belong to the same user');
      }

      const result = await client.query(
        'INSERT INTO orders (user_id, admin_id, shipping_status) VALUES ($1, $2, $3) RETURNING id',
        [dto.user_id, adminId, 'pending']
      );

      const orderId = result.rows[0].id;
      let totalPrice = 0;

      for (const listBookId of dto.list_book_ids) {
        const tracking = await get(
          'SELECT actual_price FROM admin_book_tracking WHERE list_book_id = $1',
          [listBookId]
        );

        const price = tracking?.actual_price || 0;
        totalPrice += price;

        await client.query(
          'INSERT INTO order_books (order_id, list_book_id, actual_price) VALUES ($1, $2, $3)',
          [orderId, listBookId, price]
        );

        await client.query(
          "UPDATE list_books SET status = 'sourced', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [listBookId]
        );
      }

      await client.query('UPDATE orders SET total_price = $1 WHERE id = $2', [totalPrice, orderId]);

      return await this.getOrder(orderId);
    });
  }

  async getOrder(id: number) {
    const order = await get(`
      SELECT o.*, u.name as user_name, u.email as user_email,
             a.name as admin_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.admin_id = a.id
      WHERE o.id = $1 AND o.deleted_at IS NULL
    `, [id]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const books = await all(`
      SELECT ob.*, lb.status, lb.priority,
             b.title, b.author, b.isbn
      FROM order_books ob
      JOIN list_books lb ON ob.list_book_id = lb.id
      JOIN books b ON lb.book_id = b.id
      WHERE ob.order_id = $1
    `, [id]);

    return { ...order, books };
  }

  async getOrderWithAccessCheck(id: number, user: IUser, lang: string) {
    const order = await get(`
      SELECT o.*, u.name as user_name, u.email as user_email,
             a.name as admin_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN users a ON o.admin_id = a.id
      WHERE o.id = $1 AND o.deleted_at IS NULL
    `, [id]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return this.getOrder(id);
    }

    if (user.role === UserRole.CUSTOMER && order.user_id !== user.userId) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === UserRole.COLLECTOR) {
      if (order.visibility !== 'public' && 
          order.assigned_collector_id !== user.userId &&
          order.admin_id !== user.userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.getOrder(id);
  }

  async getUserOrders(userId: number) {
    return await all(`
      SELECT o.*, a.name as admin_name
      FROM orders o
      LEFT JOIN users a ON o.admin_id = a.id
      WHERE o.user_id = $1 AND o.deleted_at IS NULL
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
      WHERE o.deleted_at IS NULL
      ORDER BY o.created_at DESC
    `);
  }

  async updateOrder(id: number, dto: UpdateOrderDto, lang: string) {
    const order = await get('SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.shipping_status) {
      fields.push(`shipping_status = $${paramIndex++}`);
      values.push(dto.shipping_status);
    }
    if (dto.shipping_notes !== undefined) {
      fields.push(`shipping_notes = $${paramIndex++}`);
      values.push(dto.shipping_notes);
    }
    if (dto.shipping_tracking_serial !== undefined) {
      fields.push(`shipping_tracking_serial = $${paramIndex++}`);
      values.push(dto.shipping_tracking_serial);
    }

    if (dto.shipping_status === 'shipped') {
      fields.push('shipped_at = CURRENT_TIMESTAMP');
    }
    if (dto.shipping_status === 'delivered') {
      fields.push('delivered_at = CURRENT_TIMESTAMP');
    }

    if (fields.length === 0) {
      return this.getOrder(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await run(`UPDATE orders SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return await this.getOrder(id);
  }

  async assignCollector(orderId: number, collectorId: number, lang: string) {
    const order = await get('SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL', [orderId]);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const collector = await get(
      "SELECT id FROM users WHERE id = $1 AND role IN ('collector', 'super_admin') AND deleted_at IS NULL",
      [collectorId]
    );
    if (!collector) {
      throw new NotFoundException('Collector not found');
    }

    await run(
      'UPDATE orders SET assigned_collector_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [collectorId, orderId]
    );

    return this.getOrder(orderId);
  }

  async unassignCollector(orderId: number, lang: string) {
    const order = await get('SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL', [orderId]);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await run(
      'UPDATE orders SET assigned_collector_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [orderId]
    );

    return this.getOrder(orderId);
  }
}

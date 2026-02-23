import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { all, get, run, withTransaction } from '../database';
import { CreateListDto, UpdateListDto, AddBookToListDto, UpdateListBookDto, MergeListsDto, InviteCollectorDto, AssignCollectorDto } from './lists.dto';
import { UserRole, ListBookStatus, isValidStatusTransition } from '../common/constants';
import { IUser } from '../common/interfaces';
import { randomUUID } from 'crypto';

@Injectable()
export class ListsService {
  async create(userId: number, dto: CreateListDto) {
    const shareToken = dto.visibility === 'public' ? randomUUID() : null;
    const result = await run(
      `INSERT INTO lists (user_id, name, description, visibility, share_token) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, dto.name, dto.description, dto.visibility || 'private', shareToken]
    );
    return await this.findOne(result.rows[0].id, userId);
  }

  async findAll(userId: number) {
    return await all(
      'SELECT * FROM lists WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [userId]
    );
  }

  async findPublicLists(user: IUser) {
    return await all(`
      SELECT l.*, u.name as user_name, u.email as user_email
      FROM lists l
      JOIN users u ON l.user_id = u.id
      WHERE l.visibility = 'public' AND l.deleted_at IS NULL AND u.deleted_at IS NULL
      ORDER BY l.created_at DESC
    `);
  }

  async findByShareToken(shareToken: string, user: IUser) {
    const list = await get(
      'SELECT l.*, u.name as user_name, u.email as user_email FROM lists l JOIN users u ON l.user_id = u.id WHERE l.share_token = $1 AND l.deleted_at IS NULL',
      [shareToken]
    );
    if (!list) throw new NotFoundException('List not found');
    return list;
  }

  async findOne(id: number, userId: number) {
    const list = await get('SELECT * FROM lists WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!list) throw new NotFoundException('List not found');
    if (list.user_id !== userId && list.visibility !== 'public') {
      throw new ForbiddenException('Access denied');
    }
    return list;
  }

  async findOneWithAccess(id: number, user: IUser) {
    const list = await get('SELECT * FROM lists WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!list) throw new NotFoundException('List not found');

    if (user.role === UserRole.SUPER_ADMIN) return list;
    if (list.user_id === user.userId) return list;
    if (list.visibility === 'public') return list;

    if (user.role === UserRole.COLLECTOR) {
      const invitation = await get(
        'SELECT * FROM list_invitations WHERE list_id = $1 AND collector_id = $2 AND status = $3',
        [id, user.userId, 'accepted']
      );
      if (invitation) return list;

      const assignedBook = await get(
        'SELECT id FROM list_books WHERE list_id = $1 AND assigned_collector_id = $2 AND deleted_at IS NULL',
        [id, user.userId]
      );
      if (assignedBook) return list;
    }

    throw new ForbiddenException('Access denied');
  }

  async update(id: number, userId: number, dto: UpdateListDto) {
    const list = await get('SELECT * FROM lists WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [id, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (dto.name) { fields.push(`name = $${paramIndex++}`); values.push(dto.name); }
    if (dto.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(dto.description); }
    if (dto.visibility !== undefined) {
      fields.push(`visibility = $${paramIndex++}`);
      values.push(dto.visibility);
      if (dto.visibility === 'public' && !list.share_token) {
        fields.push(`share_token = $${paramIndex++}`);
        values.push(randomUUID());
      }
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await run(`UPDATE lists SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return await this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    const list = await get('SELECT * FROM lists WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [id, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');
    
    await run('UPDATE lists SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    return { deleted: true };
  }

  async addBook(listId: number, userId: number, dto: AddBookToListDto) {
    const list = await get('SELECT * FROM lists WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [listId, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');

    const existing = await get(
      'SELECT id FROM list_books WHERE list_id = $1 AND book_id = $2 AND deleted_at IS NULL',
      [listId, dto.book_id]
    );
    if (existing) {
      throw new BadRequestException('Book already exists in this list');
    }

    const result = await run(
      `INSERT INTO list_books (list_id, book_id, status, priority, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [listId, dto.book_id, dto.status || ListBookStatus.PENDING, dto.priority || 3, dto.notes]
    );
    return await get('SELECT * FROM list_books WHERE id = $1', [result.rows[0].id]);
  }

  async getListBooks(listId: number, user: IUser) {
    await this.findOneWithAccess(listId, user);
    
    let query = `
      SELECT lb.*, b.title, b.author, b.isbn, b.original_price, b.category,
             p.name as publisher_name, p.booth_number, p.hall_number,
             abt.search_status, abt.actual_price, abt.discount_amount, abt.notes as admin_notes
      FROM list_books lb
      JOIN books b ON lb.book_id = b.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN admin_book_tracking abt ON lb.id = abt.list_book_id
      WHERE lb.list_id = $1 AND lb.deleted_at IS NULL
    `;
    
    const params: any[] = [listId];

    if (user.role === UserRole.COLLECTOR) {
      const list = await get('SELECT * FROM lists WHERE id = $1', [listId]);
      const invitation = await get(
        'SELECT * FROM list_invitations WHERE list_id = $1 AND collector_id = $2 AND status = $3',
        [listId, user.userId, 'accepted']
      );
      
      if (list.visibility !== 'public' && !invitation && list.user_id !== user.userId) {
        query += ' AND lb.assigned_collector_id = $2';
        params.push(user.userId);
      }
    }

    query += ' ORDER BY lb.sort_order, lb.priority DESC, lb.created_at';
    
    const books = await all(query, params);

    if (user.role === UserRole.COLLECTOR || user.role === UserRole.CUSTOMER) {
      const list = await get('SELECT * FROM lists WHERE id = $1', [listId]);
      if (user.role === UserRole.COLLECTOR && list.user_id !== user.userId) {
        return books.map((b: any) => ({
          ...b,
          price: b.assigned_collector_id === user.userId ? b.price : undefined
        }));
      }
    }

    return books;
  }

  async updateListBook(listBookId: number, user: IUser, dto: UpdateListBookDto) {
    const listBook = await get(`
      SELECT lb.*, l.user_id, l.visibility FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      WHERE lb.id = $1 AND lb.deleted_at IS NULL
    `, [listBookId]);
    
    if (!listBook) throw new NotFoundException('Book not found');

    const isOwner = listBook.user_id === user.userId;
    const isAssignedCollector = listBook.assigned_collector_id === user.userId;
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

    if (!isOwner && !isAssignedCollector && !isSuperAdmin) {
      throw new ForbiddenException('Access denied');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (dto.status) {
      if (isAssignedCollector && !isOwner && !isSuperAdmin) {
        if (!isValidStatusTransition(listBook.status as ListBookStatus, dto.status as ListBookStatus)) {
          throw new BadRequestException('Invalid status transition');
        }
      }
      fields.push(`status = $${paramIndex++}`);
      values.push(dto.status);

      if (dto.status === ListBookStatus.NOT_FOUND) {
        fields.push('assigned_collector_id = NULL');
      }
    }
    if (dto.priority && (isOwner || isSuperAdmin)) {
      fields.push(`priority = $${paramIndex++}`);
      values.push(dto.priority);
    }
    if (dto.notes !== undefined) { fields.push(`notes = $${paramIndex++}`); values.push(dto.notes); }
    if (dto.sort_order !== undefined && (isOwner || isSuperAdmin)) {
      fields.push(`sort_order = $${paramIndex++}`);
      values.push(dto.sort_order);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(listBookId);
    await run(`UPDATE list_books SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return await get('SELECT * FROM list_books WHERE id = $1', [listBookId]);
  }

  async removeListBook(listBookId: number, userId: number) {
    const listBook = await get(`
      SELECT lb.* FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      WHERE lb.id = $1 AND l.user_id = $2 AND lb.deleted_at IS NULL
    `, [listBookId, userId]);
    
    if (!listBook) throw new ForbiddenException('Book not found or access denied');
    
    await run('UPDATE list_books SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [listBookId]);
    return { deleted: true };
  }

  async mergeLists(userId: number, dto: MergeListsDto) {
    const sourceList = await get('SELECT * FROM lists WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [dto.source_list_id, userId]);
    const targetList = await get('SELECT * FROM lists WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [dto.target_list_id, userId]);
    
    if (!sourceList || !targetList) throw new ForbiddenException('Lists not found or access denied');

    return withTransaction(async (client) => {
      const duplicates = await all(`
        SELECT lb1.id 
        FROM list_books lb1
        JOIN list_books lb2 ON lb1.book_id = lb2.book_id AND lb2.list_id = $1
        WHERE lb1.list_id = $2 AND lb1.deleted_at IS NULL AND lb2.deleted_at IS NULL
      `, [dto.target_list_id, dto.source_list_id]);

      if (duplicates.length > 0) {
        const ids = duplicates.map((d: any) => d.id);
        for (const id of ids) {
          await client.query('UPDATE list_books SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        }
      }

      await client.query(
        'UPDATE list_books SET list_id = $1, updated_at = CURRENT_TIMESTAMP WHERE list_id = $2 AND deleted_at IS NULL',
        [dto.target_list_id, dto.source_list_id]
      );

      await client.query('UPDATE lists SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [dto.source_list_id]);
      
      return await this.findOne(dto.target_list_id, userId);
    });
  }

  async inviteCollector(listId: number, userId: number, dto: InviteCollectorDto) {
    const list = await get('SELECT * FROM lists WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [listId, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');

    const collector = await get(
      "SELECT id FROM users WHERE id = $1 AND role IN ('collector', 'super_admin') AND deleted_at IS NULL",
      [dto.collector_id]
    );
    if (!collector) throw new NotFoundException('Collector not found');

    const existing = await get(
      'SELECT * FROM list_invitations WHERE list_id = $1 AND collector_id = $2',
      [listId, dto.collector_id]
    );

    if (existing) {
      if (existing.status === 'accepted') {
        throw new BadRequestException('Collector already has access');
      }
      await run(
        "UPDATE list_invitations SET status = 'pending', invited_at = CURRENT_TIMESTAMP WHERE id = $1",
        [existing.id]
      );
      return existing;
    }

    const result = await run(
      'INSERT INTO list_invitations (list_id, collector_id, status) VALUES ($1, $2, $3) RETURNING id',
      [listId, dto.collector_id, 'pending']
    );
    return await get('SELECT * FROM list_invitations WHERE id = $1', [result.rows[0].id]);
  }

  async respondToInvitation(listId: number, user: IUser, accept: boolean) {
    const invitation = await get(
      'SELECT * FROM list_invitations WHERE list_id = $1 AND collector_id = $2',
      [listId, user.userId]
    );
    if (!invitation) throw new NotFoundException('Invitation not found');

    await run(
      'UPDATE list_invitations SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2',
      [accept ? 'accepted' : 'declined', invitation.id]
    );
    return await get('SELECT * FROM list_invitations WHERE id = $1', [invitation.id]);
  }

  async assignCollectorToList(listId: number, userId: number, dto: AssignCollectorDto) {
    const list = await get('SELECT * FROM lists WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [listId, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');

    const collector = await get(
      "SELECT id FROM users WHERE id = $1 AND role IN ('collector', 'super_admin') AND deleted_at IS NULL",
      [dto.collector_id]
    );
    if (!collector) throw new NotFoundException('Collector not found');

    await run(
      'UPDATE lists SET assigned_collector_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [dto.collector_id, listId]
    );
    return await this.findOne(listId, userId);
  }

  async unassignCollectorFromList(listId: number, userId: number) {
    const list = await get('SELECT * FROM lists WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL', [listId, userId]);
    if (!list) throw new ForbiddenException('List not found or access denied');

    await run(
      'UPDATE lists SET assigned_collector_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [listId]
    );
    return await this.findOne(listId, userId);
  }

  async assignCollectorToBook(listId: number, bookId: number, userId: number, dto: AssignCollectorDto) {
    const listBook = await get(`
      SELECT lb.* FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      WHERE lb.id = $1 AND l.user_id = $2 AND lb.deleted_at IS NULL AND l.deleted_at IS NULL
    `, [bookId, userId]);
    if (!listBook) throw new ForbiddenException('Book not found or access denied');

    const collector = await get(
      "SELECT id FROM users WHERE id = $1 AND role IN ('collector', 'super_admin') AND deleted_at IS NULL",
      [dto.collector_id]
    );
    if (!collector) throw new NotFoundException('Collector not found');

    await run(
      'UPDATE list_books SET assigned_collector_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [dto.collector_id, ListBookStatus.CLAIMED, bookId]
    );
    return await get('SELECT * FROM list_books WHERE id = $1', [bookId]);
  }

  async unassignCollectorFromBook(listId: number, bookId: number, userId: number) {
    const listBook = await get(`
      SELECT lb.* FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      WHERE lb.id = $1 AND l.user_id = $2 AND lb.deleted_at IS NULL
    `, [bookId, userId]);
    if (!listBook) throw new ForbiddenException('Book not found or access denied');

    await run(
      `UPDATE list_books SET assigned_collector_id = NULL, status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [ListBookStatus.PENDING, bookId]
    );
    return await get('SELECT * FROM list_books WHERE id = $1', [bookId]);
  }

  async claimBook(listId: number, bookId: number, user: IUser) {
    if (user.role !== UserRole.COLLECTOR && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only collectors can claim books');
    }

    const listBook = await get(`
      SELECT lb.*, l.visibility FROM list_books lb
      JOIN lists l ON lb.list_id = l.id
      WHERE lb.id = $1 AND lb.list_id = $2 AND lb.deleted_at IS NULL AND l.deleted_at IS NULL
    `, [bookId, listId]);
    if (!listBook) throw new NotFoundException('Book not found');

    if (listBook.status !== ListBookStatus.PENDING) {
      throw new BadRequestException('Book is not available for claiming');
    }

    if (listBook.assigned_collector_id) {
      throw new BadRequestException('Book is already assigned to another collector');
    }

    await run(
      'UPDATE list_books SET assigned_collector_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [user.userId, ListBookStatus.CLAIMED, bookId]
    );
    return await get('SELECT * FROM list_books WHERE id = $1', [bookId]);
  }

  async getCollectorAssignments(user: IUser) {
    const bookAssignments = await all(`
      SELECT lb.id as list_book_id, lb.status, lb.priority,
             b.title, b.author, b.isbn,
             l.id as list_id, l.name as list_name,
             u.id as customer_id, u.name as customer_name, u.email as customer_email
      FROM list_books lb
      JOIN books b ON lb.book_id = b.id
      JOIN lists l ON lb.list_id = l.id
      JOIN users u ON l.user_id = u.id
      WHERE lb.assigned_collector_id = $1 AND lb.deleted_at IS NULL AND l.deleted_at IS NULL
      ORDER BY lb.priority DESC, lb.created_at
    `, [user.userId]);

    const listAssignments = await all(`
      SELECT l.id as list_id, l.name as list_name,
             u.id as customer_id, u.name as customer_name, u.email as customer_email,
             COUNT(lb.id) as book_count
      FROM lists l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN list_books lb ON lb.list_id = l.id AND lb.deleted_at IS NULL
      WHERE l.assigned_collector_id = $1 AND l.deleted_at IS NULL
      GROUP BY l.id, u.id
    `, [user.userId]);

    return { bookAssignments, listAssignments };
  }
}

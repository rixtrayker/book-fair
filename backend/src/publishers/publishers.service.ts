import { Injectable, NotFoundException } from '@nestjs/common';
import { all, get, run } from '../database';
import { CreatePublisherDto, UpdatePublisherDto } from './publishers.dto';

@Injectable()
export class PublishersService {
  async create(dto: CreatePublisherDto) {
    const result = await run(
      'INSERT INTO publishers (name, booth_number, hall_number, contact_info) VALUES ($1, $2, $3, $4) RETURNING id',
      [dto.name, dto.booth_number, dto.hall_number, dto.contact_info]
    );
    return await get('SELECT * FROM publishers WHERE id = $1', [result.rows[0].id]);
  }

  async findAll(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const publishers = await all(
      'SELECT * FROM publishers WHERE deleted_at IS NULL ORDER BY hall_number, booth_number LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    const countResult = await get('SELECT COUNT(*) as total FROM publishers WHERE deleted_at IS NULL');
    return {
      data: publishers,
      pagination: {
        total: parseInt(countResult.total, 10),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.total, 10) / limit)
      }
    };
  }

  async findOne(id: number) {
    const publisher = await get('SELECT * FROM publishers WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!publisher) {
      throw new NotFoundException('Publisher not found');
    }
    return publisher;
  }

  async update(id: number, dto: UpdatePublisherDto) {
    const publisher = await get('SELECT * FROM publishers WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!publisher) {
      throw new NotFoundException('Publisher not found');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (dto.name) { fields.push(`name = $${paramIndex++}`); values.push(dto.name); }
    if (dto.booth_number !== undefined) { fields.push(`booth_number = $${paramIndex++}`); values.push(dto.booth_number); }
    if (dto.hall_number !== undefined) { fields.push(`hall_number = $${paramIndex++}`); values.push(dto.hall_number); }
    if (dto.contact_info !== undefined) { fields.push(`contact_info = $${paramIndex++}`); values.push(dto.contact_info); }
    
    if (fields.length === 0) {
      return this.findOne(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await run(`UPDATE publishers SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return await this.findOne(id);
  }

  async remove(id: number) {
    const publisher = await get('SELECT * FROM publishers WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!publisher) {
      throw new NotFoundException('Publisher not found');
    }
    
    await run('UPDATE publishers SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    return { deleted: true };
  }
}

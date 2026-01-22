import { Injectable } from '@nestjs/common';
import { all, get, run } from '../database';
import { CreatePublisherDto, UpdatePublisherDto } from './publishers.dto';

@Injectable()
export class PublishersService {
  async create(dto: CreatePublisherDto) {
    const result = await run(
      'INSERT INTO publishers (name, booth_number, hall_number, contact_info) VALUES (?, ?, ?, ?)',
      [dto.name, dto.booth_number, dto.hall_number, dto.contact_info]
    );
    return await get('SELECT * FROM publishers WHERE id = ?', [result.lastID]);
  }

  async findAll() {
    return await all('SELECT * FROM publishers ORDER BY hall_number, booth_number');
  }

  async findOne(id: number) {
    return await get('SELECT * FROM publishers WHERE id = ?', [id]);
  }

  async update(id: number, dto: UpdatePublisherDto) {
    const fields = [];
    const values = [];
    
    if (dto.name) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.booth_number !== undefined) { fields.push('booth_number = ?'); values.push(dto.booth_number); }
    if (dto.hall_number !== undefined) { fields.push('hall_number = ?'); values.push(dto.hall_number); }
    if (dto.contact_info !== undefined) { fields.push('contact_info = ?'); values.push(dto.contact_info); }
    
    values.push(id);
    await run(`UPDATE publishers SET ${fields.join(', ')} WHERE id = ?`, values);
    return await this.findOne(id);
  }

  async remove(id: number) {
    await run('DELETE FROM publishers WHERE id = ?', [id]);
    return { deleted: true };
  }
}

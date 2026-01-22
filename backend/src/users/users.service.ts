import { Injectable } from '@nestjs/common';
import { all, get } from '../database';

@Injectable()
export class UsersService {
  async getProfile(userId: number) {
    return await get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [userId]);
  }

  async getAllUsers() {
    return await all('SELECT id, email, name, role, created_at FROM users');
  }
}

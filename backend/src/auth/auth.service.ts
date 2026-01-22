import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { run, get } from '../database';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    try {
      const result = await run(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        [dto.email, hashedPassword, dto.name, 'user']
      );
      
      const user = await get('SELECT id, email, name, role FROM users WHERE id = ?', [result.lastID]);
      const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
      
      return { user, token };
    } catch (error) {
      throw new UnauthorizedException('Email already exists');
    }
  }

  async login(dto: LoginDto) {
    const user = await get('SELECT * FROM users WHERE email = ?', [dto.email]);
    
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { run, get } from '../database';
import { RegisterDto, LoginDto } from './auth.dto';
import { UserRole } from '../common/constants/roles.constants';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(dto: RegisterDto, role: UserRole = UserRole.CUSTOMER) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    try {
      const result = await run(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [dto.email, hashedPassword, dto.name, role]
      );
      
      const user = await get('SELECT id, email, name, role FROM users WHERE id = $1', [result.rows[0].id]);
      const token = this.generateToken(user);
      
      return { user, token };
    } catch (error) {
      throw new UnauthorizedException('Email already exists');
    }
  }

  async registerCollector(dto: RegisterDto) {
    return this.register(dto, UserRole.COLLECTOR);
  }

  async login(dto: LoginDto) {
    const user = await get('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [dto.email]);
    
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const token = this.generateToken(user);
    
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    };
  }

  private generateToken(user: any): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
  }
}

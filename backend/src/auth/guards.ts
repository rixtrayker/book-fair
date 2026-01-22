import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    
    if (!token) return false;
    
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = { userId: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      return false;
    }
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    
    if (!token) return false;
    
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = { userId: payload.sub, email: payload.email, role: payload.role };
      return payload.role === 'admin';
    } catch {
      return false;
    }
  }
}

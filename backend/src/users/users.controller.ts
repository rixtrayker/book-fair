import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard, AdminGuard } from '../auth/guards';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Get()
  @UseGuards(AdminGuard)
  getAllUsers() {
    return this.usersService.getAllUsers();
  }
}

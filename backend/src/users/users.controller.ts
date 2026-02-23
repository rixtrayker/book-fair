import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard, CollectorGuard } from '../common/guards';
import { User } from '../common/decorators';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@User('userId') userId: number) {
    return this.usersService.getProfile(userId);
  }

  @Get()
  @UseGuards(CollectorGuard)
  getAllUsers() {
    return this.usersService.getAllUsers();
  }
}

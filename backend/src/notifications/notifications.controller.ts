import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './notifications.dto';
import { AuthGuard } from '../common/guards';
import { User } from '../common/decorators';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiResponse({ status: 200, description: 'List of notifications with unread count' })
  findAll(
    @User('userId') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.notificationsService.findAll(
      userId,
      page ? +page : 1,
      limit ? +limit : 20
    );
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@User('userId') userId: number) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.notificationsService.remove(userId, id);
  }
}

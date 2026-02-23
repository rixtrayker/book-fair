import { Injectable, Logger } from '@nestjs/common';
import { run, get } from '../database';
import { Notification, CreateNotificationDto } from './notifications.interface';
import { EmailChannel } from './channels/email.channel';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly emailChannel: EmailChannel) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const result = await run(
      `INSERT INTO notifications (user_id, type, title, message, payload) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [dto.userId, dto.type, dto.title, dto.message, dto.payload ? JSON.stringify(dto.payload) : null]
    );
    
    const notification = await get('SELECT * FROM notifications WHERE id = $1', [result.rows[0].id]) as Notification;

    const emailEnabled = await this.isEmailEnabled();
    if (emailEnabled) {
      await this.emailChannel.send(notification);
    }

    return notification;
  }

  async findAll(userId: number, page: number = 1, limit: number = 20): Promise<{ data: Notification[]; unreadCount: number }> {
    const offset = (page - 1) * limit;
    
    const notifications = await run(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    
    const countResult = await get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    
    return {
      data: notifications.rows as Notification[],
      unreadCount: parseInt(countResult.count, 10),
    };
  }

  async markAsRead(userId: number, notificationId: number): Promise<Notification> {
    const notification = await get(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    await run(
      'UPDATE notifications SET read = true WHERE id = $1',
      [notificationId]
    );
    
    return await get('SELECT * FROM notifications WHERE id = $1', [notificationId]) as Notification;
  }

  async markAllAsRead(userId: number): Promise<{ updated: number }> {
    const result = await run(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
      [userId]
    );
    
    return { updated: result.rowCount };
  }

  async remove(userId: number, notificationId: number): Promise<{ deleted: boolean }> {
    const notification = await get(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    await run('DELETE FROM notifications WHERE id = $1', [notificationId]);
    
    return { deleted: true };
  }

  private async isEmailEnabled(): Promise<boolean> {
    const setting = await get(
      "SELECT value FROM system_settings WHERE key = 'email_notifications_enabled'"
    );
    return setting?.value === 'true';
  }
}

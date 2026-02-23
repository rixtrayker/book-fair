import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../notifications.interface';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private enabled: boolean;
  private provider: string;
  private from: string;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('email.enabled') || false;
    this.provider = this.configService.get<string>('email.provider') || 'sendgrid';
    this.from = this.configService.get<string>('email.from') || 'noreply@kotobgy.com';
  }

  async send(notification: Notification): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug(`Email notifications disabled. Skipping notification ${notification.id}`);
      return false;
    }

    try {
      switch (this.provider) {
        case 'sendgrid':
          return await this.sendViaSendgrid(notification);
        case 'mailgun':
          return await this.sendViaMailgun(notification);
        case 'ses':
          return await this.sendViaSES(notification);
        case 'smtp':
          return await this.sendViaSMTP(notification);
        default:
          this.logger.warn(`Unknown email provider: ${this.provider}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`);
      return false;
    }
  }

  private async sendViaSendgrid(notification: Notification): Promise<boolean> {
    const apiKey = this.configService.get<string>('email.sendgridApiKey');
    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured');
      return false;
    }

    this.logger.log(`[MOCK] Sending email via SendGrid to user ${notification.user_id}: ${notification.title}`);
    
    return true;
  }

  private async sendViaMailgun(notification: Notification): Promise<boolean> {
    this.logger.log(`[MOCK] Sending email via Mailgun to user ${notification.user_id}: ${notification.title}`);
    return true;
  }

  private async sendViaSES(notification: Notification): Promise<boolean> {
    this.logger.log(`[MOCK] Sending email via AWS SES to user ${notification.user_id}: ${notification.title}`);
    return true;
  }

  private async sendViaSMTP(notification: Notification): Promise<boolean> {
    this.logger.log(`[MOCK] Sending email via SMTP to user ${notification.user_id}: ${notification.title}`);
    return true;
  }
}

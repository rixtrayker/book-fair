export enum NotificationType {
  BOOK_DELETED = 'book_deleted',
  BOOK_ASSIGNED = 'book_assigned',
  STATUS_UPDATED = 'status_updated',
  ORDER_CREATED = 'order_created',
  LIST_SHARED = 'list_shared',
  INVITATION_RECEIVED = 'invitation_received',
}

export interface CreateNotificationDto {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, any>;
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  payload?: string;
  read: boolean;
  created_at: Date;
}

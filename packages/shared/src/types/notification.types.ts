export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum NotificationType {
  RETURN_REMINDER = 'RETURN_REMINDER',
  OVERDUE = 'OVERDUE',
  EXTENSION = 'EXTENSION',
  INSURANCE_EXPIRY = 'INSURANCE_EXPIRY',
  INSPECTION_EXPIRY = 'INSPECTION_EXPIRY',
  RENTAL_CONFIRMATION = 'RENTAL_CONFIRMATION',
}

export interface NotificationDto {
  id: string;
  type: string;
  channel: NotificationChannel;
  recipientId?: string | null;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  status: NotificationStatus;
  message?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  scheduledFor?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface InAppNotificationDto {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  linkUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface AlertConfigDto {
  id: string;
  alertType: string;
  enabled: boolean;
  leadTimeDays: number;
  channels: string[];
  maxRepeat?: number | null;
}

export interface UpdateAlertConfigInput {
  enabled?: boolean;
  leadTimeDays?: number;
  channels?: string[];
  maxRepeat?: number | null;
}

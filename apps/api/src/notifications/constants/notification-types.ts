export const NOTIFICATION_QUEUES = {
  SMS: 'notifications-sms',
  EMAIL: 'notifications-email',
} as const;

export const DEFAULT_ALERT_CONFIGS = [
  { alertType: 'RETURN_REMINDER', enabled: true, leadTimeDays: 1, channels: ['SMS'], maxRepeat: null },
  { alertType: 'OVERDUE', enabled: true, leadTimeDays: 0, channels: ['SMS'], maxRepeat: 7 },
  { alertType: 'EXTENSION', enabled: true, leadTimeDays: 0, channels: ['SMS'], maxRepeat: null },
  { alertType: 'INSURANCE_EXPIRY', enabled: true, leadTimeDays: 30, channels: ['EMAIL', 'IN_APP'], maxRepeat: null },
  { alertType: 'INSPECTION_EXPIRY', enabled: true, leadTimeDays: 30, channels: ['EMAIL', 'IN_APP'], maxRepeat: null },
  { alertType: 'RENTAL_CONFIRMATION', enabled: true, leadTimeDays: 0, channels: ['EMAIL'], maxRepeat: null },
] as const;

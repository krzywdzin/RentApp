import { Controller, Get, Patch, Post, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AlertScannerService } from './cron/alert-scanner.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@rentapp/shared';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly alertScannerService: AlertScannerService,
  ) {}

  @Get('in-app')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getInAppNotifications(
    @CurrentUser() user: { id: string },
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.getInAppNotifications(user.id, query);
  }

  @Get('in-app/unread-count')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch('in-app/read-all')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch('in-app/:id/read')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Get('log')
  @Roles(UserRole.ADMIN)
  async getNotificationLog(@Query() query: NotificationQueryDto) {
    return this.notificationsService.getNotificationLog(query);
  }

  @Post('trigger-scan')
  @Roles(UserRole.ADMIN)
  async triggerScan() {
    await this.alertScannerService.scanAlerts();
    return { message: 'Alert scan triggered' };
  }
}

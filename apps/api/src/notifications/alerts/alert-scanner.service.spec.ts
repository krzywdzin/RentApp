describe('AlertScannerService', () => {
  // Mock PrismaService and NotificationsService
  it.todo('should run at 8:00 AM daily (cron expression)');
  it.todo('should find rentals with return date tomorrow for reminders');
  it.todo('should find overdue rentals (past endDate, status ACTIVE or EXTENDED)');
  it.todo('should not send reminder if notification already exists for same rental+type+date');
  it.todo('should stop overdue SMS after maxRepeat count reached');
  it.todo('should find vehicles with insurance expiring in 30 days');
  it.todo('should find vehicles with insurance expiring in 7 days');
  it.todo('should find vehicles with inspection expiring in 30 days');
  it.todo('should find vehicles with inspection expiring in 7 days');
  it.todo('should skip disabled alert types via AlertConfig');
  it.todo('should use Europe/Warsaw timezone for date boundaries');
});

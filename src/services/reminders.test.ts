import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RemindersService } from './reminders';

function stubNotification(permission: NotificationPermission, requestResult: NotificationPermission = permission) {
  const NotificationMock: any = vi.fn().mockImplementation(function (this: any, title: string, options: any) {
    this.title = title;
    this.options = options;
  });
  NotificationMock.permission = permission;
  NotificationMock.requestPermission = vi.fn().mockResolvedValue(requestResult);
  vi.stubGlobal('Notification', NotificationMock);
  return NotificationMock;
}

describe('RemindersService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports unsupported when the Notification API is not available', () => {
    expect(RemindersService.isSupported()).toBe(false);
    expect(RemindersService.getPermission()).toBe('unsupported');
  });

  it('reflects the enabled flag from localStorage', () => {
    expect(RemindersService.isEnabled()).toBe(false);
    localStorage.setItem('google_ambassador_reminders_enabled', 'true');
    expect(RemindersService.isEnabled()).toBe(true);
  });

  it('enables reminders only when permission is granted', async () => {
    stubNotification('default', 'granted');
    const granted = await RemindersService.enable();
    expect(granted).toBe(true);
    expect(RemindersService.isEnabled()).toBe(true);
  });

  it('does not enable reminders when permission is denied', async () => {
    stubNotification('default', 'denied');
    const granted = await RemindersService.enable();
    expect(granted).toBe(false);
    expect(RemindersService.isEnabled()).toBe(false);
  });

  it('does nothing when the API is unsupported', async () => {
    expect(await RemindersService.enable()).toBe(false);
  });

  it('disables reminders', () => {
    localStorage.setItem('google_ambassador_reminders_enabled', 'true');
    RemindersService.disable();
    expect(RemindersService.isEnabled()).toBe(false);
  });

  it('does not notify when reminders are disabled', () => {
    const NotificationMock = stubNotification('granted');
    RemindersService.checkAndNotify(null);
    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it('does not notify when permission is not granted, even if enabled', () => {
    const NotificationMock = stubNotification('denied');
    localStorage.setItem('google_ambassador_reminders_enabled', 'true');
    RemindersService.checkAndNotify(null);
    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it('does not notify again within 7 days of the last reminder shown', () => {
    const NotificationMock = stubNotification('granted');
    localStorage.setItem('google_ambassador_reminders_enabled', 'true');
    localStorage.setItem('google_ambassador_last_reminder_shown', String(Date.now() - 2 * 24 * 60 * 60 * 1000));
    RemindersService.checkAndNotify(null);
    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it('does not notify when the last post is less than 7 days old', () => {
    const NotificationMock = stubNotification('granted');
    localStorage.setItem('google_ambassador_reminders_enabled', 'true');
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    RemindersService.checkAndNotify(twoDaysAgo);
    expect(NotificationMock).not.toHaveBeenCalled();
  });

  it('fires a notification when enabled, granted, and inactive for over 7 days', () => {
    const NotificationMock = stubNotification('granted');
    localStorage.setItem('google_ambassador_reminders_enabled', 'true');
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    RemindersService.checkAndNotify(tenDaysAgo);
    expect(NotificationMock).toHaveBeenCalledWith('Embaixadora Google 2026', expect.objectContaining({ tag: 'weekly-content-reminder' }));
    expect(localStorage.getItem('google_ambassador_last_reminder_shown')).not.toBeNull();
  });

  it('treats never having posted as long overdue', () => {
    const NotificationMock = stubNotification('granted');
    localStorage.setItem('google_ambassador_reminders_enabled', 'true');
    RemindersService.checkAndNotify(null);
    expect(NotificationMock).toHaveBeenCalledTimes(1);
  });
});

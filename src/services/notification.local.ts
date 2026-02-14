import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ActionItem } from '../state/slices/dailySlice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MORNING_DIGEST_ID = 'morning-digest';
const EVENING_NUDGE_ID = 'evening-nudge';
const ACTION_REMINDER_PREFIX = 'action-reminder-';

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (__DEV__) console.log('⚠️  [NOTIF] Notifications not supported on web');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAll(): Promise<void> {
  if (Platform.OS === 'web') {
    if (__DEV__) console.log('⚠️  [NOTIF] Skipping notifications on web platform');
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleAll(actions: ActionItem[]): Promise<void> {
  await cancelAll();

  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    if (__DEV__) console.log('🔕 [NOTIF] Permission not granted, skipping scheduling');
    return;
  }

  await scheduleMorningDigest(actions);
  await scheduleActionReminders(actions);
  await scheduleEveningNudge();

  if (__DEV__) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`🔔 [NOTIF] ${scheduled.length} notifications scheduled`);
  }
}

async function scheduleMorningDigest(actions: ActionItem[]): Promise<void> {
  const abstinence = actions.filter(a => a.isAbstinence && !a.done);
  const timed = actions.filter(a => !a.isAbstinence && !a.done);
  const total = abstinence.length + timed.length;

  if (total === 0) return;

  const lines: string[] = [];

  abstinence.forEach(a => {
    lines.push(`\u{1F6AB} ${a.title}`);
  });

  timed.forEach(a => {
    const timeStr = a.time ? ` at ${formatTime(a.time)}` : '';
    lines.push(`\u{23F0} ${a.title}${timeStr}`);
  });

  lines.push('');
  lines.push(`You've got ${total} action${total > 1 ? 's' : ''} today. Let's go.`);

  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_DIGEST_ID,
    content: {
      title: "\u{1F305} Today's Game Plan",
      body: lines.join('\n'),
      sound: 'default',
      data: { type: 'morning_digest' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 6,
      minute: 0,
    },
  });

  if (__DEV__) console.log(`\u{1F305} [NOTIF] Morning digest scheduled for 6:00 AM (${total} actions)`);
}

async function scheduleActionReminders(actions: ActionItem[]): Promise<void> {
  const timedActions = actions.filter(a => !a.isAbstinence && !a.done && a.time);

  for (const action of timedActions) {
    const [hours, minutes] = action.time!.split(':').map(Number);

    let reminderHour = hours - 1;
    let reminderMinute = minutes;

    if (reminderHour < 0) {
      reminderHour = 23;
    }

    const goalLine = action.goalTitle ? `\n\u{1F3AF} ${action.goalTitle}` : '';

    await Notifications.scheduleNotificationAsync({
      identifier: `${ACTION_REMINDER_PREFIX}${action.id}`,
      content: {
        title: `\u{23F0} In 1 hour: ${action.title}`,
        body: `Time to get ready${goalLine}`,
        sound: 'default',
        data: { type: 'action_reminder', actionId: action.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminderHour,
        minute: reminderMinute,
      },
    });

    if (__DEV__) console.log(`\u{23F0} [NOTIF] Reminder for "${action.title}" at ${reminderHour}:${String(reminderMinute).padStart(2, '0')}`);
  }
}

async function scheduleEveningNudge(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_NUDGE_ID,
    content: {
      title: '\u{1F4AA} Check in on your daily actions',
      body: "Don't break your momentum \u{2014} you've got this!",
      sound: 'default',
      data: { type: 'evening_nudge' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });

  if (__DEV__) console.log('\u{1F4AA} [NOTIF] Evening nudge scheduled for 7:00 PM');
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function addNotificationResponseListener(
  callback: (actionId?: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data?.actionId) {
      callback(data.actionId as string);
    } else {
      callback();
    }
  });
}

# 📱 Push Notifications Setup & Testing Guide

## What We Built

A remote push notification system that lets you send notifications to users from your backend.

### Components:
1. **Database** - `push_tokens` table stores device tokens
2. **App Service** - Registers devices and stores tokens
3. **Edge Function** - Sends notifications to Apple/Google
4. **Test Script** - Easy way to send test notifications

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

```bash
cd /home/marek/Unity-vision

# Run the migration in Supabase SQL Editor:
# Copy contents of: supabase/migrations/20260212_create_push_tokens.sql
# Paste and run in: https://supabase.com/dashboard → SQL Editor
```

### Step 2: Deploy Edge Function

```bash
# Deploy the send-push-notification function
supabase functions deploy send-push-notification
```

### Step 3: Install Dependencies

```bash
npm install expo-device
```

### Step 4: Update App to Register Devices

Add to your app initialization (e.g., in `AppWithAuth.tsx` or `MainTabs.tsx`):

```typescript
import { PushNotificationsService } from './services/pushNotifications.service';

// After user logs in:
useEffect(() => {
  if (user) {
    PushNotificationsService.registerForPushNotifications();
  }
}, [user]);
```

---

## 🧪 Testing

### Test 1: Register Your Device

1. **Build and install** the app on a **physical iOS device** (not simulator)
2. **Open the app** and log in
3. **Allow notifications** when prompted
4. Check console logs for: `✅ [PUSH] Token saved to database`

### Test 2: Verify Token in Database

```sql
-- Run in Supabase SQL Editor
SELECT
  user_id,
  token,
  platform,
  device_name,
  created_at
FROM push_tokens
ORDER BY created_at DESC;
```

You should see your device token!

### Test 3: Send Test Notification

```bash
# Send to all users
node scripts/test-push-notification.js

# Send to specific user (use your user ID from database)
node scripts/test-push-notification.js "your-user-id-here"

# Send custom message
node scripts/test-push-notification.js "" "Hello!" "Test message"
```

Check your phone - you should receive the notification! 📱

---

## 🔧 Troubleshooting

### "No push tokens found"
- Make sure you opened the app and allowed notifications
- Check database: `SELECT * FROM push_tokens;`
- Check console logs when app starts

### "Must use physical device"
- Push notifications don't work on iOS Simulator
- You need a real iPhone/iPad

### "Permission denied"
- User denied notification permission
- Go to iOS Settings → Unity → Notifications → Enable

### Edge Function error
- Check if function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs send-push-notification`

---

## 📊 How It Works

```
┌─────────────┐
│   Your App  │  1. User logs in
│  (iPhone)   │  2. Registers for push notifications
└──────┬──────┘  3. Gets device token from Apple
       │         4. Saves token to database
       │
       v
┌──────────────┐
│  Supabase DB │  Stores: user_id + device_token
└──────────────┘
       │
       │  When you want to send notification:
       │
       v
┌──────────────┐
│ Edge Function│  1. Fetches tokens from DB
│ send-push-   │  2. Sends to Expo Push Service
│ notification │  3. Expo sends to Apple (APNs)
└──────────────┘
       │
       v
┌──────────────┐
│   Your App   │  4. User receives notification!
│  (iPhone)    │
└──────────────┘
```

---

## 🎯 Next Steps

After testing works:

1. **Admin Panel** - Web UI to send notifications
2. **Scheduled Notifications** - Send at specific times
3. **User Targeting** - Send to specific circles, users
4. **Notification History** - Track what was sent
5. **Templates** - Pre-defined notification messages

---

## 📝 Usage Examples

### Send to All Users
```javascript
const { data } = await supabase.functions.invoke('send-push-notification', {
  body: {
    title: '🎉 New Challenge!',
    body: 'The 30-Day Fitness Challenge starts tomorrow!',
  },
});
```

### Send to Specific User
```javascript
const { data } = await supabase.functions.invoke('send-push-notification', {
  body: {
    userId: 'user-id-here',
    title: '💪 You did it!',
    body: 'Congrats on completing the challenge!',
  },
});
```

### Send to Multiple Users
```javascript
const { data } = await supabase.functions.invoke('send-push-notification', {
  body: {
    userIds: ['user1-id', 'user2-id', 'user3-id'],
    title: '👥 Group Update',
    body: 'Your circle just hit 100 members!',
  },
});
```

---

## ✅ Checklist

- [ ] Database migration run
- [ ] Edge function deployed
- [ ] expo-device installed
- [ ] App updated to register devices
- [ ] App built and installed on physical device
- [ ] Device token saved to database
- [ ] Test notification sent successfully
- [ ] Notification received on device

---

**Questions?** Check the Expo Push Notifications docs: https://docs.expo.dev/push-notifications/overview/

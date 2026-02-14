#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendTestNotification() {
  console.log('🧪 Sending test push notification...\n');

  // Get command line arguments
  const args = process.argv.slice(2);
  const userId = args[0]; // Optional: specific user ID
  const title = args[1] || '🎉 Test Notification';
  const body = args[2] || 'This is a test notification from your Unity app!';

  console.log('📝 Details:');
  console.log(`  Title: ${title}`);
  console.log(`  Body: ${body}`);
  if (userId) {
    console.log(`  Target: User ${userId}`);
  } else {
    console.log(`  Target: All users`);
  }
  console.log('');

  try {
    // Call the Edge Function
    const payload = {
      title,
      body,
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    };

    if (userId) {
      payload.userId = userId;
    }

    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: payload,
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Success!');
    console.log(`📨 Sent to ${data.sent} device(s)`);
    console.log('\nRecipients:');
    data.tokens.forEach((t, i) => {
      console.log(`  ${i + 1}. User ${t.user_id.substring(0, 8)}... (${t.platform})`);
    });

    console.log('\n📱 Check your device for the notification!');

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📱 Test Push Notification Script

Usage:
  node scripts/test-push-notification.js [userId] [title] [body]

Examples:
  # Send to all users
  node scripts/test-push-notification.js

  # Send to specific user
  node scripts/test-push-notification.js "user-id-here"

  # Send custom message to all users
  node scripts/test-push-notification.js "" "Hello!" "This is a custom message"

  # Send custom message to specific user
  node scripts/test-push-notification.js "user-id-here" "Hey!" "Personal message"
  `);
  process.exit(0);
}

sendTestNotification().catch(console.error);

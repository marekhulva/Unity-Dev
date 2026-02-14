import { supabase } from './src/services/supabase.service';
import { supabaseNotificationService } from './src/services/supabase.notifications.service';

async function testNotifications() {
  console.log('🧪 Testing Notification System\n');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('❌ No user logged in. Please log in first.');
    return;
  }

  console.log('✅ Logged in as:', user.email);
  console.log('   User ID:', user.id, '\n');

  // Create a test notification
  console.log('📝 Creating test notification...');
  const result = await supabaseNotificationService.createNotification(
    user.id,
    'circle_challenge_created',
    '🎯 New Circle Challenge!',
    'Your circle has created a new 7-day meditation challenge. Join now to participate!',
    {
      challengeId: 'test-challenge-123',
      circleName: 'Morning Routine Warriors'
    },
    '/challenges/test-challenge-123'
  );

  if (result.success) {
    console.log('✅ Notification created successfully!');
    console.log('   ID:', result.notification?.id);
  } else {
    console.error('❌ Failed to create notification');
    return;
  }

  // Fetch notifications
  console.log('\n📬 Fetching all notifications...');
  const notifications = await supabaseNotificationService.getNotifications(10);
  console.log(`   Found ${notifications.length} notification(s)`);

  notifications.forEach((n, i) => {
    console.log(`\n   ${i + 1}. ${n.title}`);
    console.log(`      Body: ${n.body}`);
    console.log(`      Type: ${n.type}`);
    console.log(`      Read: ${n.is_read ? 'Yes' : 'No'}`);
    console.log(`      Created: ${new Date(n.created_at).toLocaleString()}`);
  });

  // Get unread count
  console.log('\n🔔 Checking unread count...');
  const unreadCount = await supabaseNotificationService.getUnreadCount();
  console.log(`   Unread notifications: ${unreadCount}`);

  console.log('\n✨ Test complete! Now refresh your app to see the notification.\n');
}

testNotifications().catch(console.error);

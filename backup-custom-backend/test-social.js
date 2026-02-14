const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWVoeGZqNTgwMDAwZXhmbmIwNWl0MmN6IiwiZW1haWwiOiJmaXJzdEB1c2VyLmNvbSIsImlhdCI6MTc1NTU3MDY3NywiZXhwIjoxNzU2MTc1NDc3fQ.G7_9PgO948I1FoxxdnkKEZS8H65a-ty9jfjVRnUSGhQ";

async function testSocialAPI() {
  console.log('Testing Social API...\n');
  
  // 1. Create a post
  console.log('1. Creating a social post...');
  const postResponse = await fetch('http://localhost:3001/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      type: 'checkin',
      visibility: 'circle',
      content: 'Just completed my morning workout! Feeling great!',
      actionTitle: 'Morning workout',
      goalTitle: 'Lose 10 pounds',
      goalColor: '#10B981',
      streak: 1
    })
  });
  
  const post = await postResponse.json();
  console.log('Post created:', post.success ? '✅' : '❌');
  if (post.data) {
    console.log('Post ID:', post.data.id);
  }
  
  // 2. Get feed
  console.log('\n2. Getting circle feed...');
  const feedResponse = await fetch('http://localhost:3001/api/feed/circle', {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  
  const feed = await feedResponse.json();
  console.log('Feed retrieved:', feed.success ? '✅' : '❌');
  console.log('Posts in feed:', feed.data?.length || 0);
  
  // 3. Add reaction
  if (post.data?.id) {
    console.log('\n3. Adding reaction to post...');
    const reactionResponse = await fetch(`http://localhost:3001/api/posts/${post.data.id}/react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        emoji: '💪'
      })
    });
    
    const reaction = await reactionResponse.json();
    console.log('Reaction added:', reaction.success ? '✅' : '❌');
  }
  
  console.log('\n✅ Social API testing complete!');
}

testSocialAPI().catch(console.error);
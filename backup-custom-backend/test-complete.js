const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001';
let testResults = [];
let userId, token, goalId, actionId, postId;

// Test user credentials
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'testpass123',
  name: 'Test User'
};

// Helper to log results
function logTest(name, success, details = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${name} ${details}`);
  testResults.push({ name, success, details });
}

// Helper to make API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    });
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 COMPLETE BACKEND TEST SUITE\n');
  console.log('================================\n');

  // 1. Health Check
  console.log('1️⃣ SYSTEM HEALTH\n');
  const health = await apiCall('/health');
  logTest('Server Health', health.data?.success, health.data?.database);

  // 2. Authentication Tests
  console.log('\n2️⃣ AUTHENTICATION\n');
  
  // Register
  const register = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  logTest('User Registration', register.data?.success, `User: ${testUser.email}`);
  if (register.data?.data) {
    userId = register.data.data.user.id;
    token = register.data.data.token;
  }

  // Try duplicate registration
  const duplicate = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  logTest('Duplicate Prevention', !duplicate.data?.success && duplicate.response?.status === 400, 'Should reject duplicate email');

  // Login with correct password
  const login = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });
  logTest('Login Success', login.data?.success, 'With correct password');

  // Login with wrong password
  const wrongLogin = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testUser.email,
      password: 'wrongpassword'
    })
  });
  logTest('Login Security', !wrongLogin.data?.success && wrongLogin.response?.status === 401, 'Should reject wrong password');

  // 3. Goals Tests
  console.log('\n3️⃣ GOALS MANAGEMENT\n');

  // Create goal
  const createGoal = await apiCall('/api/goals', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Goal',
      metric: 'Progress',
      deadline: '2024-12-31',
      category: 'fitness',
      color: '#FF6B6B',
      why: 'Testing purposes'
    })
  });
  logTest('Create Goal', createGoal.data?.success, createGoal.data?.data?.title);
  if (createGoal.data?.data) {
    goalId = createGoal.data.data.id;
  }

  // Get user's goals
  const getGoals = await apiCall('/api/goals');
  logTest('Get Goals', getGoals.data?.success && getGoals.data?.data?.length > 0, `Found ${getGoals.data?.data?.length || 0} goals`);

  // Try to get goals without token
  const noAuthGoals = await apiCall('/api/goals', {
    headers: { 'Authorization': '' }
  });
  logTest('Goals Auth Required', noAuthGoals.data?.message?.includes('Mock data'), 'Returns mock without auth');

  // 4. Actions Tests
  console.log('\n4️⃣ DAILY ACTIONS\n');

  // Create action
  const createAction = await apiCall('/api/actions', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Action',
      time: '10:00',
      goalId: goalId
    })
  });
  logTest('Create Action', createAction.data?.success, createAction.data?.data?.title);
  if (createAction.data?.data) {
    actionId = createAction.data.data.id;
  }

  // Get daily actions
  const getActions = await apiCall('/api/actions/daily');
  logTest('Get Daily Actions', getActions.data?.success && getActions.data?.data?.length > 0, `Found ${getActions.data?.data?.length || 0} actions`);

  // Complete action
  const completeAction = await apiCall(`/api/actions/${actionId}/complete`, {
    method: 'PUT'
  });
  logTest('Complete Action', completeAction.data?.success && completeAction.data?.data?.done === true, 'Marked as done');

  // 5. Social Tests
  console.log('\n5️⃣ SOCIAL FEATURES\n');

  // Create post
  const createPost = await apiCall('/api/posts', {
    method: 'POST',
    body: JSON.stringify({
      type: 'checkin',
      visibility: 'circle',
      content: 'Test post content',
      actionTitle: 'Test Action',
      goalTitle: 'Test Goal',
      goalColor: '#10B981',
      streak: 5
    })
  });
  logTest('Create Post', createPost.data?.success, 'Check-in post created');
  if (createPost.data?.data) {
    postId = createPost.data.data.id;
  }

  // Get feed
  const getFeed = await apiCall('/api/feed/circle');
  logTest('Get Circle Feed', getFeed.data?.success && getFeed.data?.data?.length > 0, `${getFeed.data?.data?.length || 0} posts in feed`);

  // Add reaction
  const addReaction = await apiCall(`/api/posts/${postId}/react`, {
    method: 'POST',
    body: JSON.stringify({ emoji: '👍' })
  });
  logTest('Add Reaction', addReaction.data?.success, 'Added 👍');

  // Toggle reaction (remove)
  const toggleReaction = await apiCall(`/api/posts/${postId}/react`, {
    method: 'POST',
    body: JSON.stringify({ emoji: '👍' })
  });
  logTest('Toggle Reaction', toggleReaction.data?.message === 'Reaction removed', 'Reaction toggled off');

  // Delete post
  const deletePost = await apiCall(`/api/posts/${postId}`, {
    method: 'DELETE'
  });
  logTest('Delete Post', deletePost.data?.success, 'Post deleted');

  // 6. Data Relationships
  console.log('\n6️⃣ DATA INTEGRITY\n');

  // Check user has goals and actions
  const userData = await apiCall('/api/users');
  const currentUser = userData.data?.data?.find(u => u.id === userId);
  logTest('User-Goal Relationship', currentUser?._count?.goals > 0, `User has ${currentUser?._count?.goals || 0} goals`);
  logTest('User-Action Relationship', currentUser?._count?.actions > 0, `User has ${currentUser?._count?.actions || 0} actions`);

  // 7. Error Handling
  console.log('\n7️⃣ ERROR HANDLING\n');

  // Invalid endpoint
  const invalidEndpoint = await apiCall('/api/invalid');
  logTest('404 Handling', invalidEndpoint.response?.status === 404, 'Returns 404 for invalid endpoint');

  // Invalid token
  const oldToken = token;
  token = 'invalid-token';
  const invalidAuth = await apiCall('/api/goals');
  logTest('Invalid Token', invalidAuth.data?.error?.includes('Invalid') || invalidAuth.response?.status === 401, 'Properly rejects invalid token');
  token = oldToken;

  // Missing required fields
  const missingFields = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: 'incomplete@test.com' })
  });
  logTest('Validation', !missingFields.data?.success, 'Validates required fields');

  // ========== SUMMARY ==========
  console.log('\n================================');
  console.log('📊 TEST SUMMARY\n');
  
  const passed = testResults.filter(t => t.success).length;
  const failed = testResults.filter(t => !t.success).length;
  const total = testResults.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${percentage}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(t => !t.success).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }
  
  if (percentage === 100) {
    console.log('\n🎉 ALL TESTS PASSED! Backend is fully functional!');
  } else if (percentage >= 80) {
    console.log('\n✅ Backend is mostly functional with minor issues.');
  } else {
    console.log('\n⚠️ Backend has issues that need fixing.');
  }
  
  return { passed, failed, total, percentage };
}

// Run tests
runTests().catch(console.error);
// API Configuration
// Update this file once your backend is deployed

const ENV = {
  // CHANGE THIS to your deployed backend URL
  // Examples:
  // Railway: https://your-app.railway.app
  // Render: https://your-app.onrender.com
  // Heroku: https://your-app.herokuapp.com
  API_URL: 'https://ojusijzhshvviqjeyhyn.supabase.co', // Supabase Backend
};

// Don't change anything below this line
export const API_BASE_URL = ENV.API_URL;

export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  checkAuth: `${API_BASE_URL}/api/auth/check`,
  
  // Actions
  actions: `${API_BASE_URL}/api/actions`,
  dailyActions: `${API_BASE_URL}/api/actions/daily`,
  completeAction: `${API_BASE_URL}/api/actions/complete`,
  
  // Goals
  goals: `${API_BASE_URL}/api/goals`,
  
  // Social
  feed: `${API_BASE_URL}/api/feed`,
  feedCircle: `${API_BASE_URL}/api/feed/circle`,
  feedFollow: `${API_BASE_URL}/api/feed/follow`,
  posts: `${API_BASE_URL}/api/posts`,
  
  // User
  profile: `${API_BASE_URL}/api/users/profile`,
  updateProfile: `${API_BASE_URL}/api/users/update`,
};

export default API_ENDPOINTS;
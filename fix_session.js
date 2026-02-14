// Run this in your browser console to fix the session issue

// First, check if you have a token stored
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('Stored token:', token ? 'Found' : 'Not found');
console.log('Stored user:', user ? 'Found' : 'Not found');

// If you have both, you're logged in but Supabase doesn't know
// The fix is to log out and log back in through the UI

// Alternative: Clear everything and start fresh
if (confirm('Clear all auth data and start fresh? You will need to log in again.')) {
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
}
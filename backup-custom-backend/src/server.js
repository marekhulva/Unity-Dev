const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (for testing without database)
const users = [];

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running! 🚀',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Best App Backend API v1.0' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date()
    };
    
    users.push(user);
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email, name },
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        user: { id: user.id, email, name: user.name },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Mock goals endpoint
app.get('/api/goals', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', title: 'Lose 10 lbs', metric: 'Weight', deadline: '2024-12-31', consistency: 75, status: 'On Track' },
      { id: '2', title: 'Run 5k', metric: 'Distance', deadline: '2024-11-30', consistency: 60, status: 'Needs Attention' }
    ]
  });
});

// Mock daily actions endpoint
app.get('/api/actions/daily', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', title: 'Morning workout', time: '07:00', done: false },
      { id: '2', title: 'Meditation', time: '08:00', done: false },
      { id: '3', title: 'Read for 30 minutes', time: '20:00', done: false }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
✅ Server running at http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health
🔑 Auth endpoints ready
💾 Using in-memory storage (no database needed for testing)
  `);
});
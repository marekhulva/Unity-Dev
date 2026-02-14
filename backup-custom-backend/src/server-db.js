const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit to handle images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper function to verify token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  } catch (error) {
    return null;
  }
}

// Connect to database
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to Supabase database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Backend is running with database! 🚀',
      database: 'Connected to Supabase',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Backend running but database issue',
      error: error.message
    });
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Best App Backend API v2.0',
    database: 'Supabase PostgreSQL',
    endpoints: {
      auth: '/api/auth/register, /api/auth/login',
      goals: '/api/goals (CRUD)',
      actions: '/api/actions/daily',
      users: '/api/users'
    }
  });
});

// ==================== AUTH ENDPOINTS ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        error: 'Email, password, and name are required' 
      });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true
      }
    });
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    console.log(`✅ New user registered: ${email}`);
    
    res.status(201).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
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
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
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
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    console.log(`✅ User logged in: ${email}`);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get all users (for testing)
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            goals: true,
            actions: true,
            posts: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== GOALS ENDPOINTS ====================

// Get user's goals (protected - requires token)
app.get('/api/goals', async (req, res) => {
  try {
    // Extract token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Return mock data if no token (for testing)
      return res.json({
        success: true,
        data: [
          { id: '1', title: 'Lose 10 lbs', metric: 'Weight', deadline: '2024-12-31', consistency: 75, status: 'On Track' },
          { id: '2', title: 'Run 5k', metric: 'Distance', deadline: '2024-11-30', consistency: 60, status: 'Needs Attention' }
        ],
        message: 'Mock data - login to see your real goals'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    // Get user's goals from database
    const goals = await prisma.goal.findMany({
      where: { userId: decoded.userId },
      include: {
        milestones: true,
        _count: {
          select: { actions: true }
        }
      }
    });
    
    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
});

// Create a new goal
app.post('/api/goals', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { title, metric, deadline, category, color, why } = req.body;
    
    const goal = await prisma.goal.create({
      data: {
        userId: decoded.userId,
        title,
        metric,
        deadline: new Date(deadline),
        category: category || 'other',
        color: color || '#FFD700',
        why: why || ''
      }
    });
    
    res.status(201).json({
      success: true,
      data: goal,
      message: 'Goal created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== ACTIONS ENDPOINTS ====================

// Get daily actions
app.get('/api/actions/daily', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Return mock data if no token
      return res.json({
        success: true,
        data: [
          { id: '1', title: 'Morning workout', time: '07:00', done: false },
          { id: '2', title: 'Meditation', time: '08:00', done: false },
          { id: '3', title: 'Read for 30 minutes', time: '20:00', done: false }
        ],
        message: 'Mock data - login to see your real actions'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Get today's actions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const actions = await prisma.action.findMany({
      where: {
        userId: decoded.userId,
        date: {
          gte: today
        }
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            color: true
          }
        }
      }
    });
    
    // Ensure goalId is explicitly included in the response
    const actionsWithGoalId = actions.map(action => ({
      ...action,
      goalId: action.goalId || action.goal?.id
    }));
    
    res.json({
      success: true,
      data: actionsWithGoalId
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Create an action
app.post('/api/actions', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { title, time, goalId, frequency } = req.body;
    
    const action = await prisma.action.create({
      data: {
        userId: decoded.userId,
        title,
        time: time || null,
        goalId: goalId || null,
        frequency: frequency || 'Daily',
        date: new Date()
      }
    });
    
    res.status(201).json({
      success: true,
      data: action,
      message: 'Action created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Mark action as complete
app.put('/api/actions/:id/complete', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { id } = req.params;
    
    const action = await prisma.action.update({
      where: { 
        id,
        userId: decoded.userId // Ensure user owns this action
      },
      data: {
        done: true,
        completedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      data: action,
      message: 'Action marked as complete'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== SOCIAL/POSTS ENDPOINTS ====================

// Get feed (circle or following)
app.get('/api/feed/:type', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { type } = req.params; // 'circle' or 'following'
    
    // For now, get all posts (later add circle/following logic)
    const posts = await prisma.post.findMany({
      where: {
        visibility: type === 'circle' ? 'circle' : 'follow'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            reactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to 20 posts
    });
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Create a post
app.post('/api/posts', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { 
      type, 
      visibility, 
      content, 
      mediaUrl, 
      actionTitle, 
      goalTitle, 
      goalColor, 
      streak 
    } = req.body;
    
    console.log('📝 Creating post with content:', content);
    console.log('📦 Full request body:', req.body);
    
    const post = await prisma.post.create({
      data: {
        userId: decoded.userId,
        type: type || 'status',
        visibility: visibility || 'circle',
        content,
        mediaUrl: mediaUrl || null,
        actionTitle: actionTitle || null,
        goalTitle: goalTitle || null,
        goalColor: goalColor || null,
        streak: streak || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        reactions: true
      }
    });
    
    console.log(`✅ New post created by user ${decoded.userId}`);
    
    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Add reaction to post
app.post('/api/posts/:id/react', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { id } = req.params;
    const { emoji } = req.body;
    
    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        postId: id,
        userId: decoded.userId,
        emoji
      }
    });
    
    if (existingReaction) {
      // Remove reaction if it exists (toggle)
      await prisma.reaction.delete({
        where: {
          id: existingReaction.id
        }
      });
      
      res.json({
        success: true,
        message: 'Reaction removed'
      });
    } else {
      // Add new reaction
      const reaction = await prisma.reaction.create({
        data: {
          postId: id,
          userId: decoded.userId,
          emoji
        }
      });
      
      res.status(201).json({
        success: true,
        data: reaction,
        message: 'Reaction added'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { id } = req.params;
    
    // Check if user owns the post
    const post = await prisma.post.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found or you do not have permission to delete it'
      });
    }
    
    // Delete the post (reactions will cascade delete)
    await prisma.post.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler for unknown routes (must be after all other routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
✅ Server running at http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health
🗄️  Database: Connected to Supabase PostgreSQL
🔑 Auth endpoints ready with real database
📝 Goals and Actions endpoints ready
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
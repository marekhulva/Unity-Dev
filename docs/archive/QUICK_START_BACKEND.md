# 🚀 Quick Start: Your First Backend in 1 Day

## For Complete Beginners - Let's Build Your Backend Today!

---

## 📌 What We're Building
A simple backend that your app can talk to, with:
- User login/signup
- Save and retrieve goals
- Save daily actions
- Everything your current app needs!

---

## 🛠 Step 1: Install Tools (30 minutes)

### 1.1 Install Node.js
Go to [nodejs.org](https://nodejs.org/) and download the LTS version.

To check it worked, open terminal and type:
```bash
node --version
# Should show: v18.x.x or higher
```

### 1.2 Install PostgreSQL
**Easiest option:** Use [Supabase](https://supabase.com/) (free PostgreSQL database)
1. Go to [supabase.com](https://supabase.com/)
2. Click "Start your project"
3. Sign up with GitHub
4. Create new project
5. Save your database URL (you'll need it soon!)

**Alternative:** Install PostgreSQL locally from [postgresql.org](https://www.postgresql.org/download/)

---

## 🏗 Step 2: Create Your Backend (1 hour)

### 2.1 Create Project Folder
```bash
# Create and enter folder
mkdir best-backend
cd best-backend
```

### 2.2 Initialize Project
```bash
# Create package.json
npm init -y

# Install what we need
npm install express cors dotenv bcryptjs jsonwebtoken
npm install @prisma/client prisma
npm install -D @types/node @types/express typescript ts-node nodemon
```

### 2.3 Create Basic Files

Create `src/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running! 🚀' });
});

// User routes
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  // For now, just echo back
  res.json({ 
    message: 'User registered!', 
    user: { email, name } 
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  // For now, just echo back
  res.json({ 
    message: 'Login successful!',
    token: 'fake-token-for-now',
    user: { email }
  });
});

// Goals routes
app.get('/api/goals', (req, res) => {
  // Return mock goals for now
  res.json([
    { id: 1, title: 'Lose 10 lbs', metric: 'Weight', deadline: '2024-12-31' },
    { id: 2, title: 'Run 5k', metric: 'Distance', deadline: '2024-11-30' }
  ]);
});

app.post('/api/goals', (req, res) => {
  const { title, metric, deadline } = req.body;
  res.json({ 
    id: Date.now(), 
    title, 
    metric, 
    deadline,
    message: 'Goal created!' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
```

Create `.env`:
```env
PORT=3001
DATABASE_URL="your-supabase-url-here"
JWT_SECRET="my-super-secret-key-change-this"
```

### 2.4 Run Your Backend!
```bash
node src/server.js
```

Visit http://localhost:3001 - you should see:
```json
{ "message": "Backend is running! 🚀" }
```

**🎉 Congratulations! You have a working backend!**

---

## 🔌 Step 3: Connect Your Frontend (1 hour)

### 3.1 Create API Service in Frontend

Create `src/services/api.js` in your React Native app:
```javascript
const API_URL = 'http://localhost:3001';

export const api = {
  // Register user
  async register(email, password, name) {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    return response.json();
  },

  // Login user
  async login(email, password) {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  // Get goals
  async getGoals() {
    const response = await fetch(`${API_URL}/api/goals`);
    return response.json();
  },

  // Create goal
  async createGoal(goal) {
    const response = await fetch(`${API_URL}/api/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });
    return response.json();
  }
};
```

### 3.2 Test It!

In your React Native app, add a test button:
```javascript
import { api } from './services/api';

// In your component
const testBackend = async () => {
  try {
    // Test login
    const loginResult = await api.login('test@test.com', 'password');
    console.log('Login result:', loginResult);
    
    // Test getting goals
    const goals = await api.getGoals();
    console.log('Goals:', goals);
  } catch (error) {
    console.error('Error:', error);
  }
};

// In your JSX
<Button title="Test Backend" onPress={testBackend} />
```

---

## 💾 Step 4: Add Real Database (2 hours)

### 4.1 Setup Prisma (Database Tool)

Initialize Prisma:
```bash
npx prisma init
```

### 4.2 Define Your Database

Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  goals     Goal[]
}

model Goal {
  id        String   @id @default(cuid())
  userId    String
  title     String
  metric    String
  deadline  DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

### 4.3 Create Database Tables
```bash
# Create tables
npx prisma migrate dev --name init

# Generate client
npx prisma generate
```

### 4.4 Update Server to Use Database

Update `src/server.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Real register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });
    
    // Create token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET
    );
    
    res.json({ token, user: { id: user.id, email, name } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Real login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET
    );
    
    res.json({ token, user: { id: user.id, email, name } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## 🚢 Step 5: Deploy to Internet (1 hour)

### Option A: Deploy to Railway (Easiest!)

1. Go to [railway.app](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your backend repo
6. Railway will automatically deploy it!

Add environment variables in Railway dashboard:
- `DATABASE_URL` (Railway provides this)
- `JWT_SECRET` (your secret key)

Your backend will be live at: `https://your-app.railway.app`

### Option B: Deploy to Render

1. Go to [render.com](https://render.com/)
2. Sign up
3. New > Web Service
4. Connect GitHub
5. Select your repo
6. Deploy!

---

## ✅ Your Backend Checklist

By the end of today, you'll have:

```markdown
Morning (2 hours):
□ Node.js installed
□ PostgreSQL database ready (Supabase)
□ Basic Express server running
□ Test endpoints working

Afternoon (2 hours):
□ Database connected with Prisma
□ Real user registration working
□ Real login working
□ Goals can be saved/retrieved

Evening (1 hour):
□ Frontend connected to backend
□ Deployed to Railway/Render
□ Live URL working
```

---

## 🆘 Troubleshooting

### "Cannot connect to backend"
- Check backend is running: `node src/server.js`
- Check URL in frontend: should be `http://localhost:3001`
- Check CORS is enabled in backend

### "Database connection failed"
- Check DATABASE_URL in .env file
- Make sure PostgreSQL is running
- Try the Supabase free option

### "Deploy failed"
- Make sure package.json has start script: `"start": "node src/server.js"`
- Check all environment variables are set in Railway/Render
- Check logs in deployment dashboard

---

## 🎓 Next Steps

Once your basic backend works:

1. **Add more endpoints** for daily actions, social posts
2. **Add file upload** using Cloudinary
3. **Add email sending** using SendGrid
4. **Add real-time updates** using Socket.io
5. **Add push notifications**

---

## 📚 Learn More

### YouTube Tutorials (Watch These!):
1. [Node.js Crash Course](https://www.youtube.com/watch?v=fBNz5xF-Kx4) (1 hour)
2. [Build a REST API](https://www.youtube.com/watch?v=l8WPWK9mS5M) (30 min)
3. [Prisma in 100 Seconds](https://www.youtube.com/watch?v=rLRIB6AF2Dg) (2 min)

### When Stuck:
- Ask ChatGPT: "How do I [your question] in Express.js?"
- Search: "[your error message] Express Prisma"
- Post in: [r/node](https://reddit.com/r/node) or [Stack Overflow](https://stackoverflow.com)

---

## 💪 You Can Do This!

Building a backend seems scary, but it's just:
1. Receiving requests from your app
2. Saving/getting data from database
3. Sending responses back

Start with the basics above, get it working, then improve it step by step.

**Your app will have a real backend by tonight!** 🚀
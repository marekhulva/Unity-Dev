// Social API Endpoints to add to server-db.js

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

// Get user's posts
app.get('/api/posts/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const posts = await prisma.post.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        reactions: true,
        _count: {
          select: {
            reactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
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

// ==================== FOLLOW ENDPOINTS ====================

// Follow a user
app.post('/api/follow/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { userId } = req.params;
    
    if (decoded.userId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot follow yourself'
      });
    }
    
    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: decoded.userId,
        followingId: userId
      }
    });
    
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: 'Already following this user'
      });
    }
    
    const follow = await prisma.follow.create({
      data: {
        followerId: decoded.userId,
        followingId: userId
      }
    });
    
    res.status(201).json({
      success: true,
      data: follow,
      message: 'Now following user'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Unfollow a user
app.delete('/api/follow/:userId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const { userId } = req.params;
    
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: decoded.userId,
        followingId: userId
      }
    });
    
    if (!follow) {
      return res.status(404).json({
        success: false,
        error: 'Not following this user'
      });
    }
    
    await prisma.follow.delete({
      where: { id: follow.id }
    });
    
    res.json({
      success: true,
      message: 'Unfollowed user'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});
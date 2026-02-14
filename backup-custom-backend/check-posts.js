const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPosts() {
  try {
    const posts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    });
    
    console.log('\n📝 Latest posts in database:');
    posts.forEach(post => {
      console.log(`\n------- Post ${post.id} -------`);
      console.log(`Type: ${post.type}`);
      console.log(`Content: "${post.content}"`);
      console.log(`User: ${post.user.name}`);
      console.log(`Visibility: ${post.visibility}`);
      console.log(`Created: ${post.createdAt}`);
      if (post.actionTitle) console.log(`Action: ${post.actionTitle}`);
      if (post.goalTitle) console.log(`Goal: ${post.goalTitle}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPosts();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');
    
    // Delete in order due to foreign key constraints
    await prisma.reaction.deleteMany({});
    console.log('✅ Deleted all reactions');
    
    await prisma.post.deleteMany({});
    console.log('✅ Deleted all posts');
    
    await prisma.streak.deleteMany({});
    console.log('✅ Deleted all streaks');
    
    await prisma.action.deleteMany({});
    console.log('✅ Deleted all actions');
    
    await prisma.milestone.deleteMany({});
    console.log('✅ Deleted all milestones');
    
    await prisma.goal.deleteMany({});
    console.log('✅ Deleted all goals');
    
    // Keep the test user for convenience
    console.log('\n📌 Keeping test user: first@user.com');
    
    console.log('\n✨ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
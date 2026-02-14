const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('🗑️  Clearing all data from database...\n');
    
    // Delete in order to respect foreign key constraints
    const deletedReactions = await prisma.reaction.deleteMany();
    console.log(`✅ Deleted ${deletedReactions.count} reactions`);
    
    const deletedPosts = await prisma.post.deleteMany();
    console.log(`✅ Deleted ${deletedPosts.count} posts`);
    
    const deletedStreaks = await prisma.streak.deleteMany();
    console.log(`✅ Deleted ${deletedStreaks.count} streaks`);
    
    const deletedActions = await prisma.action.deleteMany();
    console.log(`✅ Deleted ${deletedActions.count} actions`);
    
    const deletedMilestones = await prisma.milestone.deleteMany();
    console.log(`✅ Deleted ${deletedMilestones.count} milestones`);
    
    const deletedGoals = await prisma.goal.deleteMany();
    console.log(`✅ Deleted ${deletedGoals.count} goals`);
    
    const deletedFollows = await prisma.follow.deleteMany();
    console.log(`✅ Deleted ${deletedFollows.count} follows`);
    
    const deletedCircleMembers = await prisma.circleMember.deleteMany();
    console.log(`✅ Deleted ${deletedCircleMembers.count} circle members`);
    
    const deletedCircles = await prisma.circle.deleteMany();
    console.log(`✅ Deleted ${deletedCircles.count} circles`);
    
    const deletedUsers = await prisma.user.deleteMany();
    console.log(`✅ Deleted ${deletedUsers.count} users`);
    
    console.log('\n🎉 Database cleared successfully! You can start fresh now.');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
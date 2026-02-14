const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const userCount = await prisma.user.count();
    const goalCount = await prisma.goal.count();
    const actionCount = await prisma.action.count();
    
    console.log('Database contents:');
    console.log('Users:', userCount);
    console.log('Goals:', goalCount);
    console.log('Actions:', actionCount);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany();
      console.log('\nUsers in database:');
      users.forEach(u => console.log(`- ${u.email} (${u.name})`));
    }
    
    if (goalCount > 0) {
      const goals = await prisma.goal.findMany();
      console.log('\nGoals in database:');
      goals.forEach(g => console.log(`- ${g.title}`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
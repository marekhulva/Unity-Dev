const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPostTypes() {
  try {
    const postTypes = await prisma.post.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    });
    
    console.log('\n📊 Post types in database:');
    postTypes.forEach(pt => {
      console.log(`Type "${pt.type}": ${pt._count.type} posts`);
    });
    
    // Get one checkin post if exists
    const checkinPost = await prisma.post.findFirst({
      where: { type: 'checkin' },
      include: { user: true }
    });
    
    if (checkinPost) {
      console.log('\n✅ Sample checkin post:');
      console.log(checkinPost);
    } else {
      console.log('\n❌ No checkin posts found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostTypes();
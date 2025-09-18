import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 检查是否已经有用户
  const userCount = await prisma.user.count();

  if (userCount === 0) {
    console.log('No existing users, will seed via user.seed.ts');
  } else {
    console.log(`Found ${userCount} existing users, skipping seed`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

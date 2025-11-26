import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      name: true,
      organization: {
        select: { name: true, settings: true }
      }
    },
    take: 10
  });

  console.log('=== Users and Organization Settings ===');
  for (const user of users) {
    console.log(`\nUser: ${user.name} (${user.email})`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Org: ${user.organization?.name}`);
    console.log(`  Org Settings:`, user.organization?.settings);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

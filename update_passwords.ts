import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash123456 = await bcrypt.hash('123456', 12);
  const hashAdmin123 = await bcrypt.hash('admin123', 12);

  await prisma.user.updateMany({
    where: { email: 'admin@apexpm.com' },
    data: { passwordHash: hash123456 }
  });

  await prisma.user.updateMany({
    where: { email: { in: ['manager@apexpm.com', 'owner@apexpm.com', 'tenant@apexpm.com', 'staff@apexpm.com', 'collection@apexpm.com'] } },
    data: { passwordHash: hashAdmin123 }
  });

  console.log('Successfully updated password hashes in the database!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

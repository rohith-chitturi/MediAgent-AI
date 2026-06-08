const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@cityhospital.com' },
    include: { role: true }
  });

  if (!user) {
    console.log('❌ USER NOT FOUND - re-running seed needed');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ User found:', user.name, '| Role:', user.role.name);
  const ok = await bcrypt.compare('password123', user.passwordHash);
  console.log('Password valid:', ok);

  if (!ok) {
    console.log('❌ Hash mismatch — fixing password...');
    const newHash = await bcrypt.hash('password123', 10);
    await prisma.user.updateMany({
      data: { passwordHash: newHash }
    });
    console.log('✅ All user passwords reset to password123');
  }

  await prisma.$disconnect();
}

check().catch(console.error);

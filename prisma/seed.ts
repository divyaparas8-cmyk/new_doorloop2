import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Clean Database Seeding (SuperAdmin Only)...');

  console.log('🧹 Clearing old tables...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE permissions;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE users;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE companies;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE roles;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE properties;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE buildings;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE units;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE owners;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE leases;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE bank_accounts;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE coa_accounts;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE vendors;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE applications;');
  console.log('✨ All old tables truncated successfully.');

  // 1. Create System Roles
  console.log('🔐 Creating system roles...');
  const adminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Master account with full administrative permissions.',
      isCustom: false,
    },
  });

  const ownerRole = await prisma.role.create({
    data: {
      name: 'Owner',
      description: 'Owner access to financial statements and payouts.',
      isCustom: false,
    },
  });

  const tenantRole = await prisma.role.create({
    data: {
      name: 'Tenant',
      description: 'Tenant portal access for rent payments and maintenance.',
      isCustom: false,
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      name: 'Maintenance Staff',
      description: 'Maintenance dispatcher and tech access.',
      isCustom: false,
    },
  });

  const collectionRole = await prisma.role.create({
    data: {
      name: 'Collection Manager',
      description: 'Collection manager access.',
      isCustom: false,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'Property Manager',
      description: 'Property manager access with operational permissions.',
      isCustom: false,
    },
  });

  // 2. Create System Permissions for Super Admin & Property Manager
  console.log('🛡️ Creating system permissions...');
  const modules = [
    'Dashboard',
    'Properties',
    'Leasing',
    'Tenants',
    'Owners',
    'Rent & Payments',
    'Accounting',
    'Maintenance',
    'Documents',
    'Reports',
    'Communication',
    'Company Settings',
  ];

  for (const moduleName of modules) {
    await prisma.permission.create({
      data: {
        roleId: adminRole.id,
        module: moduleName,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canExport: true,
      },
    });

    await prisma.permission.create({
      data: {
        roleId: managerRole.id,
        module: moduleName,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canExport: true,
      },
    });
  }

  // 3. Create Main Company
  console.log('🏢 Creating main company...');
  const company = await prisma.company.create({
    data: {
      name: 'Tab Property Management',
      code: 'TABPM',
      contactName: 'Super Admin',
      email: 'contact@apexpm.com',
      phone: '(512) 555-0100',
      planName: 'Enterprise SaaS',
      storageUsed: '0 GB',
      status: 'Active',
    },
  });

  // 4. Create ONLY Super Admin User
  console.log('👤 Creating Super Admin user...');
  const passwordHash = '$2b$12$40JauO0pCs/qcnmGiUv/3.pHpsCYU5Ah9ZmTZV2Z1PvMvFqPAHt.u'; // password: '123456'

  await prisma.user.create({
    data: {
      email: 'admin@apexpm.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '(512) 555-0100',
      roleId: adminRole.id,
      status: 'Active',
      companyId: company.id,
    },
  });

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('✅ Clean seeding complete! Only SuperAdmin user exists.');
}

main()
  .catch((e) => {
    console.error('❌ Database Seeding Failed:', e);
    (globalThis as any).process?.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

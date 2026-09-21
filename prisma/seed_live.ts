import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Clean Database Seeding (SuperAdmin Only)...');

  // Disable FK checks for safe cleaning
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.$executeRawUnsafe('DELETE FROM permissions;');
  await prisma.$executeRawUnsafe('DELETE FROM users;');
  await prisma.$executeRawUnsafe('DELETE FROM companies;');
  await prisma.$executeRawUnsafe('DELETE FROM roles;');
  await prisma.$executeRawUnsafe('DELETE FROM properties;');
  await prisma.$executeRawUnsafe('DELETE FROM buildings;');
  await prisma.$executeRawUnsafe('DELETE FROM units;');
  await prisma.$executeRawUnsafe('DELETE FROM owners;');
  await prisma.$executeRawUnsafe('DELETE FROM leases;');
  await prisma.$executeRawUnsafe('DELETE FROM bank_accounts;');
  await prisma.$executeRawUnsafe('DELETE FROM coa_accounts;');
  await prisma.$executeRawUnsafe('DELETE FROM vendors;');
  await prisma.$executeRawUnsafe('DELETE FROM applications;');

  // 1. Create System Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Master account with full administrative permissions.',
      isCustom: false,
    },
  });

  const ownerRole = await prisma.role.upsert({
    where: { name: 'Owner' },
    update: {},
    create: {
      name: 'Owner',
      description: 'Owner access to financial statements and payouts.',
      isCustom: false,
    },
  });

  const tenantRole = await prisma.role.upsert({
    where: { name: 'Tenant' },
    update: {},
    create: {
      name: 'Tenant',
      description: 'Tenant portal access for rent payments and maintenance.',
      isCustom: false,
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'Maintenance Staff' },
    update: {},
    create: {
      name: 'Maintenance Staff',
      description: 'Maintenance dispatcher and tech access.',
      isCustom: false,
    },
  });

  const collectionRole = await prisma.role.upsert({
    where: { name: 'Collection Manager' },
    update: {},
    create: {
      name: 'Collection Manager',
      description: 'Collection manager access.',
      isCustom: false,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Property Manager' },
    update: {},
    create: {
      name: 'Property Manager',
      description: 'Property manager access with operational permissions.',
      isCustom: false,
    },
  });

  // 2. Create System Permissions for Super Admin & Property Manager
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
    await prisma.permission.upsert({
      where: {
        roleId_module: {
          roleId: adminRole.id,
          module: moduleName,
        },
      },
      update: {},
      create: {
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

    await prisma.permission.upsert({
      where: {
        roleId_module: {
          roleId: managerRole.id,
          module: moduleName,
        },
      },
      update: {},
      create: {
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
  const company = await prisma.company.upsert({
    where: { email: 'contact@apexpm.com' },
    update: {},
    create: {
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
  const passwordHash = '$2b$12$40JauO0pCs/qcnmGiUv/3.pHpsCYU5Ah9ZmTZV2Z1PvMvFqPAHt.u'; // password: '123456'

  await prisma.user.upsert({
    where: { email: 'admin@apexpm.com' },
    update: { roleId: adminRole.id, companyId: company.id, passwordHash },
    create: {
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

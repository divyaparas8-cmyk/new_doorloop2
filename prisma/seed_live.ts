import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Avenix Code Live Database Seeding...');

  // 1. Clean old data safely with FK checks disabled
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.$executeRawUnsafe('DELETE FROM permissions;');
  await prisma.$executeRawUnsafe('DELETE FROM users;');
  await prisma.$executeRawUnsafe('DELETE FROM companies;');
  await prisma.$executeRawUnsafe('DELETE FROM roles;');
  await prisma.$executeRawUnsafe('DELETE FROM properties;');
  await prisma.$executeRawUnsafe('DELETE FROM buildings;');
  await prisma.$executeRawUnsafe('DELETE FROM units;');
  await prisma.$executeRawUnsafe('DELETE FROM owners;');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  // 2. Create Roles
  const adminRole = await prisma.role.create({
    data: { name: 'Super Admin', description: 'Master account with full administrative permissions.', isCustom: false },
  });

  const managerRole = await prisma.role.create({
    data: { name: 'Property Manager', description: 'Property manager access with operational permissions.', isCustom: false },
  });

  const ownerRole = await prisma.role.create({
    data: { name: 'Owner', description: 'Owner access to financial statements and payouts.', isCustom: false },
  });

  const tenantRole = await prisma.role.create({
    data: { name: 'Tenant', description: 'Tenant portal access for rent payments and maintenance.', isCustom: false },
  });

  const staffRole = await prisma.role.create({
    data: { name: 'Maintenance Staff', description: 'Maintenance dispatcher and tech access.', isCustom: false },
  });

  const collectionRole = await prisma.role.create({
    data: { name: 'Collection Manager', description: 'Collection manager access.', isCustom: false },
  });

  // 3. Create Companies
  const apex = await prisma.company.create({
    data: {
      name: 'Apex Property Management',
      code: 'APEX',
      contactName: 'Sarah Davis',
      email: 'contact@apexpm.com',
      phone: '(512) 555-0100',
      planName: 'Enterprise SaaS',
      storageUsed: '4.8 GB',
      status: 'Active',
    },
  });

  const skyline = await prisma.company.create({
    data: {
      name: 'Skyline Investment Group',
      code: 'SKYL',
      contactName: 'Robert Vance',
      email: 'info@skylineig.com',
      phone: '(415) 555-0199',
      planName: 'Pro Plan',
      storageUsed: '2.1 GB',
      status: 'Active',
    },
  });

  // 4. Create Users (Sequential Create)
  const pwdAdmin = await bcrypt.hash('123456', 12);
  const pwdDefault = await bcrypt.hash('admin123', 12);

  const userList = [
    {
      email: 'admin@apexpm.com',
      passwordHash: pwdAdmin,
      firstName: 'John',
      lastName: 'Doe (Super Admin)',
      phone: '(512) 555-0100',
      roleId: adminRole.id,
      status: 'Active',
      companyId: apex.id,
    },
    {
      email: 'manager@apexpm.com',
      passwordHash: pwdDefault,
      firstName: 'Sarah',
      lastName: 'Davis (Property Manager)',
      phone: '(512) 555-0101',
      roleId: managerRole.id,
      status: 'Active',
      companyId: apex.id,
    },
    {
      email: 'owner@apexpm.com',
      passwordHash: pwdDefault,
      firstName: 'Lakeside',
      lastName: 'Development (Owner)',
      phone: '(512) 555-0102',
      roleId: ownerRole.id,
      status: 'Active',
      companyId: apex.id,
    },
    {
      email: 'tenant@apexpm.com',
      passwordHash: pwdDefault,
      firstName: 'Robert',
      lastName: 'Johnson (Tenant)',
      phone: '(512) 555-0103',
      roleId: tenantRole.id,
      status: 'Active',
      companyId: apex.id,
    },
    {
      email: 'staff@apexpm.com',
      passwordHash: pwdDefault,
      firstName: 'Technician',
      lastName: 'Lead (Staff)',
      phone: '(512) 555-0104',
      roleId: staffRole.id,
      status: 'Active',
      companyId: apex.id,
    },
    {
      email: 'collection@apexpm.com',
      passwordHash: pwdDefault,
      firstName: 'Michael',
      lastName: 'Collection (Staff)',
      phone: '(512) 555-0105',
      roleId: collectionRole.id,
      status: 'Active',
      companyId: apex.id,
    },
    {
      email: 'manager@skylineig.com',
      passwordHash: pwdDefault,
      firstName: 'Robert',
      lastName: 'Vance (Skyline Manager)',
      phone: '(415) 555-0199',
      roleId: managerRole.id,
      status: 'Active',
      companyId: skyline.id,
    },
  ];

  for (const u of userList) {
    await prisma.user.create({ data: u });
    console.log(`👤 Created user: ${u.email}`);
  }

  // 5. Create Permissions
  const modules = [
    'Dashboard', 'Properties', 'Leasing', 'Tenants', 'Owners',
    'Rent & Payments', 'Accounting', 'Maintenance', 'Documents',
    'Reports', 'Communication', 'Company Settings'
  ];

  for (const mod of modules) {
    await prisma.permission.create({
      data: {
        roleId: adminRole.id,
        module: mod,
        canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true,
      },
    });
    await prisma.permission.create({
      data: {
        roleId: managerRole.id,
        module: mod,
        canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true,
      },
    });
  }

  console.log('✅ Live Railway Database Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Live Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

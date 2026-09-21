import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Clean Database Seeding (SuperAdmin Only)...');

  console.log('🧹 Disabling Foreign Key Checks and wiping all tables...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'permissions', 'user_assignments', 'users', 'company_users', 'companies', 'roles',
    'properties', 'buildings', 'units', 'owners', 'tenants', 'leases', 'rent_payments',
    'lease_renewals', 'coa_accounts', 'journal_entries', 'journal_entry_lines', 'vendors',
    'work_orders', 'owner_distributions', 'audit_logs', 'announcements', 'insurance_policies',
    'promotions', 'notifications', 'documents', 'ai_chat_logs', 'bank_accounts', 'subscription_plans',
    'security_policies', 'payment_plans', 'crm_leads', 'screening_reports', 'violations',
    'applications', 'invoices', 'service_requests', 'saas_plans', 'saas_invoices', 'platform_settings',
    'owner_documents', 'owner_messages', 'tenant_documents', 'tenant_messages', 'tenant_notifications',
    'staff_profiles', 'charges', 'deposits', 'expenses', 'maintenance_requests', 'move_ins',
    'inspection_templates', 'inspection_template_rooms', 'inspection_template_items', 'inspections'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
    } catch {
      await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`).catch(() => {});
    }
  }

  console.log('✨ All database tables cleared successfully.');

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

  // 2. Create System Permissions for Super Admin & Property Manager (Bulk Insert)
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

  const permData: any[] = [];
  for (const moduleName of modules) {
    permData.push({
      roleId: adminRole.id,
      module: moduleName,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canExport: true,
    });
    permData.push({
      roleId: managerRole.id,
      module: moduleName,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canExport: true,
    });
  }

  await Promise.all(permData.map(p => prisma.permission.create({ data: p }).catch(() => {})));

  // 3. Create ONLY Super Admin User
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
      companyId: null,
    },
  });

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('✅ Clean seeding complete! Only SuperAdmin user exists in Database.');
}

main()
  .catch((e) => {
    console.error('❌ Database Seeding Failed:', e);
    (globalThis as any).process?.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

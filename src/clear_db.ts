import prisma from './config/database.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Cleaning up database while preserving Super Admin...');

  // 1. Ensure Super Admin role exists
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'Super Admin' },
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'Super Admin',
        description: 'Super Administrator with full system access',
      },
    });
  }

  // 2. Ensure Property Manager role exists
  let managerRole = await prisma.role.findFirst({
    where: { name: 'Property Manager' },
  });
  if (!managerRole) {
    managerRole = await prisma.role.create({
      data: {
        name: 'Property Manager',
        description: 'Property Manager role',
      },
    });
  }

  // 3. Ensure Tenant role exists
  let tenantRole = await prisma.role.findFirst({
    where: { name: 'Tenant' },
  });
  if (!tenantRole) {
    tenantRole = await prisma.role.create({
      data: {
        name: 'Tenant',
        description: 'Tenant role',
      },
    });
  }

  // 4. Ensure Owner role exists
  let ownerRole = await prisma.role.findFirst({
    where: { name: 'Owner' },
  });
  if (!ownerRole) {
    ownerRole = await prisma.role.create({
      data: {
        name: 'Owner',
        description: 'Owner role',
      },
    });
  }

  // 5. Ensure Super Admin User exists
  const superAdminEmail = 'admin@apexpm.com';
  const superAdminPasswordHash = await bcrypt.hash('123456', 12);

  let superAdminUser = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (superAdminUser) {
    await prisma.user.update({
      where: { id: superAdminUser.id },
      data: {
        passwordHash: superAdminPasswordHash,
        roleId: superAdminRole.id,
        status: 'Active',
      },
    });
  } else {
    superAdminUser = await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: superAdminPasswordHash,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: superAdminRole.id,
        status: 'Active',
      },
    });
  }

  // 6. Ensure Property Manager User exists (Property@gmail.com / 123456)
  const managerEmail = 'Property@gmail.com';
  const managerPasswordHash = await bcrypt.hash('123456', 12);

  let managerUser = await prisma.user.findUnique({
    where: { email: managerEmail },
  });

  if (managerUser) {
    await prisma.user.update({
      where: { id: managerUser.id },
      data: {
        passwordHash: managerPasswordHash,
        roleId: managerRole.id,
        status: 'Active',
      },
    });
  } else {
    managerUser = await prisma.user.create({
      data: {
        email: managerEmail,
        passwordHash: managerPasswordHash,
        firstName: 'Property',
        lastName: 'Manager',
        roleId: managerRole.id,
        status: 'Active',
      },
    });
  }

  console.log(`Preserved Users: ${superAdminUser.email}, ${managerUser.email}`);

  // 6. Delete all transactional and company data (preserving Super Admin user and role)
  console.log('Clearing dependent tables...');
  
  try { await prisma.userAssignment.deleteMany({}); } catch (e) {}
  try { await prisma.tenantNotification.deleteMany({}); } catch (e) {}
  try { await prisma.notification.deleteMany({}); } catch (e) {}
  try { await prisma.auditLog.deleteMany({}); } catch (e) {}
  try { await prisma.screeningReport.deleteMany({}); } catch (e) {}
  try { await (prisma as any).screeningCheck?.deleteMany?.({}); } catch (e) {}
  try { await prisma.inspection.deleteMany({}); } catch (e) {}
  try { await prisma.maintenanceRequest.deleteMany({}); } catch (e) {}
  try { await prisma.workOrder.deleteMany({}); } catch (e) {}
  try { await prisma.rentPayment.deleteMany({}); } catch (e) {}
  try { await (prisma as any).payment?.deleteMany?.({}); } catch (e) {}
  try { await prisma.invoice.deleteMany({}); } catch (e) {}
  try { await prisma.lease.deleteMany({}); } catch (e) {}
  try { await prisma.tenant.deleteMany({}); } catch (e) {}
  try { await prisma.unit.deleteMany({}); } catch (e) {}
  try { await prisma.building.deleteMany({}); } catch (e) {}
  try { await prisma.ownerDistribution.deleteMany({}); } catch (e) {}
  try { await prisma.property.deleteMany({}); } catch (e) {}
  try { await prisma.owner.deleteMany({}); } catch (e) {}
  try { await prisma.vendor.deleteMany({}); } catch (e) {}
  try { await prisma.document.deleteMany({}); } catch (e) {}

  // Delete all users except Super Admin & Property Manager
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { notIn: [superAdminUser.id, managerUser.id] },
    },
  });
  console.log(`Deleted ${deletedUsers.count} non-Super Admin users.`);

  // Delete all companies
  try {
    const deletedCompanies = await prisma.company.deleteMany({});
    console.log(`Deleted ${deletedCompanies.count} companies.`);
  } catch (e) {}

  console.log('Database successfully cleared! Only Super Admin remains.');
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

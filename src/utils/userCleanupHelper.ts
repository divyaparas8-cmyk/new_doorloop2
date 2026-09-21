import prisma from '../config/database';

/**
 * Normalizes email to lowercase and trimmed string.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Removes all orphaned User, CompanyUser, Tenant, Owner, and Vendor records matching the email.
 * Nullifies any AuditLog.userId references first to prevent foreign key errors.
 */
export async function cleanupUserByEmail(db: any, email: string): Promise<void> {
  if (!email) return;
  const cleanEmail = normalizeEmail(email);

  // 1. Find all matching User IDs
  const matchingUsers = await db.user.findMany({
    where: { email: cleanEmail },
    select: { id: true },
  });

  const userIds = matchingUsers.map((u: any) => u.id);

  // 2. Nullify userId in AuditLog for these users to prevent foreign key violations
  if (userIds.length > 0) {
    await db.auditLog.updateMany({
      where: { userId: { in: userIds } },
      data: { userId: null },
    });
  }

  // 3. Delete matching records across User, CompanyUser, Tenant, Owner, Vendor by email
  await db.user.deleteMany({
    where: { email: cleanEmail },
  });

  await db.companyUser.deleteMany({
    where: { email: cleanEmail },
  });

  await db.tenant.deleteMany({
    where: { email: cleanEmail },
  });

  await db.owner.deleteMany({
    where: { email: cleanEmail },
  });

  await db.vendor.deleteMany({
    where: { email: cleanEmail },
  });
}

/**
 * Checks if there are orphaned User or CompanyUser records for this email and purges them.
 * Useful before creating a new entity or user with an email.
 */
export async function purgeOrphanedUserByEmail(db: any, email: string): Promise<void> {
  if (!email) return;
  const cleanEmail = normalizeEmail(email);

  const existingUser = await db.user.findFirst({
    where: { email: cleanEmail },
  });

  const existingCompanyUser = await db.companyUser.findFirst({
    where: { email: cleanEmail },
  });

  if (existingUser || existingCompanyUser) {
    // Check if linked to active Tenant, Owner, Vendor, or Company
    const linkedTenant = await db.tenant.findFirst({ where: { email: cleanEmail } });
    const linkedOwner = await db.owner.findFirst({ where: { email: cleanEmail } });
    const linkedVendor = await db.vendor.findFirst({ where: { email: cleanEmail } });

    // If there are no active main entity links, purge the orphaned user records
    if (!linkedTenant && !linkedOwner && !linkedVendor) {
      await cleanupUserByEmail(db, cleanEmail);
    }
  }
}

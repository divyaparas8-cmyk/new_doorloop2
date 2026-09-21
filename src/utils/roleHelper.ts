import prisma from '../config/database';

export const STANDARD_ROLES = [
  'Property Manager',
  'Owner',
  'Tenant',
  'Maintenance Staff',
  'Admin',
  'Super Admin',
  'Collection Staff',
  'Leasing Staff',
  'Accounting',
] as const;

/**
 * Ensures that a Role record with the exact given name exists in the database.
 * Prevents falling back to arbitrary roles (like Tenant) when role assignment fails.
 */
export async function ensureRole(roleName: string) {
  const normalized = roleName.trim();

  // 1. Exact match by name
  let role = await prisma.role.findFirst({
    where: { name: normalized },
  });

  if (role) return role;

  // 2. Case-insensitive search fallback
  const allRoles = await prisma.role.findMany();
  role = allRoles.find((r) => r.name.toLowerCase() === normalized.toLowerCase()) || null;

  if (role) return role;

  // 3. Create role if not found
  role = await prisma.role.create({
    data: {
      name: normalized,
      description: `${normalized} Role`,
    },
  });

  return role;
}

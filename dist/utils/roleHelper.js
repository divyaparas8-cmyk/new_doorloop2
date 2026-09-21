"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_ROLES = void 0;
exports.ensureRole = ensureRole;
const database_1 = __importDefault(require("../config/database"));
exports.STANDARD_ROLES = [
    'Property Manager',
    'Owner',
    'Tenant',
    'Maintenance Staff',
    'Admin',
    'Super Admin',
    'Collection Staff',
    'Leasing Staff',
    'Accounting',
];
/**
 * Ensures that a Role record with the exact given name exists in the database.
 * Prevents falling back to arbitrary roles (like Tenant) when role assignment fails.
 */
async function ensureRole(roleName) {
    const normalized = roleName.trim();
    // 1. Exact match by name
    let role = await database_1.default.role.findFirst({
        where: { name: normalized },
    });
    if (role)
        return role;
    // 2. Case-insensitive search fallback
    const allRoles = await database_1.default.role.findMany();
    role = allRoles.find((r) => r.name.toLowerCase() === normalized.toLowerCase()) || null;
    if (role)
        return role;
    // 3. Create role if not found
    role = await database_1.default.role.create({
        data: {
            name: normalized,
            description: `${normalized} Role`,
        },
    });
    return role;
}

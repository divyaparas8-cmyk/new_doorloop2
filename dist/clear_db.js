"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_js_1 = __importDefault(require("./config/database.js"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function main() {
    console.log('Cleaning up database while preserving Super Admin...');
    // 1. Ensure Super Admin role exists
    let superAdminRole = await database_js_1.default.role.findFirst({
        where: { name: 'Super Admin' },
    });
    if (!superAdminRole) {
        superAdminRole = await database_js_1.default.role.create({
            data: {
                name: 'Super Admin',
                description: 'Super Administrator with full system access',
            },
        });
    }
    // 2. Ensure Property Manager role exists
    let managerRole = await database_js_1.default.role.findFirst({
        where: { name: 'Property Manager' },
    });
    if (!managerRole) {
        managerRole = await database_js_1.default.role.create({
            data: {
                name: 'Property Manager',
                description: 'Property Manager role',
            },
        });
    }
    // 3. Ensure Tenant role exists
    let tenantRole = await database_js_1.default.role.findFirst({
        where: { name: 'Tenant' },
    });
    if (!tenantRole) {
        tenantRole = await database_js_1.default.role.create({
            data: {
                name: 'Tenant',
                description: 'Tenant role',
            },
        });
    }
    // 4. Ensure Owner role exists
    let ownerRole = await database_js_1.default.role.findFirst({
        where: { name: 'Owner' },
    });
    if (!ownerRole) {
        ownerRole = await database_js_1.default.role.create({
            data: {
                name: 'Owner',
                description: 'Owner role',
            },
        });
    }
    // 5. Ensure Super Admin User exists
    const superAdminEmail = 'admin@apexpm.com';
    const superAdminPasswordHash = await bcrypt_1.default.hash('123456', 12);
    let superAdminUser = await database_js_1.default.user.findUnique({
        where: { email: superAdminEmail },
    });
    if (superAdminUser) {
        await database_js_1.default.user.update({
            where: { id: superAdminUser.id },
            data: {
                passwordHash: superAdminPasswordHash,
                roleId: superAdminRole.id,
                status: 'Active',
            },
        });
    }
    else {
        superAdminUser = await database_js_1.default.user.create({
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
    const managerPasswordHash = await bcrypt_1.default.hash('123456', 12);
    let managerUser = await database_js_1.default.user.findUnique({
        where: { email: managerEmail },
    });
    if (managerUser) {
        await database_js_1.default.user.update({
            where: { id: managerUser.id },
            data: {
                passwordHash: managerPasswordHash,
                roleId: managerRole.id,
                status: 'Active',
            },
        });
    }
    else {
        managerUser = await database_js_1.default.user.create({
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
    try {
        await database_js_1.default.userAssignment.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.tenantNotification.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.notification.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.auditLog.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.screeningReport.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.screeningCheck?.deleteMany?.({});
    }
    catch (e) { }
    try {
        await database_js_1.default.inspection.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.maintenanceRequest.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.workOrder.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.rentPayment.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.payment?.deleteMany?.({});
    }
    catch (e) { }
    try {
        await database_js_1.default.invoice.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.lease.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.tenant.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.unit.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.building.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.ownerDistribution.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.property.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.owner.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.vendor.deleteMany({});
    }
    catch (e) { }
    try {
        await database_js_1.default.document.deleteMany({});
    }
    catch (e) { }
    // Delete all users except Super Admin & Property Manager
    const deletedUsers = await database_js_1.default.user.deleteMany({
        where: {
            id: { notIn: [superAdminUser.id, managerUser.id] },
        },
    });
    console.log(`Deleted ${deletedUsers.count} non-Super Admin users.`);
    // Delete all companies
    try {
        const deletedCompanies = await database_js_1.default.company.deleteMany({});
        console.log(`Deleted ${deletedCompanies.count} companies.`);
    }
    catch (e) { }
    console.log('Database successfully cleared! Only Super Admin remains.');
}
main()
    .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
})
    .finally(async () => {
    await database_js_1.default.$disconnect();
});

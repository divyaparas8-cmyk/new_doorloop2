import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcrypt';
import { getManagerCompanyId } from '../utils/companyHelper';
import { AppError } from '../utils/appError';
import { ensureRole } from '../utils/roleHelper';
import { cleanupUserByEmail, purgeOrphanedUserByEmail } from '../utils/userCleanupHelper';

export class VendorController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const vendors = await prisma.vendor.findMany({
        where: companyId ? { companyId } : {},
        include: {
          workOrders: true,
        },
      });

      // Fetch matching login users to attach their status
      const emails = vendors.map((v) => v.email).filter(Boolean);
      const matchedUsers = await prisma.user.findMany({
        where: {
          email: { in: emails },
          companyId: companyId || undefined,
        },
      });

      const userMap = new Map(matchedUsers.map((u) => [u.email.toLowerCase(), u]));

      const vendorsWithUserStatus = vendors.map((v) => {
        const matchingUser = v.email ? userMap.get(v.email.toLowerCase()) : null;
        return {
          ...v,
          userStatus: matchingUser ? matchingUser.status : 'No Login',
          userId: matchingUser ? matchingUser.id : null,
        };
      });

      return sendSuccess({ res, data: vendorsWithUserStatus });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { companyName, contactName, email, phone, serviceType, rating, password } = req.body;
      const companyId = await getManagerCompanyId(req, req.body.companyId || req.user?.companyId);

      if (email) {
        await purgeOrphanedUserByEmail(prisma, email);

        const existingUser = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase() } });
        if (existingUser) {
          throw new AppError('Email address is already registered.', 400, 'DUPLICATE_EMAIL');
        }

        const existingVendor = await prisma.vendor.findFirst({ where: { email: email.trim().toLowerCase() } });
        if (existingVendor) {
          throw new AppError('Email address is already registered.', 400, 'DUPLICATE_EMAIL');
        }
      }

      const vendor = await prisma.vendor.create({
        data: {
          companyName,
          contactName,
          email,
          phone,
          serviceType,
          rating: rating || 5.0,
          companyId,
        },
      });

      // Automatically create matching login user for this vendor (Maintenance Staff role)
      if (email) {
        const roleObj = await ensureRole('Maintenance Staff');

        if (roleObj) {
          const passwordHash = await bcrypt.hash(password || 'vendor123', 12);
          const nameParts = (contactName || companyName || 'Vendor').trim().split(/\s+/);
          const firstName = nameParts[0] || 'Vendor';
          const lastName = nameParts.slice(1).join(' ') || 'Partner';

          await prisma.user.create({
            data: {
              email: email.trim().toLowerCase(),
              passwordHash,
              firstName,
              lastName,
              phone: phone || '',
              roleId: roleObj.id,
              companyId,
            },
          });
        }
      }
      return sendSuccess({ res, statusCode: 201, data: vendor });
    } catch (error: any) {
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        return next(new AppError('Email address is already registered.', 400, 'DUPLICATE_EMAIL'));
      }
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { companyName, contactName, email, phone, serviceType, rating } = req.body;
      const id = req.params.id as string;
      const companyId = req.user?.companyId;

      if (companyId) {
        const check = await prisma.vendor.findFirst({
          where: { id, companyId },
        });
        if (!check) throw new Error('Vendor not found.');
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: { companyName, contactName, email, phone, serviceType, rating },
      });
      return sendSuccess({ res, data: vendor });
    } catch (error: any) {
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        return next(new AppError('Email address is already registered.', 400, 'DUPLICATE_EMAIL'));
      }
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const companyId = req.user?.companyId;

      const vendor = await prisma.vendor.findFirst({
        where: companyId ? { id, companyId } : { id },
      });
      if (!vendor) throw new Error('Vendor not found.');

      if (vendor.email) {
        await cleanupUserByEmail(prisma, vendor.email);
      } else {
        await prisma.vendor.delete({
          where: { id },
        });
      }

      return sendSuccess({ res, data: { success: true } });
    } catch (error) {
      next(error);
    }
  }
}

export const vendorController = new VendorController();

import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { generateAutoInvoices } from '../services/billingAutomation.service';

class InvoiceController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Auto-generate rent invoices (catch-up)
      await generateAutoInvoices();

      const companyId = req.user?.companyId;
      const userRole = req.user?.roleName || (req.user as any)?.role;
      const userEmail = req.user?.email;

      let whereClause: any = companyId ? { companyId } : {};

      if (userRole === 'Tenant' && userEmail) {
        const tenant = await prisma.tenant.findFirst({
          where: { email: userEmail },
        });
        if (tenant) {
          whereClause = { tenantId: tenant.id };
        } else {
          return sendSuccess({ res, data: [] });
        }
      }

      let invoices = await prisma.invoice.findMany({
        where: whereClause,
        include: {
          tenant: true,
        },
        orderBy: { createdAt: 'desc' },
      });


      const formatted = invoices.map((inv: any) => ({
        ...inv,
        dueDate: inv.dueDate || '',
        lineItems: (() => {
          try { return JSON.parse(inv.lineItems as string); } catch { return []; }
        })(),
      }));

      return sendSuccess({ res, data: formatted });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        tenantId, tenantName, propertyId, propertyName,
        unitNumber, dueDate, amount, paidAmount, balance,
        status, lineItems, notes,
      } = req.body;
      const companyId = req.user?.companyId;

      const parsedDueDate = dueDate ? new Date(dueDate) : new Date();

      const invoice = await prisma.invoice.create({
        data: {
          tenantId: tenantId || 'default',
          tenantName: tenantName || 'Unknown Tenant',
          propertyId: propertyId || 'default',
          propertyName: propertyName || 'Unknown Property',
          unitNumber: unitNumber || '',
          dueDate: typeof dueDate === 'string' ? dueDate : (isNaN(parsedDueDate.getTime()) ? new Date().toISOString().split('T')[0] : parsedDueDate.toISOString().split('T')[0]),
          amount: parseFloat(amount) || 0,
          paidAmount: parseFloat(paidAmount) || 0,
          balance: parseFloat(balance ?? amount) || 0,
          status: status || 'Draft',
          lineItems: JSON.stringify(lineItems || []),
          notes: notes || null,
          companyId,
        },
      });

      return sendSuccess({
        res,
        statusCode: 201,
        data: { ...invoice, lineItems: lineItems || [] },
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const {
        tenantId, tenantName, propertyId, propertyName, unitNumber,
        dueDate, amount, paidAmount, balance, status, lineItems, notes
      } = req.body;
      const companyId = req.user?.companyId;

      if (companyId) {
        const check = await prisma.invoice.findFirst({
          where: { id, companyId },
        });
        if (!check) throw new Error('Invoice not found.');
      }

      const updateData: any = {};
      if (tenantId !== undefined) updateData.tenantId = tenantId;
      if (tenantName !== undefined) updateData.tenantName = tenantName;
      if (propertyId !== undefined) updateData.propertyId = propertyId;
      if (propertyName !== undefined) updateData.propertyName = propertyName;
      if (unitNumber !== undefined) updateData.unitNumber = unitNumber;
      if (dueDate !== undefined) updateData.dueDate = typeof dueDate === 'string' ? dueDate : (new Date(dueDate).toISOString().split('T')[0]);
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);
      if (balance !== undefined) updateData.balance = parseFloat(balance);
      if (status !== undefined) updateData.status = status;
      if (lineItems !== undefined) updateData.lineItems = typeof lineItems === 'string' ? lineItems : JSON.stringify(lineItems);
      if (notes !== undefined) updateData.notes = notes;

      const invoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
      });

      return sendSuccess({
        res,
        data: {
          ...invoice,
          lineItems: (() => {
            try { return JSON.parse(invoice.lineItems as string); } catch { return []; }
          })(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const companyId = req.user?.companyId;

      if (companyId) {
        const check = await prisma.invoice.findFirst({
          where: { id, companyId },
        });
        if (!check) throw new Error('Invoice not found.');
      }

      await prisma.invoice.delete({ where: { id } });
      return sendSuccess({ res, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();

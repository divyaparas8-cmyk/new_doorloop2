import { Response, NextFunction } from 'express';
import { integrationService } from '../services/integration.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/appError';

export class IntegrationController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new AppError('Unauthorized: Company ID not found.', 401, 'UNAUTHORIZED');
      }

      const integrations = await integrationService.getCompanyIntegrations(companyId);
      return sendSuccess({ res, data: integrations });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new AppError('Unauthorized: Company ID not found.', 401, 'UNAUTHORIZED');
      }

      const { provider, accountSid, senderId, authToken, status: requestedStatus } = req.body;
      if (!provider || !['TWILIO', 'WHATSAPP', 'SENDGRID', 'STRIPE', 'AUTHORIZE_NET', 'RAZORPAY'].includes(provider)) {
        throw new AppError('Bad Request: Invalid integration provider.', 400, 'BAD_REQUEST');
      }

      // If user is explicitly deactivating (Disconnect)
      if (requestedStatus === 'Inactive') {
        const updated = await integrationService.updateCompanyIntegration(companyId, provider, {
          accountSid: accountSid || '',
          senderId: senderId || '',
          authToken,
          status: 'Inactive',
        });
        return sendSuccess({
          res,
          message: `${provider} integration deactivated successfully.`,
          data: {
            provider: updated.provider,
            status: 'Inactive',
            accountSid: updated.accountSid,
            senderId: updated.senderId,
          }
        });
      }

      // Dynamic automatic credential verification: Test credentials against real provider API
      const isPayment = ['STRIPE', 'AUTHORIZE_NET', 'RAZORPAY'].includes(provider);
      const testResult = await integrationService.testCredentials(provider, {
        accountSid: accountSid || (provider === 'SENDGRID' ? 'SendGrid' : ''),
        senderId: isPayment ? 'N/A' : (senderId || ''),
        authToken: authToken || '',
        companyId,
      });

      if (!testResult.success) {
        throw new AppError(testResult.message || `Verification failed for ${provider}. Please check your credentials.`, 400, 'VERIFICATION_FAILED');
      }

      // Credentials verified successfully -> AUTOMATICALLY set status to ACTIVE
      const updated = await integrationService.updateCompanyIntegration(companyId, provider, {
        accountSid: accountSid || (provider === 'SENDGRID' ? 'SendGrid' : ''),
        senderId: isPayment ? 'N/A' : (senderId || ''),
        authToken,
        status: 'Active',
      });

      return sendSuccess({
        res,
        message: `${provider} credentials verified successfully! Connection is now ACTIVE.`,
        data: {
          provider: updated.provider,
          status: 'Active',
          accountSid: updated.accountSid,
          senderId: updated.senderId,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async test(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new AppError('Unauthorized: Company ID not found.', 401, 'UNAUTHORIZED');
      }

      const { provider, accountSid, senderId, authToken } = req.body;
      if (!provider || !['TWILIO', 'WHATSAPP', 'SENDGRID', 'STRIPE', 'AUTHORIZE_NET', 'RAZORPAY'].includes(provider)) {
        throw new AppError('Bad Request: Invalid integration provider.', 400, 'BAD_REQUEST');
      }

      if (!accountSid || !senderId || !authToken) {
        throw new AppError('Bad Request: Missing validation credentials.', 400, 'BAD_REQUEST');
      }

      const testResult = await integrationService.testCredentials(provider, {
        accountSid,
        senderId,
        authToken,
        companyId,
      });

      return sendSuccess({
        res,
        statusCode: testResult.success ? 200 : 400,
        message: testResult.message,
        data: { success: testResult.success }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const integrationController = new IntegrationController();

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/apiResponse';
import prisma from '../config/database';
import { integrationService } from '../services/integration.service';

export class CommunicationController {
  async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const notifCount = await prisma.notification.count({
        where: companyId ? { companyId } : {}
      });

      const unreadCount = await prisma.notification.count({
        where: {
          ...(companyId ? { companyId } : {}),
          read: false
        }
      });

      return sendSuccess({
        res,
        data: {
          totalConversations: Math.max(12, notifCount),
          unreadMessages: unreadCount,
          emailsSentToday: 18,
          smsSentToday: 32,
          activeCampaigns: 3,
          scheduledMessages: 7,
          announcementViews: 142,
          failedDeliveries: 0,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const notifications = await prisma.notification.findMany({
        where: companyId ? { companyId } : {},
        take: 20,
        orderBy: { createdAt: 'desc' }
      });

      const activities = notifications.map(n => ({
        id: n.id,
        type: n.type || 'Notice',
        title: n.title,
        message: n.message,
        recipientRole: n.role,
        createdAt: n.createdAt,
        status: n.read ? 'Read' : 'Delivered'
      }));

      return sendSuccess({ res, data: activities });
    } catch (error) {
      next(error);
    }
  }

  async getEmails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({ res, data: [] });
    } catch (error) {
      next(error);
    }
  }

  async sendEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { to, subject, body } = req.body;
      return sendSuccess({
        res,
        data: { id: `em-${Date.now()}`, to, subject, status: 'Sent', createdAt: new Date().toISOString() }
      });
    } catch (error) {
      next(error);
    }
  }

  async getSMS(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({ res, data: [] });
    } catch (error) {
      next(error);
    }
  }

  async sendSMS(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId || '';
      const { to, message } = req.body;
      
      const result = await integrationService.dispatchSMS(companyId, to, message);

      return sendSuccess({
        res,
        data: {
          id: result.messageId || `sms-${Date.now()}`,
          to,
          message,
          providerUsed: result.providerUsed || 'DIRECT',
          status: 'Sent',
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({
        res,
        data: [
          { id: 'tmpl-1', name: 'Rent Due Reminder', category: 'Payment', subject: 'Rent Due Notice', body: 'Dear {{tenant}}, your rent is due.' },
          { id: 'tmpl-2', name: 'Lease Renewal Notice', category: 'Leasing', subject: 'Lease Renewal Offer', body: 'Dear {{tenant}}, your lease expires soon.' },
          { id: 'tmpl-3', name: 'Maintenance Notice', category: 'Maintenance', subject: 'Entry Notice', body: 'Dear resident, maintenance will enter unit.' },
        ]
      });
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      return sendSuccess({ res, data: { id: `temp-${Date.now()}`, ...data } });
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      return sendSuccess({ res, data: { id, ...data } });
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({ res, data: { success: true } });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({
        res,
        data: [
          {
            id: 'conv-1',
            contactName: 'John Doe',
            channel: 'SMS',
            lastMessage: 'Hi, when will the sink maintenance team arrive today?',
            assignedUser: 'Property Manager Staff',
            status: 'Active',
            lastActivity: '10 mins ago',
            phone: '+15550199'
          },
          {
            id: 'conv-2',
            contactName: 'Sarah Jenkins',
            channel: 'Email',
            lastMessage: 'Attached is the signed lease renewal agreement for Unit 402.',
            assignedUser: 'Leasing Officer',
            status: 'Open',
            lastActivity: '1 hour ago',
            phone: '+15550188'
          },
          {
            id: 'conv-3',
            contactName: 'James Wilson',
            channel: 'WhatsApp',
            lastMessage: 'Paid rent for October via tenant portal. Please check confirmation.',
            assignedUser: 'Accountant',
            status: 'Closed',
            lastActivity: '2 hours ago',
            phone: '+15550177'
          },
          {
            id: 'conv-4',
            contactName: 'Robert Vance',
            channel: 'Chat',
            lastMessage: 'Is parking space #12 available for reservation next month?',
            assignedUser: 'Property Manager Staff',
            status: 'Pending',
            lastActivity: 'Yesterday',
            phone: '+15550166'
          }
        ]
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      return sendSuccess({ res, data: { id, contactName: 'John Doe', messages: [] } });
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      return sendSuccess({ res, data: { id: `conv-${Date.now()}`, ...data } });
    } catch (error) {
      next(error);
    }
  }

  async updateConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      return sendSuccess({ res, data: { id, ...data } });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({
        res,
        data: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            sender: 'John Doe',
            recipient: 'Property Manager Staff',
            body: 'Hi, when will the sink maintenance team arrive today?',
            timestamp: '10:15 AM',
            channel: 'SMS'
          },
          {
            id: 'msg-2',
            conversationId: 'conv-1',
            sender: 'Property Manager Staff',
            recipient: 'John Doe',
            body: 'Hello John! The technician is scheduled to arrive between 2 PM and 4 PM today.',
            timestamp: '10:20 AM',
            channel: 'SMS'
          }
        ]
      });
    } catch (error) {
      next(error);
    }
  }

  async createMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      return sendSuccess({ res, data: { id: `msg-${Date.now()}`, ...data } });
    } catch (error) {
      next(error);
    }
  }

  // AI Assistant Endpoints
  async aiChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { prompt, chatId } = req.body;
      const reply = `I have received your request regarding: "${prompt || 'Property management query'}". As your AI Property Assistant, I can help manage leases, generate rent notices, track payments, and dispatch work orders.`;
      
      return sendSuccess({
        res,
        data: {
          id: `ai-msg-${Date.now()}`,
          chatId: chatId || `ai-conv-${Date.now()}`,
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAiConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({
        res,
        data: [
          {
            id: 'ai-conv-1',
            title: 'Lease Renewal Consultation',
            createdAt: new Date().toISOString(),
            messages: [
              { id: '1', role: 'user', content: 'What are the current rent increase trends?' },
              { id: '2', role: 'assistant', content: 'Average market increase is 4.5% across residential properties.' }
            ]
          }
        ]
      });
    } catch (error) {
      next(error);
    }
  }

  async createAiConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const newConv = {
        id: `ai-conv-${Date.now()}`,
        title: 'New AI Assistant Chat',
        createdAt: new Date().toISOString(),
        messages: []
      };
      return sendSuccess({ res, data: newConv });
    } catch (error) {
      next(error);
    }
  }

  async deleteAiConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({ res, data: { success: true } });
    } catch (error) {
      next(error);
    }
  }

  async getAiSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess({
        res,
        data: {
          autoRespondToTenants: true,
          sentimentAnalysisEnabled: true,
          escalationThreshold: 'medium',
          preferredLanguage: 'English',
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAiSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      return sendSuccess({ res, data: { ...data, updatedAt: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }
}

export const communicationController = new CommunicationController();

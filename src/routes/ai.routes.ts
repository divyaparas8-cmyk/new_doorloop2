import { Router } from 'express';
import { communicationController } from '../controllers/communication.controller';

const router = Router();

router.post('/chat', (req, res, next) => communicationController.aiChat(req, res, next));
router.get('/conversations', (req, res, next) => communicationController.getAiConversations(req, res, next));
router.post('/conversations', (req, res, next) => communicationController.createAiConversation(req, res, next));
router.delete('/conversations/:id', (req, res, next) => communicationController.deleteAiConversation(req, res, next));
router.get('/settings', (req, res, next) => communicationController.getAiSettings(req, res, next));
router.put('/settings', (req, res, next) => communicationController.updateAiSettings(req, res, next));

export default router;

import { Router } from 'express';
import { communicationController } from '../controllers/communication.controller';

const router = Router();

router.get('/', (req, res, next) => communicationController.getConversations(req, res, next));
router.get('/:id', (req, res, next) => communicationController.getConversationById(req, res, next));
router.post('/', (req, res, next) => communicationController.createConversation(req, res, next));
router.put('/:id', (req, res, next) => communicationController.updateConversation(req, res, next));

export default router;

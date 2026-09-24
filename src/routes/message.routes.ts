import { Router } from 'express';
import { communicationController } from '../controllers/communication.controller';

const router = Router();

router.get('/', (req, res, next) => communicationController.getMessages(req, res, next));
router.post('/', (req, res, next) => communicationController.createMessage(req, res, next));

export default router;

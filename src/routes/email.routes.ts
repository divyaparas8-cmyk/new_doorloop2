import { Router } from 'express';
import { communicationController } from '../controllers/communication.controller';

const router = Router();

router.get('/', (req, res, next) => communicationController.getEmails(req, res, next));
router.post('/', (req, res, next) => communicationController.sendEmail(req, res, next));
router.post('/send', (req, res, next) => communicationController.sendEmail(req, res, next));

export default router;

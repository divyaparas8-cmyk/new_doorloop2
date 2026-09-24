import { Router } from 'express';
import { communicationController } from '../controllers/communication.controller';

const router = Router();

router.get('/metrics', (req, res, next) => communicationController.getMetrics(req, res, next));
router.get('/activity', (req, res, next) => communicationController.getActivity(req, res, next));

export default router;

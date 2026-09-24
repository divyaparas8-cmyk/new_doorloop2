import { Router } from 'express';
import { communicationController } from '../controllers/communication.controller';

const router = Router();

router.get('/', (req, res, next) => communicationController.getTemplates(req, res, next));
router.post('/', (req, res, next) => communicationController.createTemplate(req, res, next));
router.put('/:id', (req, res, next) => communicationController.updateTemplate(req, res, next));
router.delete('/:id', (req, res, next) => communicationController.deleteTemplate(req, res, next));

export default router;

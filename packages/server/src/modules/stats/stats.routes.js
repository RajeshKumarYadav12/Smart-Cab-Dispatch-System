import { Router } from 'express';
import * as statsController from './stats.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['admin']));

router.get('/overview', statsController.getOverview);

export default router;

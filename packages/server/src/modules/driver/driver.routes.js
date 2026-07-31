import { Router } from 'express';
import * as driverController from './driver.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['admin']), driverController.listDrivers);
router.post('/onboard', requireRole(['admin']), driverController.onboardDriver);

router.use(requireRole(['driver']));
router.get('/status', driverController.getStatus);
router.patch('/status', driverController.updateStatus);

export default router;

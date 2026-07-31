import { Router } from 'express';
import * as tripController from './trip.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', tripController.createTrip); 
router.get('/', requireRole(['admin']), tripController.listTrips);

router.get('/me', tripController.getPersonalTrips);

router.get('/:id', tripController.getTrip);

router.patch('/:id/status', requireRole(['admin', 'driver']), tripController.updateStatus);

export default router;

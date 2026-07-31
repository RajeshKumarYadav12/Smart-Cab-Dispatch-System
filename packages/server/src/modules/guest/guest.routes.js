import { Router } from 'express';
import * as guestController from './guest.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['admin']), guestController.listGuests);
router.patch('/:id', requireRole(['admin']), guestController.updateGuest);

export default router;

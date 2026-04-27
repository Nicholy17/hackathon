import express from 'express';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware.js';
import { 
  getAllVolunteers, 
  getVolunteerDetails, 
  getDashboardData,
  updateVolunteerStatus
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', getDashboardData);

// Voluntários
router.get('/volunteers', getAllVolunteers);
router.get('/volunteers/:id', getVolunteerDetails);
router.put('/volunteers/:id/status', updateVolunteerStatus);

export default router;
import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getProfile, updateProfile } from '../controllers/volunteerController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
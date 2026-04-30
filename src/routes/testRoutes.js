import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { 
  getQuestions, 
  submitTest, 
  getTestResult, 
  seedQuestions 
} from '../controllers/testController.js';

const router = express.Router();

router.get('/questions', authMiddleware, getQuestions);
router.post('/submit', authMiddleware, submitTest);
router.get('/result', authMiddleware, getTestResult);  // ESTA ROTA ESTÁ FALTANDO!
router.post('/seed', seedQuestions);

export default router;
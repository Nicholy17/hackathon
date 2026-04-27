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
router.get('/result', authMiddleware, getTestResult);
router.post('/seed', seedQuestions); // Rota pública para popular perguntas

export default router;
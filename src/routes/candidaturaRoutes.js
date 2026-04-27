import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { verificarVagas } from '../middlewares/validationMiddleware.js';
import { candidatar, desistir } from '../controllers/candidaturaController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/projetos/:projectId/candidatar', verificarVagas, candidatar);
router.post('/projetos/:projectId/desistir', desistir);
router.get('/projetos/:projectId/vagas', async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  res.json({
    total: project.vagasTotais,
    preenchidas: project.vagasPreenchidas,
    disponiveis: project.vagasTotais - project.vagasPreenchidas
  });
});

export default router;
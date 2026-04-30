import express from 'express';
import { authMiddleware, adminOnly } from '../middlewares/authMiddleware.js';
import {
  criarProjeto,
  listarProjetos,
  buscarProjeto,
  candidatarProjeto,
  avaliarCandidato,
  concluirProjeto,
  dashboardProjetos,
  meusProjetos,
  listarProjetosCompleto,
  buscarProjetoComCandidatos,
  atualizarStatusVoluntario
} from '../controllers/projectController.js';

const router = express.Router();

// ========== ROTAS ESPECÍFICAS (sem parâmetros) PRIMEIRO ==========
router.get('/dashboard', authMiddleware, adminOnly, dashboardProjetos);
router.get('/meus-projetos', authMiddleware, meusProjetos);
router.get('/completo', authMiddleware, listarProjetosCompleto);

// ========== ROTAS COM PARÂMETROS DEPOIS ==========
router.get('/', authMiddleware, listarProjetos);
router.get('/:id', authMiddleware, buscarProjeto);
router.get('/:id/candidatos', authMiddleware, buscarProjetoComCandidatos);
router.post('/:id/candidatar', authMiddleware, candidatarProjeto);

// Rota para atualizar status do voluntário no projeto
router.put('/:projectId/voluntarios/:volunteerId/status', authMiddleware, adminOnly, atualizarStatusVoluntario);

// Rotas administrativas
router.post('/', authMiddleware, adminOnly, criarProjeto);
router.put('/:id/avaliar/:voluntarioId', authMiddleware, adminOnly, avaliarCandidato);
router.put('/:id/concluir', authMiddleware, adminOnly, concluirProjeto);

export default router;
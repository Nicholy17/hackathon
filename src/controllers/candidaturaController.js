import Project from '../models/Project.js';
import VolunteerProfile from '../models/VolunteerProfile.js';

export const candidatar = async (req, res) => {
  try {
    const { projectId } = req.params;
    const volunteerId = req.user.id;

    // Buscar projeto
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Verificar se projeto está aberto
    if (project.status !== 'aberto') {
      return res.status(400).json({ error: 'Projeto não está aceitando candidaturas' });
    }

    // Verificar se vagas estão disponíveis
    if (project.vagasPreenchidas >= project.vagasTotais) {
      return res.status(400).json({ 
        error: 'Limite de vagas atingido',
        message: 'Não é possível se candidatar no momento. Vagas esgotadas.'
      });
    }

    // Verificar se voluntário já está cadastrado
    if (project.voluntarios.includes(volunteerId)) {
      return res.status(400).json({ error: 'Você já está neste projeto' });
    }

    // Adicionar voluntário
    project.voluntarios.push(volunteerId);
    project.vagasPreenchidas++;
    
    // Se atingiu limite, fechar automaticamente
    if (project.vagasPreenchidas >= project.vagasTotais) {
      project.status = 'fechado';
    }
    
    await project.save();

    res.json({
      message: 'Candidatura realizada com sucesso!',
      projeto: {
        nome: project.nome,
        vagasDisponiveis: project.vagasTotais - project.vagasPreenchidas,
        status: project.status
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar candidatura' });
  }
};

export const desistir = async (req, res) => {
  try {
    const { projectId } = req.params;
    const volunteerId = req.user.id;

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Verificar se voluntário está no projeto
    const index = project.voluntarios.indexOf(volunteerId);
    if (index === -1) {
      return res.status(400).json({ error: 'Você não está neste projeto' });
    }

    // Remover voluntário
    project.voluntarios.splice(index, 1);
    project.vagasPreenchidas--;
    
    // Reabrir projeto se estava fechado
    if (project.status === 'fechado' && project.vagasPreenchidas < project.vagasTotais) {
      project.status = 'aberto';
    }
    
    await project.save();

    res.json({
      message: 'Desistência registrada. Vaga reaberta!',
      vagasDisponiveis: project.vagasTotais - project.vagasPreenchidas
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar desistência' });
  }
};
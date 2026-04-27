export const verificarVagas = async (req, res, next) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  
  if (project.vagasPreenchidas >= project.vagasTotais) {
    return res.status(400).json({ 
      error: 'Projeto lotado',
      message: 'Todas as vagas foram preenchidas'
    });
  }
  
  next();
};
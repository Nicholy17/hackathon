import VolunteerProfile from '../models/VolunteerProfile.js';
import TestResult from '../models/TestResult.js';

export const getProfile = async (req, res) => {
  try {
    const profile = await VolunteerProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }
    
    const testResult = await TestResult.findOne({ volunteer: req.user.id });
    
    res.json({
      profile,
      testResult,
      status: {
        testCompleted: profile.testCompleted,
        candidacyStatus: testResult?.status || 'pending'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nome, idade, localizacao, formacao, experiencia, habilidades, disponibilidade } = req.body;
    
    const profile = await VolunteerProfile.findOneAndUpdate(
      { user: req.user.id },
      { nome, idade, localizacao, formacao, experiencia, habilidades, disponibilidade },
      { new: true, runValidators: true }
    );
    
    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }
    
    res.json({ message: 'Perfil atualizado com sucesso', profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};
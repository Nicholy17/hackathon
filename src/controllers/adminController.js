import User from '../models/User.js';
import VolunteerProfile from '../models/VolunteerProfile.js';
import TestResult from '../models/TestResult.js';
import Project from '../models/Project.js';

// Dashboard completo
export const getDashboardData = async (req, res) => {
  try {
    const totalCandidatos = await VolunteerProfile.countDocuments();
    
    const testResults = await TestResult.find();
    const aprovados = testResults.filter(tr => tr.status === 'approved').length;
    const reprovados = testResults.filter(tr => tr.status === 'rejected').length;
    const pendentes = testResults.filter(tr => tr.status === 'pending').length;
    const emAnalise = testResults.filter(tr => tr.status === 'em_analise').length;
    
    const testCompletados = await VolunteerProfile.countDocuments({ testCompleted: true });
    const taxaConclusao = totalCandidatos > 0 ? ((testCompletados / totalCandidatos) * 100).toFixed(0) : 0;
    
    const scores = testResults.map(tr => tr.score).filter(s => s);
    const scoreMedio = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0) : 0;
    
    const taxaAprovacao = testCompletados > 0 ? ((aprovados / testCompletados) * 100).toFixed(0) : 0;
    
    const distribuicaoPontuacoes = [
      { faixa: '0-20', count: testResults.filter(tr => tr.score >= 0 && tr.score <= 20).length },
      { faixa: '21-40', count: testResults.filter(tr => tr.score >= 21 && tr.score <= 40).length },
      { faixa: '41-60', count: testResults.filter(tr => tr.score >= 41 && tr.score <= 60).length },
      { faixa: '61-80', count: testResults.filter(tr => tr.score >= 61 && tr.score <= 80).length },
      { faixa: '81-100', count: testResults.filter(tr => tr.score >= 81 && tr.score <= 100).length }
    ];
    
    const perfis = await TestResult.aggregate([
      { $group: { _id: '$perfil', count: { $sum: 1 } } }
    ]);
    
    const projetosAbertos = await Project.find({ status: 'aberto' })
      .populate('voluntarios.voluntarioId', 'nome user email');
    
    const projetosInfo = projetosAbertos.map(projeto => {
      const vagasRestantes = projeto.vagasTotais - (projeto.vagasPreenchidas || 0);
      const candidatosInscritos = projeto.voluntarios?.length || 0;
      
      return {
        id: projeto._id,
        titulo: projeto.titulo,
        tipo: projeto.tipo,
        cidade: projeto.local?.cidade || 'Não informado',
        vagasTotais: projeto.vagasTotais,
        vagasPreenchidas: projeto.vagasPreenchidas || 0,
        vagasRestantes: vagasRestantes,
        candidatosInscritos: candidatosInscritos,
        statusVagas: vagasRestantes > 0 ? 'Aberto' : 'Lotado',
        diasRestantes: projeto.dataFim ? Math.ceil((new Date(projeto.dataFim) - new Date()) / (1000 * 60 * 60 * 24)) : '-',
        dataInicio: projeto.dataInicio,
        dataFim: projeto.dataFim
      };
    });
    
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    
    const inscricoesPorDia = await Project.aggregate([
      { $unwind: '$voluntarios' },
      { $match: { 'voluntarios.dataCandidatura': { $gte: seteDiasAtras } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$voluntarios.dataCandidatura' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const inscricoesPorDiaSemana = await Project.aggregate([
      { $unwind: '$voluntarios' },
      {
        $group: {
          _id: { $dayOfWeek: '$voluntarios.dataCandidatura' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const inscricoesDiasSemana = inscricoesPorDiaSemana.map(item => ({
      dia: diasSemana[item._id - 1],
      count: item.count
    }));
    
    const inscricoesPorSetor = await Project.aggregate([
      { $unwind: '$voluntarios' },
      {
        $group: {
          _id: '$tipo',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const tiposMap = {
      'desastre_natural': 'Desastres Naturais',
      'vulnerabilidade_social': 'Vulnerabilidade Social',
      'educacao': 'Educação',
      'saude': 'Saúde'
    };
    
    const setores = inscricoesPorSetor.map(item => ({
      nome: tiposMap[item._id] || item._id,
      count: item.count
    }));
    
    res.json({
      total_candidatos: totalCandidatos,
      aprovados: aprovados,
      reprovados: reprovados,
      pendentes: pendentes,
      em_analise: emAnalise,
      score_medio: parseInt(scoreMedio),
      taxa_aprovacao: parseInt(taxaAprovacao),
      taxa_conclusao: parseInt(taxaConclusao),
      test_completados: testCompletados,
      distribuicao_pontuacoes: distribuicaoPontuacoes,
      distribuicao_perfis: perfis,
      inscricoes_por_dia: inscricoesPorDia,
      inscricoes_por_dia_semana: inscricoesDiasSemana,
      inscricoes_por_setor: setores,
      projetos_abertos: projetosInfo,
      total_projetos: projetosAbertos.length
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard', detalhe: error.message });
  }
};

// Listar voluntários
export const getAllVolunteers = async (req, res) => {
  try {
    const { page = 1, limit = 20, perfil, status, habilidade } = req.query;
    
    let query = {};
    if (habilidade) query.habilidades = habilidade;
    
    const volunteers = await VolunteerProfile.find(query)
      .populate('user', 'email status')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const volunteersWithResults = await Promise.all(
      volunteers.map(async (volunteer) => {
        let testResult = null;
        try {
          testResult = await TestResult.findOne({ volunteer: volunteer._id });
        } catch (err) {
          console.log('Erro ao buscar testResult:', err.message);
        }
        return {
          ...volunteer.toObject(),
          testResult: testResult || { status: 'pending', score: null, perfil: null }
        };
      })
    );
    
    res.json({ volunteers: volunteersWithResults, total: volunteersWithResults.length });
  } catch (error) {
    console.error('Erro ao buscar voluntários:', error);
    res.status(500).json({ error: 'Erro ao buscar voluntários' });
  }
};

// Detalhes do voluntário
// Detalhes do voluntário (corrigido)
// Detalhes do voluntário
export const getVolunteerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Buscando voluntário ID:', id);
    
    // Tentar encontrar por _id
    let profile = await VolunteerProfile.findById(id).populate('user', 'email');
    
    // Se não encontrar, tentar por user ID
    if (!profile) {
      profile = await VolunteerProfile.findOne({ user: id }).populate('user', 'email');
    }
    
    if (!profile) {
      return res.status(404).json({ error: 'Voluntário não encontrado' });
    }
    
    // Buscar resultado do teste
    let testResult = null;
    try {
      testResult = await TestResult.findOne({ volunteer: profile._id });
    } catch (err) {
      console.log('Erro ao buscar testResult:', err.message);
    }
    
    res.json({ 
      profile: profile,
      testResult: testResult || { status: 'pending', score: null, perfil: null } 
    });
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
};

// Atualizar status do voluntário
export const updateVolunteerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, testStatus } = req.body;
    
    const volunteer = await VolunteerProfile.findById(id);
    if (!volunteer) {
      return res.status(404).json({ error: 'Voluntário não encontrado' });
    }
    
    if (status) {
      await User.findByIdAndUpdate(volunteer.user, { status });
    }
    
    if (testStatus) {
      await TestResult.findOneAndUpdate(
        { volunteer: volunteer._id },
        { status: testStatus },
        { new: true, upsert: true }
      );
    }
    
    res.json({ message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
};
import TestQuestion from '../models/TestQuestion.js';
import TestResponse from '../models/TestResponse.js';
import TestResult from '../models/TestResult.js';
import VolunteerProfile from '../models/VolunteerProfile.js';
import watsonxService from '../services/watsonx.js';

// Função para popular perguntas (seed)
export const seedQuestions = async (req, res) => {
  try {
    const questions = [
      {
        question: "Em uma situação de emergência, você:",
        type: "multiple_choice",
        options: [
          "Age rapidamente mesmo sem instruções",
          "Busca coordenar as ações do grupo",
          "Prefere seguir instruções específicas",
          "Ajuda a comunicar a situação para outros"
        ],
        category: "personalidade",
        order: 1
      },
      {
        question: "Qual sua maior habilidade prática?",
        type: "multiple_choice",
        options: [
          "Primeiros socorros",
          "Organização de materiais",
          "Comunicação com pessoas",
          "Tomada de decisão rápida"
        ],
        category: "habilidades",
        order: 2
      },
      {
        question: "Você tem disponibilidade para atuar em emergências fora do horário comercial?",
        type: "scale",
        options: ["1", "2", "3", "4", "5"],
        category: "disponibilidade",
        weight: 2,
        order: 3
      },
      {
        question: "Como você reage sob pressão?",
        type: "multiple_choice",
        options: [
          "Mantenho a calma e penso logicamente",
          "Sigo instintos e ações rápidas",
          "Busco ajuda de outros primeiro",
          "Foco em resolver uma coisa de cada vez"
        ],
        category: "personalidade",
        order: 4
      },
      {
        question: "Qual sua experiência com trabalho voluntário?",
        type: "multiple_choice",
        options: [
          "Nenhuma experiência",
          "Pouca experiência (menos de 1 ano)",
          "Experiência moderada (1-3 anos)",
          "Experiência extensa (mais de 3 anos)"
        ],
        category: "experiencia",
        weight: 1.5,
        order: 5
      }
    ];

    await TestQuestion.deleteMany({});
    await TestQuestion.insertMany(questions);

    res.json({ message: 'Perguntas carregadas com sucesso', total: questions.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar perguntas' });
  }
};

// Função para buscar perguntas
export const getQuestions = async (req, res) => {
  try {
    const questions = await TestQuestion.find({ active: true }).sort('order');
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar perguntas' });
  }
};

// Submeter respostas do teste - VERSÃO CORRIGIDA
export const submitTest = async (req, res) => {
  try {
    const { responses } = req.body;
    const userId = req.user.id;
    
    console.log('📝 Submetendo teste para usuário:', userId);
    
    // Buscar o perfil do voluntário
    const volunteerProfile = await VolunteerProfile.findOne({ user: userId });
    
    if (!volunteerProfile) {
      console.log('❌ Perfil não encontrado para usuário:', userId);
      return res.status(404).json({ error: 'Perfil de voluntário não encontrado' });
    }
    
    console.log('📋 Perfil encontrado:', volunteerProfile._id);
    
    // Buscar as perguntas
    const TestQuestion = (await import('../models/TestQuestion.js')).default;
    const questions = await TestQuestion.find();
    
    // Calcular pontuação (exemplo - ajuste conforme sua lógica)
    let totalScore = 0;
    let maxScore = questions.length * 10;
    
    for (const response of responses) {
      const question = questions.find(q => q._id.toString() === response.questionId);
      if (question) {
        // Lógica de pontuação - ajuste conforme suas perguntas
        const optionIndex = question.options.findIndex(opt => opt === response.answer);
        totalScore += (optionIndex + 1) * 2;
      }
    }
    
    const score = Math.round((totalScore / maxScore) * 100);
    
    // Determinar perfil baseado na pontuação (exemplo)
    let perfil = 'APOIO GERAL';
    if (score >= 70) perfil = 'OPERACIONAL';
    else if (score >= 50) perfil = 'EDUCACIONAL';
    else perfil = 'APOIO GERAL';
    
    // GERAR JUSTIFICATIVA (exemplo)
    const justificativa = `O voluntário obteve ${score}% de compatibilidade, indicando perfil ${perfil}.`;
    
    // VERIFICAR SE JÁ EXISTE UM RESULTADO
    const existingResult = await TestResult.findOne({ volunteer: volunteerProfile._id });
    
    let testResult;
    if (existingResult) {
      // Atualizar existente
      testResult = await TestResult.findOneAndUpdate(
        { volunteer: volunteerProfile._id },
        {
          score: score,
          perfil: perfil,
          justificativa: justificativa,
          status: 'pending',  // IMPORTANTE: manter como pendente
          responses: responses,
          updatedAt: new Date()
        },
        { new: true }
      );
      console.log('✅ Resultado atualizado:', testResult._id);
    } else {
      // Criar novo
      testResult = new TestResult({
        volunteer: volunteerProfile._id,
        score: score,
        perfil: perfil,
        justificativa: justificativa,
        status: 'pending',  // IMPORTANTE: começa como pendente
        responses: responses
      });
      await testResult.save();
      console.log('✅ Novo resultado criado:', testResult._id);
    }
    
    // Marcar que o voluntário completou o teste
    volunteerProfile.testCompleted = true;
    await volunteerProfile.save();
    
    console.log('✅ Teste finalizado com status: pending');
    
    res.json({ 
      message: 'Teste finalizado com sucesso! Aguarde a aprovação do administrador.',
      result: {
        score: testResult.score,
        perfil: testResult.perfil,
        status: testResult.status
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar teste:', error);
    res.status(500).json({ error: 'Erro ao salvar teste', detalhe: error.message });
  }
};

// Buscar resultado do teste do voluntário logado
export const getTestResult = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 Buscando resultado para usuário:', userId);
    
    // Buscar o perfil do voluntário
    const volunteerProfile = await VolunteerProfile.findOne({ user: userId });
    
    if (!volunteerProfile) {
      console.log('⚠️ Perfil não encontrado');
      return res.json({ perfil: null, score: null, status: 'pending', message: 'Teste não realizado' });
    }
    
    // Buscar o resultado do teste
    const testResult = await TestResult.findOne({ volunteer: volunteerProfile._id });
    
    if (!testResult) {
      console.log('⚠️ Teste não realizado');
      return res.json({ perfil: null, score: null, status: 'pending', message: 'Teste não realizado' });
    }
    
    console.log('📊 Resultado encontrado:', {
      perfil: testResult.perfil,
      score: testResult.score,
      status: testResult.status
    });
    
    res.json({
      perfil: testResult.perfil,
      score: testResult.score,
      status: testResult.status,
      justificativa: testResult.justificativa
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar resultado:', error);
    res.status(500).json({ error: 'Erro ao buscar resultado' });
  }
};
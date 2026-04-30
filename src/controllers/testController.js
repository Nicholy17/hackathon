import TestQuestion from '../models/TestQuestion.js';
import TestResponse from '../models/TestResponse.js';
import TestResult from '../models/TestResult.js';
import VolunteerProfile from '../models/VolunteerProfile.js';
import watsonxService from '../services/watsonx.js';

// Função para popular perguntas (seed)
export const seedQuestions = async (req, res) => {
  try {
    const questions = [
      { question: "Você tem experiência com primeiros socorros?", options: ["Sim, avançado", "Sim, básico", "Não", "Estou aprendendo"], category: "habilidades", type: "multiple_choice", order: 1 },
      { question: "Você sabe usar rádio ou equipamentos de comunicação?", options: ["Sim", "Mais ou menos", "Não", "Estou aprendendo"], category: "habilidades", type: "multiple_choice", order: 2 },
      { question: "Você tem experiência com resgate ou salvamento?", options: ["Sim, muita", "Sim, alguma", "Pouca", "Nenhuma"], category: "habilidades", type: "multiple_choice", order: 3 },
      { question: "Você sabe dirigir veículos de emergência?", options: ["Sim", "Tenho habilitação mas não experiência", "Não", "Estou aprendendo"], category: "habilidades", type: "multiple_choice", order: 4 },
      { question: "Você tem experiência com informática?", options: ["Sim, avançado", "Sim, básico", "Não", "Estou aprendendo"], category: "habilidades", type: "multiple_choice", order: 5 },
      { question: "Você sabe usar ferramentas de ensino online?", options: ["Sim, várias", "Sim, algumas", "Poucas", "Nenhuma"], category: "habilidades", type: "multiple_choice", order: 6 },
      { question: "Você tem experiência em dar aulas ou treinamentos?", options: ["Sim, muita", "Sim, alguma", "Pouca", "Nenhuma"], category: "habilidades", type: "multiple_choice", order: 7 },
      { question: "Você sabe criar materiais didáticos?", options: ["Sim, facilmente", "Com ajuda", "Com dificuldade", "Não sei"], category: "habilidades", type: "multiple_choice", order: 8 },
      { question: "Você tem experiência com logística e organização?", options: ["Sim, muita", "Sim, alguma", "Pouca", "Nenhuma"], category: "habilidades", type: "multiple_choice", order: 9 },
      { question: "Você sabe organizar estoques e distribuição?", options: ["Sim", "Mais ou menos", "Não", "Estou aprendendo"], category: "habilidades", type: "multiple_choice", order: 10 },
      { question: "Você tem habilidade com planejamento de eventos?", options: ["Sim, muita", "Sim, alguma", "Pouca", "Nenhuma"], category: "habilidades", type: "multiple_choice", order: 11 },
      { question: "Você sabe usar planilhas e ferramentas de organização?", options: ["Sim, avançado", "Sim, básico", "Não", "Estou aprendendo"], category: "habilidades", type: "multiple_choice", order: 12 },
      { question: "Em situações de emergência, você:", options: ["Lidera e organiza", "Ajuda no que for necessário", "Prefere seguir instruções", "Fica paralisado"], category: "personalidade", type: "multiple_choice", order: 13 },
      { question: "Você gosta de ensinar outras pessoas?", options: ["Adoro ensinar", "Gosto moderadamente", "Não tenho paciência", "Prefiro outras atividades"], category: "personalidade", type: "multiple_choice", order: 14 },
      { question: "Você prefere trabalhar em equipe ou sozinho?", options: ["Sempre em equipe", "Prefiro equipe", "Indiferente", "Prefiro sozinho"], category: "personalidade", type: "multiple_choice", order: 15 },
      { question: "Como você reage sob pressão?", options: ["Muito bem", "Razoavelmente bem", "Com dificuldade", "Evito pressão"], category: "personalidade", type: "multiple_choice", order: 16 },
      { question: "Você já participou de voluntariado antes?", options: ["Sim, várias vezes", "Sim, algumas vezes", "Uma vez", "Nunca"], category: "experiencia", type: "multiple_choice", order: 17 },
      { question: "Qual foi sua maior experiência em trabalho comunitário?", options: ["Liderança de equipe", "Organização de eventos", "Trabalho de campo", "Apoio administrativo"], category: "experiencia", type: "multiple_choice", order: 18 },
      { question: "Qual sua disponibilidade de horário?", options: ["Fins de semana", "Dias úteis", "Flexível", "Apenas eventos específicos"], category: "disponibilidade", type: "multiple_choice", order: 19 },
      { question: "Você pode viajar para outros locais se necessário?", options: ["Sim, sempre", "Sim, dependendo da distância", "Talvez", "Não"], category: "disponibilidade", type: "multiple_choice", order: 20 },
      { question: "Quantas horas por semana você pode dedicar?", options: ["Mais de 20h", "10-20h", "5-10h", "Menos de 5h"], category: "disponibilidade", type: "multiple_choice", order: 21 }
    ];

    await TestQuestion.deleteMany({});
    await TestQuestion.insertMany(questions);

    res.json({ message: `${questions.length} perguntas carregadas com sucesso!`, total: questions.length });
  } catch (error) {
    console.error('Erro ao carregar perguntas:', error);
    res.status(500).json({ error: 'Erro ao carregar perguntas: ' + error.message });
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
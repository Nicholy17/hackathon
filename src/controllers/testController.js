import WatsonXService from '../services/watsonx.js';
import TestResult from '../models/TestResult.js';
import TestQuestion from '../models/TestQuestion.js';
import VolunteerProfile from '../models/VolunteerProfile.js';

// Buscar todas as perguntas
export const getQuestions = async (req, res) => {
  try {
    const questions = await TestQuestion.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perguntas' });
  }
};

// Submeter o teste e usar WatsonX para analisar
export const submitTest = async (req, res) => {
  try {
    const { responses } = req.body;
    const userId = req.user.id;

    const volunteerProfile = await VolunteerProfile.findOne({ user: userId });
    
    if (!volunteerProfile) {
      return res.status(404).json({ error: 'Perfil de voluntário não encontrado' });
    }

    const questions = await TestQuestion.find();
    
    const respostasCompletas = responses.map(r => {
      const question = questions.find(q => q._id.toString() === r.questionId);
      return {
        pergunta: question?.question || 'Pergunta não encontrada',
        resposta: r.answer
      };
    });

    const resultadoWatson = await WatsonXService.analyzePerfil(
      respostasCompletas,
      volunteerProfile.habilidades || [],
      volunteerProfile.experiencia || ''
    );

    const testResult = new TestResult({
      volunteer: volunteerProfile._id,
      perfil: resultadoWatson.perfil,
      score: resultadoWatson.score,
      justificativa: resultadoWatson.justificativa,
      recomendacoes: resultadoWatson.recomendacoes,
      status: 'pending',
      responses: responses.map(r => ({
        questionId: r.questionId,
        answer: r.answer
      }))
    });

    await testResult.save();

    res.status(201).json({
      message: 'Teste enviado com sucesso!',
      resultado: {
        perfil: testResult.perfil,
        score: testResult.score,
        justificativa: testResult.justificativa,
        recomendacoes: testResult.recomendacoes,
        status: testResult.status
      }
    });

  } catch (error) {
    console.error('❌ Erro ao submeter teste:', error);
    res.status(500).json({ error: 'Erro ao processar o teste: ' + error.message });
  }
};

// Buscar resultado do teste
export const getTestResult = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const volunteerProfile = await VolunteerProfile.findOne({ user: userId });
    if (!volunteerProfile) {
      return res.status(404).json({ error: 'Perfil de voluntário não encontrado' });
    }

    const testResult = await TestResult.findOne({ volunteer: volunteerProfile._id })
      .sort({ createdAt: -1 });

    if (!testResult) {
      return res.status(404).json({ error: 'Teste não encontrado' });
    }

    res.json({
      perfil: testResult.perfil,
      score: testResult.score,
      justificativa: testResult.justificativa,
      recomendacoes: testResult.recomendacoes,
      status: testResult.status,
      createdAt: testResult.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar resultado' });
  }
};

// Popular perguntas no banco
export const seedQuestions = async (req, res) => {
  try {
    await TestQuestion.deleteMany({});
    
    const perguntas = [
      {
        question: "Você tem experiência com informática?",
        options: ["Sim, avançado", "Sim, básico", "Não", "Estou aprendendo"],
        category: "educacao",
        type: "multiple_choice"
      },
      {
        question: "Você gosta de ensinar outras pessoas?",
        options: ["Adoro ensinar", "Gosto moderadamente", "Não tenho paciência", "Prefiro outras atividades"],
        category: "educacao",
        type: "multiple_choice"
      },
      {
        question: "Em situações de emergência, você:",
        options: ["Lidera e organiza", "Ajuda no que for necessário", "Prefere seguir instruções", "Fica paralisado"],
        category: "operacional",
        type: "multiple_choice"
      },
      {
        question: "Você tem experiência com trabalho voluntário?",
        options: ["Sim, muita experiência", "Sim, alguma experiência", "Pouca experiência", "Nenhuma experiência"],
        category: "apoio_geral",
        type: "multiple_choice"
      },
      {
        question: "Qual sua maior habilidade?",
        options: ["Comunicação", "Organização", "Liderança", "Trabalho em equipe", "Empatia"],
        category: "apoio_geral",
        type: "multiple_choice"
      },
      {
        question: "Você se sente confortável em situações de risco?",
        options: ["Totalmente", "Mais ou menos", "Prefiro evitar", "Depende da situação"],
        category: "operacional",
        type: "multiple_choice"
      },
      {
        question: "Qual sua disponibilidade de horário?",
        options: ["Fins de semana", "Dias úteis", "Flexível", "Apenas eventos específicos"],
        category: "apoio_geral",
        type: "multiple_choice"
      },
      {
        question: "Você tem experiência com logística ou organização de eventos?",
        options: ["Sim, muita", "Sim, alguma", "Pouca", "Nenhuma"],
        category: "apoio_geral",
        type: "multiple_choice"
      },
      {
        question: "Você sabe falar outros idiomas?",
        options: ["Inglês", "Espanhol", "Outros", "Apenas português"],
        category: "educacao",
        type: "multiple_choice"
      },
      {
        question: "Como você lida com trabalho sob pressão?",
        options: ["Muito bem", "Razoavelmente bem", "Com dificuldade", "Evito situações de pressão"],
        category: "operacional",
        type: "multiple_choice"
      }
    ];
    
    await TestQuestion.insertMany(perguntas);
    
    res.status(201).json({ 
      success: true,
      message: `${perguntas.length} perguntas criadas com sucesso!`
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
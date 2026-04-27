import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TestQuestion from '../src/models/TestQuestion.js';

dotenv.config();

const novasPerguntas = [
  // PERSONALIDADE (Traços de comportamento)
  {
    question: "Em situações de pressão, como você reage?",
    type: "multiple_choice",
    options: [
      "Evito me envolver",
      "Fico travado(a)",
      "Preciso de orientação constante",
      "Consigo ajudar com direção",
      "Mantenho a calma e ajudo outros",
      "Assumo liderança naturalmente"
    ],
    category: "personalidade",
    weight: 2,
    order: 1
  },
  {
    question: "Você se considera uma pessoa empática? (0 = Nem um pouco, 5 = Extremamente empática)",
    type: "scale",
    options: ["0", "1", "2", "3", "4", "5"],
    category: "personalidade",
    weight: 1.5,
    order: 2
  },
  {
    question: "Você prefere trabalhar:",
    type: "multiple_choice",
    options: [
      "Sozinho",
      "Em pequenos grupos",
      "Em equipes grandes",
      "Tanto faz"
    ],
    category: "personalidade",
    weight: 1,
    order: 3
  },
  {
    question: "Como você lida com ambientes caóticos ou desorganizados? (0 = Muito mal, 5 = Muito bem)",
    type: "scale",
    options: ["0", "1", "2", "3", "4", "5"],
    category: "personalidade",
    weight: 2,
    order: 4
  },
  {
    question: "Você se sente confortável ajudando pessoas em situação de vulnerabilidade? (0 = Nada confortável, 5 = Totalmente confortável)",
    type: "scale",
    options: ["0", "1", "2", "3", "4", "5"],
    category: "personalidade",
    weight: 2,
    order: 5
  },
  // HABILIDADES
  {
    question: "Você possui conhecimentos em informática?",
    type: "multiple_choice",
    options: [
      "Nenhum",
      "Básico (uso comum)",
      "Intermediário (ensinar tarefas simples)",
      "Avançado (dar aulas, suporte, etc.)"
    ],
    category: "habilidades",
    weight: 1.5,
    order: 6
  },
  {
    question: "Você sabe prestar primeiros socorros?",
    type: "multiple_choice",
    options: [
      "Não",
      "Conhecimento básico",
      "Já tive treinamento",
      "Tenho experiência prática"
    ],
    category: "habilidades",
    weight: 2,
    order: 7
  },
  {
    question: "Você tem facilidade com atividades físicas intensas? (0 = Nenhuma, 5 = Muita facilidade)",
    type: "scale",
    options: ["0", "1", "2", "3", "4", "5"],
    category: "habilidades",
    weight: 2,
    order: 8
  },
  {
    question: "Você tem habilidade em ensinar ou explicar conteúdos? (0 = Nenhuma, 5 = Muita habilidade)",
    type: "scale",
    options: ["0", "1", "2", "3", "4", "5"],
    category: "habilidades",
    weight: 1.5,
    order: 9
  },
  {
    question: "Qual sua principal habilidade relevante?",
    type: "multiple_choice",
    options: [
      "Comunicação",
      "Organização",
      "Liderança",
      "Ensino",
      "Logística",
      "Primeiros Socorros"
    ],
    category: "habilidades",
    weight: 1,
    order: 10
  },
  // EXPERIÊNCIA
  {
    question: "Você já participou de algum trabalho voluntário?",
    type: "multiple_choice",
    options: [
      "Nunca",
      "1 ou 2 vezes",
      "Algumas vezes",
      "Frequentemente"
    ],
    category: "experiencia",
    weight: 2,
    order: 11
  },
  {
    question: "Já atuou em situações de emergência (enchentes, crises, etc.)?",
    type: "multiple_choice",
    options: [
      "Nunca",
      "Apenas presenciei",
      "Ajudei informalmente",
      "Já atuei diretamente"
    ],
    category: "experiencia",
    weight: 2,
    order: 12
  },
  {
    question: "Você já ensinou alguém (formal ou informalmente)? (0 = Nunca, 5 = Muitas vezes)",
    type: "scale",
    options: ["0", "1", "2", "3", "4", "5"],
    category: "experiencia",
    weight: 1.5,
    order: 13
  },
  {
    question: "Já trabalhou em equipe sob pressão? (0 = Nunca, 5 = Frequentemente)",
    type: "scale",
    options: ["0", "1", "2", "3", "4", "5"],
    category: "experiencia",
    weight: 1.5,
    order: 14
  },
  // DISPONIBILIDADE
  {
    question: "Qual sua disponibilidade de tempo?",
    type: "multiple_choice",
    options: [
      "Muito limitada",
      "Finais de semana",
      "Alguns dias na semana",
      "Alta disponibilidade"
    ],
    category: "disponibilidade",
    weight: 2,
    order: 15
  },
  {
    question: "Você pode se deslocar para diferentes regiões?",
    type: "multiple_choice",
    options: [
      "Não",
      "Com dificuldade",
      "Sim, com planejamento",
      "Sim, facilmente"
    ],
    category: "disponibilidade",
    weight: 2,
    order: 16
  },
  {
    question: "Você estaria disponível para atuar em situações emergenciais inesperadas? (0 = Não disponível, 5 = Totalmente disponível)",
    type: "scale",
    options: ["0", "1", "2", "3", "4", "5"],
    category: "disponibilidade",
    weight: 2,
    order: 17
  },
  // Habilidades
  {
    question: "Em uma enchente, qual papel você se identifica mais?",
    type: "multiple_choice",
    options: [
      "Evitar envolvimento",
      "Apoio básico (doações, organização)",
      "Apoio logístico (distribuição, organização local)",
      "Atuação direta (resgate, campo)"
    ],
    category: "habilidades",
    weight: 2,
    order: 18
  },
  {
    question: "Em um projeto social com jovens, você prefere:",
    type: "multiple_choice",
    options: [
      "Não participar",
      "Apoiar organização",
      "Ajudar ocasionalmente",
      "Ensinar ou acompanhar diretamente"
    ],
    category: "habilidades",
    weight: 1.5,
    order: 19
  },
  {
    question: "Se tivesse que escolher uma área para atuar, qual seria?",
    type: "multiple_choice",
    options: [
      "Apoio em desastres (mão na massa)",
      "Ensino e capacitação",
      "Organização/logística",
      "Ainda não sei"
    ],
    category: "habilidades",
    weight: 2,
    order: 20
  }
];

async function atualizarPerguntas() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    // Remover todas as perguntas existentes
    await TestQuestion.deleteMany({});
    console.log('✅ Perguntas antigas removidas');
    
    // Inserir novas perguntas
    await TestQuestion.insertMany(novasPerguntas);
    console.log(`✅ ${novasPerguntas.length} novas perguntas inseridas`);
    
    console.log('\n📋 PERGUNTAS ATUALIZADAS:');
    console.log(`Total: ${novasPerguntas.length} perguntas`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

atualizarPerguntas();
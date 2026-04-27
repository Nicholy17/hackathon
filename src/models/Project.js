import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true
  },
  descricao: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['desastre_natural', 'vulnerabilidade_social', 'educacao', 'saude'],
    required: true
  },
  local: {
    cidade: { type: String, default: '' },
    estado: { type: String, default: '' },
    endereco: { type: String, default: '' }
  },
  localCompleto: {
    endereco: { type: String, default: '' },
    pontoReferencia: { type: String, default: '' },
    observacoes: { type: String, default: '' }
  },
  horarios: {
    dias: [String],
    turno: { type: String, default: '' },
    horas: { type: String, default: '' },
    dataInicio: Date,
    dataFim: Date
  },
  responsavel: {
    nome: { type: String, default: '' },
    cargo: { type: String, default: '' },
    contato: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  instrucoes: {
    oQueLevar: { type: String, default: '' },
    uniforme: { type: String, default: '' },
    documentacao: { type: String, default: '' },
    observacoesGerais: { type: String, default: '' }
  },
  contatoEmergencia: {
    nome: { type: String, default: '' },
    telefone: { type: String, default: '' },
    parentesco: { type: String, default: '' }
  },
  beneficios: {
    tipo: { type: String, default: '' },
    descricao: { type: String, default: '' }
  },
  vagasTotais: {
    type: Number,
    required: true,
    min: 1
  },
  vagasPreenchidas: {
    type: Number,
    default: 0
  },
  voluntarios: [{
    voluntarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VolunteerProfile'
    },
    dataCandidatura: {
      type: Date,
      default: Date.now
    },
    dataInscricao: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'pendente', 'aprovado', 'rejeitado', 'concluido'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['aberto', 'em_andamento', 'fechado', 'concluido', 'em_breve', 'emergencial'],
    default: 'aberto'
  },
  dataInicio: {
    type: Date,
    required: true
  },
  dataFim: {
    type: Date
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // Isso substitui o pre-save manual!
});

// Remova este bloco se existir (está causando o erro):
// projectSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

export default mongoose.model('Project', projectSchema);
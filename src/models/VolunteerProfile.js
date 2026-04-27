import mongoose from 'mongoose';

const volunteerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  idade: {
    type: Number,
    required: true
  },
  telefone: {
    type: String,
    default: ''
  },
  localizacao: {
    cidade: { type: String, default: '' },
    estado: { type: String, default: '' },
    endereco: { type: String, default: '' }
  },
  formacao: {
    escolaridade: { type: String, default: '' },
    curso: { type: String, default: '' },
    instituicao: { type: String, default: '' },
    anoConclusao: Number
  },
  experiencia: {
    voluntariado: { type: String, default: '' },
    profissional: { type: String, default: '' },
    anosExperiencia: Number
  },
  habilidades: [String],
  disponibilidade: {
    horarios: { type: String, default: '' },
    diasSemana: [String],
    emergencia: { type: Boolean, default: false },
    disponivelImediato: { type: Boolean, default: false }
  },
  testCompleted: {
    type: Boolean,
    default: false
  },
  projetos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  projetosAnteriores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // Isso substitui o pre-save manual
});

// Se quiser manter o pre-save, use esta versão:
// volunteerProfileSchema.pre('save', function(next) {
//   try {
//     this.updatedAt = Date.now();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

export default mongoose.model('VolunteerProfile', volunteerProfileSchema);
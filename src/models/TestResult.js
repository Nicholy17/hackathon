import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VolunteerProfile',
    required: true
  },
  perfil: {
    type: String,
    enum: ['OPERACIONAL', 'EDUCACIONAL', 'APOIO GERAL', 'SOCIAL'],
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  justificativa: {
    type: String,
    default: ''
  },
  recomendacoes: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'em_analise'],
    default: 'pending'
  },
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestQuestion'
    },
    answer: String
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
// testResultSchema.pre('save', function(next) {
//   try {
//     this.updatedAt = Date.now();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

export default mongoose.model('TestResult', testResultSchema);
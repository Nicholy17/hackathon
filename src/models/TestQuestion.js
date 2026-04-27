import mongoose from 'mongoose';

const testQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'scale', 'text'],
    required: true
  },
  options: [String],
  category: {
    type: String,
    enum: ['habilidades', 'personalidade', 'experiencia', 'disponibilidade'],
    required: true
  },
  weight: {
    type: Number,
    default: 1
  },
  order: Number,
  active: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('TestQuestion', testQuestionSchema);
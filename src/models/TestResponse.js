import mongoose from 'mongoose';

const testResponseSchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestQuestion'
    },
    answer: mongoose.Schema.Types.Mixed,
    score: Number
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('TestResponse', testResponseSchema);
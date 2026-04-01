import mongoose from 'mongoose'

const assessmentSubmissionSchema = new mongoose.Schema(
  {
    answers: {
      type: Map,
      of: String,
      required: true,
    },
    assessmentId: {
      type: String,
      required: true,
    },
    candidateDetails: {
      age: String,
      email: String,
      fullName: String,
      location: String,
      roleApplied: String,
    },
    currentQuestionIndex: {
      type: Number,
      required: true,
    },
    metadata: {
      durationInMinutes: Number,
      totalQuestions: Number,
    },
    reason: {
      type: String,
      required: true,
    },
    session: {
      assessmentId: String,
      durationInMinutes: Number,
      expiresAt: Number,
      startedAt: Number,
      status: String,
    },
    submissionKey: {
      type: String,
      required: true,
      unique: true,
    },
    submittedAt: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'assessment_submissions',
    timestamps: true,
  },
)

export const AssessmentSubmissionModel =
  mongoose.models.AssessmentSubmission ||
  mongoose.model('AssessmentSubmission', assessmentSubmissionSchema)

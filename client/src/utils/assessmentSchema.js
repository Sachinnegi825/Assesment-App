export function normalizeAssessment(masterAssessmentJson) {
  const meta = masterAssessmentJson.assessment_meta

  return {
    metadata: {
      assessmentId: slugify(meta.title),
      assessmentTitle: meta.title,
      durationInMinutes: meta.time_limit_minutes,
      instructions: [
        `You will answer ${meta.total_questions} multiple-choice questions in one sitting.`,
        `Scoring: +${meta.scoring.correct} for correct, ${meta.scoring.incorrect} for incorrect, ${meta.scoring.unanswered} for unanswered.`,
        'Select one option per question and review carefully before moving forward.',
        'The timer continues once the test starts, even if you refresh or pause.',
      ],
      intent: meta.intent,
      scoring: meta.scoring,
      totalQuestions: meta.total_questions,
    },
    questions: masterAssessmentJson.questions.map((question) => ({
      id: question.id,
      section: question.section,
      topic: question.topic,
      prompt: question.question,
      options: Object.entries(question.options).map(([id, label]) => ({
        id,
        label,
      })),
      correctOptionIds: question.ans,
      score: question.score,
      metadata: question.metadata,
    })),
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

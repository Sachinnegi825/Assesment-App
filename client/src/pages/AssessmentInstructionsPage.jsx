import { useNavigate } from 'react-router-dom'
import SessionShell from '../components/SessionShell'
import { useAssessment } from '../context/useAssessment'

function AssessmentInstructionsPage() {
  const navigate = useNavigate()
  const { assessmentDefinition, candidateDetails, startAssessment } = useAssessment()
  const { metadata, questions } = assessmentDefinition
  const sampleQuestion = questions[0]

  function handleStartAssessment() {
    startAssessment()
    navigate('/assessment')
  }

  return (
    <SessionShell
      action={
        <button
          className="secondary-button button-link"
          onClick={() => navigate('/candidate-details')}
          type="button"
        >
          Edit Candidate Details
        </button>
      }
      eyebrow="Assessment explainer"
      subtitle="Read the test structure carefully before you begin. The duration and instructions below are loaded from the shared assessment JSON."
      title={metadata.assessmentTitle}
    >
      <section className="instructions-layout">
        <article className="instructions-card instructions-card--highlight">
          <p className="info-card__label">Time notice</p>
          <h2>{metadata.durationInMinutes} minutes</h2>
          <p>
            You will answer {metadata.totalQuestions} MCQs in one sitting. The timer
            continues once started and does not pause.
          </p>

          <div className="instructions-list">
            {metadata.instructions.map((instruction) => (
              <p key={instruction}>{instruction}</p>
            ))}
          </div>
        </article>

        <article className="instructions-card">
          <p className="info-card__label">How MCQs work</p>
          <h2>One best option per question</h2>
          <p>
            Each question presents four options. Select the answer that best matches
            your judgment without relying on external lookup.
          </p>
          <p className="instructions-note">
            Assessment intent: {metadata.intent}
          </p>
          <p className="instructions-note">
            Candidate: {candidateDetails.fullName || 'Candidate details saved'}
          </p>
        </article>

        <article className="instructions-card instructions-card--sample">
          <p className="info-card__label">Sample question</p>
          <h2>{sampleQuestion.prompt}</h2>
          <div className="sample-options">
            {sampleQuestion.options.map((option) => (
              <div className="sample-option" key={option.id}>
                <span>{option.id}</span>
                <p>{option.label}</p>
              </div>
            ))}
          </div>
          <p className="sample-answer">
            Sample answer format: select a single option such as <strong>C</strong>.
          </p>
        </article>
      </section>

      <section className="instructions-footer">
        <p className="instructions-warning">
          Warning: once you press Start Test, the assessment should be treated as live
          and the timer continues running.
        </p>
        <button className="primary-button" onClick={handleStartAssessment} type="button">
          Start Test
        </button>
      </section>
    </SessionShell>
  )
}

export default AssessmentInstructionsPage

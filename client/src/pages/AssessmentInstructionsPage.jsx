import { useNavigate } from 'react-router-dom'
import SessionShell from '../components/SessionShell'
import { useAssessment } from '../context/useAssessment'
import { useState } from 'react'

function AssessmentInstructionsPage() {
  const navigate = useNavigate()
  const { assessmentDefinition, candidateDetails, startAssessment } = useAssessment()
  const { metadata, questions } = assessmentDefinition
  const sampleQuestion = questions[0]
  const [cameraError, setCameraError] = useState(null)

  async function handleStartAssessment() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })

      const element = document.documentElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      }

      startAssessment()
      navigate('/assessment')
    } catch (err) {
      setCameraError("Camera access is required for proctoring. Please enable it to continue.")
    }
  }

  return (
    <>
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
        subtitle="Read the test structure and security guidelines carefully. The environment is monitored to ensure fairness."
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

          <article className="instructions-card instructions-card--security">
            <p className="info-card__label" style={{ color: 'var(--error-color)' }}>Security Enforcement</p>
            <h2>Integrity & AI Proctoring</h2>
            <p>To ensure a fair screening process, the following rules are strictly enforced:</p>
            <ul className="security-list">
              <li><strong>Full-Screen Mode:</strong> The exam must be taken in full-screen. Exiting will trigger a violation.</li>
              <li><strong>AI Monitoring:</strong> Camera-based proctoring detects face presence and visibility.</li>
              <li><strong>No Tab Switching:</strong> Leaving this tab or opening new windows is prohibited.</li>
              <li><strong>Restrictions:</strong> Copying, pasting, and right-clicking are disabled.</li>
            </ul>
            <p className="instructions-warning" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
              Violation Limit: 3 warnings will result in automatic submission and disqualification.
            </p>
          </article>

          <article className="instructions-card">
            <p className="info-card__label">How MCQs work</p>
            <h2>One best option per question</h2>
            <p>
              Each question presents four options. Select the answer that best matches
              your judgment without relying on external lookup.
            </p>
            <p className="instructions-note">
              Candidate: {candidateDetails.fullName || 'Verified'}
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
          </article>
        </section>

        <section className="instructions-footer">
          {cameraError && <p className="form-message form-message--error" style={{ marginBottom: '1rem' }}>{cameraError}</p>}
          <p className="instructions-warning">
            Warning: Once you press Start Test, you enter Full-Screen mode and AI monitoring begins.
          </p>
          <button className="primary-button" onClick={handleStartAssessment} type="button">
            Start Test
          </button>
        </section>
      </SessionShell>
    </>
  )
}

export default AssessmentInstructionsPage
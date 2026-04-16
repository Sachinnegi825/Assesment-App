import { useNavigate } from 'react-router-dom'
import SessionShell from '../components/SessionShell'
import { useAssessment } from '../context/useAssessment'
import { useState } from 'react'

function AssessmentInstructionsPage() {
  const navigate = useNavigate()
  const { assessmentDefinition, candidateDetails, startAssessment } = useAssessment()
  const { metadata, questions } = assessmentDefinition
  const sampleQuestion = questions[0]
  const [sensorError, setSensorError] = useState(null)

  async function handleStartAssessment() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const element = document.documentElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen()
      }
      startAssessment()
      navigate('/assessment')
    } catch (err) {
      setSensorError("Camera and Microphone access are required for proctoring. Please enable both in browser settings to continue.")
    }
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
      eyebrow="Security Briefing"
      subtitle="AI Monitoring (Face, Voice, and Object detection) is active for this session."
      title={metadata.assessmentTitle}
    >
      <section className="instructions-layout">
        <article className="instructions-card instructions-card--highlight">
          <p className="info-card__label">Time notice</p>
          <h2>{metadata.durationInMinutes} minutes</h2>
          <p>You will answer {metadata.totalQuestions} MCQs in one sitting. The timer continues once started and does not pause.</p>
          <div className="instructions-list">
            {metadata.instructions.map((instruction) => (
              <p key={instruction}>{instruction}</p>
            ))}
          </div>
        </article>

        <article className="instructions-card instructions-card--security">
          <p className="info-card__label" style={{ color: 'var(--error-color)' }}>Advanced Proctoring Active</p>
          <h2>Security Enforcement</h2>
          <p>To ensure a fair screening process, the following rules are strictly enforced:</p>
          <ul className="security-list">
            <li><strong>Voice Detection:</strong> Avoid speaking or loud background noise.</li>
            <li><strong>Eye Tracking:</strong> Keep your gaze on the screen at all times.</li>
            <li><strong>Object Detection:</strong> Mobile phones and books are strictly prohibited.</li>
            <li><strong>Full-Screen Mode:</strong> Exiting will trigger an immediate violation.</li>
          </ul>
          <p className="instructions-warning" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
            Violation Limit: 5 major warnings will result in automatic submission and disqualification.
          </p>
        </article>

        <article className="instructions-card">
          <p className="info-card__label">How MCQs work</p>
          <h2>One best option per question</h2>
          <p>Each question presents four options. Select the answer that best matches your judgment.</p>
          <p className="instructions-note">Candidate: {candidateDetails.fullName || 'Verified'}</p>
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
        {sensorError && <p className="form-message form-message--error" style={{ marginBottom: '1rem' }}>{sensorError}</p>}
        <p className="instructions-warning">Warning: Once you press Start Test, you enter Full-Screen mode and AI monitoring begins.</p>
        <button className="primary-button" onClick={handleStartAssessment} type="button">Start Test</button>
      </section>
    </SessionShell>
  )
}

export default AssessmentInstructionsPage
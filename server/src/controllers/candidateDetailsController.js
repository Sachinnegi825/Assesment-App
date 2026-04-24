import { validateCandidateDetails } from '../services/candidateDetailsService.js'
import { getGlobalSettings } from '../services/adminSettingsService.js'
import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js'

export async function validateCandidateDetailsInput(request, response) {
  console.info('[server] candidate details validation hit')

  try {
    const settings = await getGlobalSettings()
    const registrationCap = settings.registrationCap

    if (registrationCap > 0) {
      const participantCount = await AssessmentSubmissionModel.distinct('candidateDetails.email').then(emails => emails.length)

      if (participantCount >= registrationCap) {
        // Check if THIS candidate is already in the system
        const existingCandidate = await AssessmentSubmissionModel.findOne({
          'candidateDetails.email': request.body.email?.trim().toLowerCase()
        })

        if (!existingCandidate) {
          console.warn(`[server] registration cap reached: ${participantCount}/${registrationCap}`)
          return response.status(403).json({
            message: 'Registration cap reached. No more participants are allowed at this time.',
            success: false
          })
        }
      }
    }

    const result = await validateCandidateDetails(request.body)

    if (!result.isValid) {
      const errorMessages = Object.values(result.errors)
      const specificMessage = errorMessages.length > 0 
        ? errorMessages[0] 
        : 'Candidate details validation failed.'

      return response.status(400).json({
        errors: result.errors,
        message: specificMessage,
        success: false
      })
    }

    return response.status(200).json({
      candidateDetails: result.candidateDetails,
      message: 'Candidate details are valid.',
      success: true
    })
  } catch (error) {
    console.error('[server] candidate details validation error', error)
    return response.status(500).json({
      message: 'An error occurred while validating candidate details.',
      success: false
    })
  }
}

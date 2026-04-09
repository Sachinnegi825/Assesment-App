import { validateCandidateDetails } from '../services/candidateDetailsService.js'

export async function validateCandidateDetailsInput(request, response) {
  console.info('[server] candidate details validation hit')

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
}

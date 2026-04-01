import { validateCandidateDetails } from '../services/candidateDetailsService.js'

export function validateCandidateDetailsInput(request, response) {
  console.info('[server] candidate details validation hit')

  const result = validateCandidateDetails(request.body)

  if (!result.isValid) {
    return response.status(400).json({
      errors: result.errors,
      message: 'Candidate details validation failed.',
    })
  }

  return response.status(200).json({
    candidateDetails: result.candidateDetails,
    message: 'Candidate details are valid.',
  })
}

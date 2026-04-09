import {
  ensureSubmissionNotDuplicate,
  mirrorSubmission,
  releaseSubmissionKey,
  validateSubmissionPayload,
} from '../services/submissionService.js'

export async function submitAssessment(request, response) {
  // CRITICAL: Added await here because validateSubmissionPayload is now an async function
  const validation = await validateSubmissionPayload(request.body)

  if (!validation.isValid) {
    return response.status(400).json({
      code: 'SUBMISSION_VALIDATION_FAILED',
      errors: validation.errors,
      message: 'Assessment submission payload is invalid.',
      success: false,
    })
  }

  // Pass the reason to the duplicate checker
  if (!ensureSubmissionNotDuplicate(validation.submissionKey, validation.normalizedPayload.reason)) {
    return response.status(409).json({
      code: 'DUPLICATE_SUBMISSION',
      message: 'This assessment has already been finalized.',
      success: false,
    })
  }

  try {
    await mirrorSubmission(validation.normalizedPayload);

    console.info('[server] submission stored/mirrored')
    return response.status(201).json({
      data: {
        submissionKey: validation.submissionKey,
      },
      message: 'Your assessment has been submitted successfully.',
      success: true,
    })
  } catch (error) {
    releaseSubmissionKey(validation.submissionKey)

    if (error.message === 'duplicate_submission') {
      console.warn('[server] submission failed: duplicate')
      return response.status(409).json({
        code: 'DUPLICATE_SUBMISSION',
        message: 'This assessment attempt has already been submitted.',
        success: false,
      })
    }

    console.error('[server] submission failed', error)
    return response.status(500).json({
      code: 'SUBMISSION_FAILED',
      message: 'Assessment submission could not be processed.',
      success: false,
    })
  }
}
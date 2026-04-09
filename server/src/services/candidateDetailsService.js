import { AssessmentSubmissionModel } from '../models/assessmentSubmissionModel.js';

const EMAIL_PATTERN =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;

export async function validateCandidateDetails(details = {}) {
  const errors = {};
  const normalized = {
    age: String(details.age || '').trim(),
    email: String(details.email || '').trim().toLowerCase(),
    fullName: String(details.fullName || '').trim(),
    location: String(details.location || '').trim(),
    roleApplied: String(details.roleApplied || '').trim(),
  };

  // 1. Basic Format Validations
  if (!normalized.fullName) {
    errors.fullName = 'Full name is required.';
  } else if (normalized.fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!normalized.age) {
    errors.age = 'Age is required.';
  } else if (!/^\d+$/.test(normalized.age)) {
    errors.age = 'Age must be a whole number.';
  } else {
    const age = Number(normalized.age);
    if (age < 18 || age > 99) {
      errors.age = 'Age must be between 18 and 99.';
    }
  }

  if (!normalized.email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(normalized.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!normalized.location) {
    errors.location = 'Location is required.';
  } else if (normalized.location.length < 2) {
    errors.location = 'Location must be at least 2 characters.';
  }

  if (!normalized.roleApplied) {
    errors.roleApplied = 'Role or job description is required.';
  } else if (normalized.roleApplied.length < 2) {
    errors.roleApplied = 'Role or job description must be at least 2 characters.';
  }

  // 2. Database Check: Duplicate Email (Only if email format is already valid)
  if (!errors.email) {
    try {
      const existingSubmission = await AssessmentSubmissionModel.findOne({
        'candidateDetails.email': normalized.email
      });

      if (existingSubmission) {
        errors.email = 'You have already taken this assessment. Multiple attempts are not permitted. If you believe this is an error, please contact the administrator at evaluator@sidlabs.net.';
      }
    } catch (dbError) {
      console.error('[server] Error checking for duplicate candidate:', dbError);
      // We don't block the user if the DB check fails, but you could add a generic error here
    }
  }

  return {
    candidateDetails: normalized,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
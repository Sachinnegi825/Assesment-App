const EMAIL_PATTERN =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/

export function validateCandidateDetails(values) {
  const errors = {}
  const fullName = values.fullName.trim()
  const location = values.location.trim()
  const roleApplied = values.roleApplied.trim()
  const email = values.email.trim()
  const ageValue = String(values.age).trim()

  if (!fullName) {
    errors.fullName = 'Full name is required.'
  } else if (fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.'
  }

  if (!ageValue) {
    errors.age = 'Age is required.'
  } else if (!/^\d+$/.test(ageValue)) {
    errors.age = 'Age must be a whole number.'
  } else {
    const age = Number(ageValue)

    if (age < 18 || age > 99) {
      errors.age = 'Age must be between 18 and 99.'
    }
  }

  if (!email) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!location) {
    errors.location = 'Location is required.'
  } else if (location.length < 2) {
    errors.location = 'Location must be at least 2 characters.'
  }

  if (!roleApplied) {
    errors.roleApplied = 'Role or job description is required.'
  } else if (roleApplied.length < 2) {
    errors.roleApplied = 'Role or job description must be at least 2 characters.'
  }

  return errors
}

export function isCandidateDetailsValid(values) {
  return Object.keys(validateCandidateDetails(values)).length === 0
}

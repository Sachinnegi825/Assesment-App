export function validateAdminPasswordForm({
  confirmNewPassword,
  currentPassword,
  newPassword,
}) {
  const errors = {}

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required.'
  }

  if (!newPassword) {
    errors.newPassword = 'New password is required.'
  } else {
    if (newPassword.length < 12) {
      errors.newPassword = 'New password must be at least 12 characters.'
    } else if (!/[a-z]/.test(newPassword)) {
      errors.newPassword = 'New password must include at least one lowercase letter.'
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword = 'New password must include at least one uppercase letter.'
    } else if (!/\d/.test(newPassword)) {
      errors.newPassword = 'New password must include at least one number.'
    } else if (!/[^A-Za-z0-9]/.test(newPassword)) {
      errors.newPassword = 'New password must include at least one special character.'
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'New password must be different from the current password.'
    }
  }

  if (!confirmNewPassword) {
    errors.confirmNewPassword = 'Please confirm the new password.'
  } else if (newPassword && confirmNewPassword !== newPassword) {
    errors.confirmNewPassword = 'Confirmation does not match the new password.'
  }

  return errors
}

import { getGlobalSettings, updateGlobalSettings } from '../services/adminSettingsService.js'

export async function getSettings(request, response) {
  try {
    const settings = await getGlobalSettings()
    return response.status(200).json({
      data: settings,
      success: true,
    })
  } catch (error) {
    console.error('[server] get settings failed', error)
    return response.status(500).json({
      message: 'Settings could not be loaded.',
      success: false,
    })
  }
}

export async function updateSettings(request, response) {
  try {
    const { registrationCap, qualifyingThreshold } = request.body

    const updates = {
      registrationCap: Number(registrationCap),
      qualifyingThreshold: Number(qualifyingThreshold),
    }

    if (isNaN(updates.registrationCap) || updates.registrationCap < 0) {
      return response.status(400).json({
        message: 'Invalid registration cap.',
        success: false,
      })
    }

    if (isNaN(updates.qualifyingThreshold) || updates.qualifyingThreshold < 0 || updates.qualifyingThreshold > 100) {
      return response.status(400).json({
        message: 'Invalid qualifying threshold (0-100).',
        success: false,
      })
    }

    const settings = await updateGlobalSettings(updates)

    return response.status(200).json({
      data: settings,
      message: 'Settings updated successfully.',
      success: true,
    })
  } catch (error) {
    console.error('[server] update settings failed', error)
    return response.status(500).json({
      message: 'Settings could not be updated.',
      success: false,
    })
  }
}

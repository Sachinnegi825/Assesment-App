import { getAdminSubmissionTableData } from '../services/adminSubmissionTableService.js'

export async function getAdminSubmissions(request, response) {
  console.info(`[server] admin submissions fetch started: ${request.user.email}`)

  try {
    const payload = await getAdminSubmissionTableData(request.query)

    console.info(`[server] admin submissions fetch success: ${request.user.email}`)
    return response.status(200).json({
      data: payload,
      success: true,
    })
  } catch (error) {
    if (error.message === 'database_unavailable') {
      console.warn('[server] admin submissions fetch failed: database unavailable')
      return response.status(503).json({
        message: 'Submission table data is unavailable until MongoDB is connected.',
        success: false,
      })
    }

    console.error('[server] admin submissions fetch failed', error)
    return response.status(500).json({
      message: 'Submission table data could not be loaded.',
      success: false,
    })
  }
}

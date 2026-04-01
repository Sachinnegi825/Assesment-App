import { getAdminDashboardData } from '../services/adminDashboardService.js'

export async function getAdminDashboard(request, response) {
  console.info(`[server] admin dashboard fetch started: ${request.user.email}`)

  try {
    const dashboard = await getAdminDashboardData()

    console.info(`[server] admin dashboard fetch success: ${request.user.email}`)
    return response.status(200).json({
      data: dashboard,
      success: true,
    })
  } catch (error) {
    if (error.message === 'database_unavailable') {
      console.warn(`[server] admin dashboard fetch failed: database unavailable`)
      return response.status(503).json({
        message: 'Dashboard data is unavailable until MongoDB is connected.',
        success: false,
      })
    }

    console.error('[server] admin dashboard fetch failed', error)
    return response.status(500).json({
      message: 'Dashboard data could not be loaded.',
      success: false,
    })
  }
}

import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'
import { ensureSeedAdminUser } from './services/adminAccountService.js'
import { ensureSeedSettings } from './services/adminSettingsService.js'

export async function startServer() {
  const isDatabaseConnected = await connectDatabase()

  if (isDatabaseConnected) {
    await ensureSeedAdminUser()
    await ensureSeedSettings()
  }

  const app = createApp()

  app.listen(env.port, () => {
    console.info(`[server] server started on port ${env.port}`)
  })

  return app
}

import { normalizeAccessLogEntry, recordAccessLog } from '../services/accessLogService.js'

export function captureAccessLog(request, response, next) {
  response.on('finish', () => {
    void recordAccessLog(normalizeAccessLogEntry(request, response))
  })

  next()
}

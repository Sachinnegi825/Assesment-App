import { getHealthPayload } from '../services/healthService.js'

export function getHealth(_request, response) {
  console.info('[server] health check hit')
  response.status(200).json(getHealthPayload())
}

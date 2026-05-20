import type { TicketPrefix } from './types'

export function generateTicket(prefix: TicketPrefix): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${year}-${rand}`
}

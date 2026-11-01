import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { setupHandlers } from './setup'
import { studentHandlers } from './students'

export const worker = setupWorker(...handlers, ...setupHandlers, ...studentHandlers)

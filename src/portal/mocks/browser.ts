import { setupWorker } from 'msw/browser'
import { activityHandlers } from './activity'
import { examHandlers } from './exams'
import { feeHandlers } from './fees'
import { handlers } from './handlers'
import { setupHandlers } from './setup'
import { studentHandlers } from './students'

// feeHandlers go first: its GET /me adds the student record for the student login.
export const worker = setupWorker(
  ...feeHandlers,
  ...examHandlers,
  ...activityHandlers,
  ...handlers,
  ...setupHandlers,
  ...studentHandlers
)

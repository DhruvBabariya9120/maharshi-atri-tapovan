import { RequireRole } from './auth/session'
import { AdminShell } from './layout/AdminShell'
import { PortalShell } from './layout/PortalShell'

export function AdminArea() {
  return (
    <RequireRole role="ADMIN">
      <AdminShell />
    </RequireRole>
  )
}

export function StudentArea() {
  return (
    <RequireRole role="STUDENT">
      <PortalShell />
    </RequireRole>
  )
}

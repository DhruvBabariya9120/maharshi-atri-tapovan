import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Home } from './pages/Home'

// Home stays eager (first paint). Other routes use the router's native `lazy`,
// which awaits the chunk BEFORE rendering the route — the page transition never
// runs against an empty, still-downloading page.
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', lazy: () => import('./pages/About').then((m) => ({ Component: m.About })) },
      {
        path: 'academics',
        lazy: () => import('./pages/Academics').then((m) => ({ Component: m.Academics })),
      },
      {
        path: 'campus-life',
        lazy: () => import('./pages/CampusLife').then((m) => ({ Component: m.CampusLife })),
      },
      {
        path: 'hostel',
        lazy: () => import('./pages/Hostel').then((m) => ({ Component: m.Hostel })),
      },
      {
        path: 'achievements',
        lazy: () => import('./pages/Achievements').then((m) => ({ Component: m.Achievements })),
      },
      {
        path: 'gallery',
        lazy: () => import('./pages/Gallery').then((m) => ({ Component: m.Gallery })),
      },
      {
        path: 'admissions',
        lazy: () => import('./pages/Admissions').then((m) => ({ Component: m.Admissions })),
      },
      {
        path: '*',
        lazy: () => import('./pages/NotFound').then((m) => ({ Component: m.NotFound })),
      },
    ],
  },
  // Admin panel and student portal. Everything here is lazy, so the public site's
  // bundle doesn't grow; PortalRoot brings the query client and the session.
  {
    lazy: () => import('./portal/PortalRoot').then((m) => ({ Component: m.PortalRoot })),
    children: [
      {
        path: 'login',
        lazy: () => import('./portal/auth/AuthPages').then((m) => ({ Component: m.Login })),
      },
      {
        path: 'forgot-password',
        lazy: () =>
          import('./portal/auth/AuthPages').then((m) => ({ Component: m.ForgotPassword })),
      },
      {
        path: 'reset-password',
        lazy: () => import('./portal/auth/AuthPages').then((m) => ({ Component: m.ResetPassword })),
      },
      {
        path: 'accept-invite',
        lazy: () => import('./portal/auth/AuthPages').then((m) => ({ Component: m.AcceptInvite })),
      },
      {
        path: 'admin',
        lazy: () => import('./portal/areas').then((m) => ({ Component: m.AdminArea })),
        children: [
          {
            index: true,
            lazy: () =>
              import('./portal/pages/Placeholders').then((m) => ({ Component: m.Welcome })),
          },
          {
            path: '*',
            lazy: () =>
              import('./portal/pages/Placeholders').then((m) => ({ Component: m.ComingSoon })),
          },
        ],
      },
      {
        path: 'me',
        lazy: () => import('./portal/areas').then((m) => ({ Component: m.StudentArea })),
        children: [
          {
            index: true,
            lazy: () =>
              import('./portal/pages/Placeholders').then((m) => ({ Component: m.Welcome })),
          },
          {
            path: '*',
            lazy: () =>
              import('./portal/pages/Placeholders').then((m) => ({ Component: m.ComingSoon })),
          },
        ],
      },
    ],
  },
])

// Dev only: `VITE_API_MOCK=true npm run dev` answers /api/v1 from src/portal/mocks
// while the backend returns 501. The dynamic import is dropped from production builds.
async function startMocks() {
  if (import.meta.env.DEV && import.meta.env.VITE_API_MOCK === 'true') {
    const { worker } = await import('./portal/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

startMocks().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
)
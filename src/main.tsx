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
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

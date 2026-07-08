import { StrictMode, Suspense, lazy, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Home } from './pages/Home'

// Home stays eager (first paint); other routes load on demand.
const load = (p: () => Promise<Record<string, ComponentType>>, name: string) =>
  lazy(() => p().then((m) => ({ default: m[name] })))

const About = load(() => import('./pages/About'), 'About')
const Academics = load(() => import('./pages/Academics'), 'Academics')
const CampusLife = load(() => import('./pages/CampusLife'), 'CampusLife')
const Hostel = load(() => import('./pages/Hostel'), 'Hostel')
const Achievements = load(() => import('./pages/Achievements'), 'Achievements')
const Gallery = load(() => import('./pages/Gallery'), 'Gallery')
const Admissions = load(() => import('./pages/Admissions'), 'Admissions')
const NotFound = load(() => import('./pages/NotFound'), 'NotFound')

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'academics', element: <Academics /> },
      { path: 'campus-life', element: <CampusLife /> },
      { path: 'hostel', element: <Hostel /> },
      { path: 'achievements', element: <Achievements /> },
      { path: 'gallery', element: <Gallery /> },
      { path: 'admissions', element: <Admissions /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>,
)

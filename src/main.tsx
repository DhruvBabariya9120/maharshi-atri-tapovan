import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Academics } from './pages/Academics'
import { CampusLife } from './pages/CampusLife'
import { Hostel } from './pages/Hostel'
import { Achievements } from './pages/Achievements'
import { Gallery } from './pages/Gallery'
import { Admissions } from './pages/Admissions'
import { NotFound } from './pages/NotFound'

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
    <RouterProvider router={router} />
  </StrictMode>,
)
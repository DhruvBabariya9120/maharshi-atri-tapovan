import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, redirect, RouterProvider } from 'react-router-dom'
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
              import('./portal/pages/Dashboard').then((m) => ({ Component: m.Dashboard })),
          },
          {
            path: 'students',
            lazy: () =>
              import('./portal/pages/students/StudentList').then((m) => ({
                Component: m.StudentList,
              })),
          },
          {
            path: 'students/new',
            lazy: () =>
              import('./portal/pages/students/StudentForm').then((m) => ({
                Component: m.StudentForm,
              })),
          },
          {
            path: 'students/:id',
            lazy: () =>
              import('./portal/pages/students/StudentProfile').then((m) => ({
                Component: m.StudentProfile,
              })),
          },
          {
            path: 'students/:id/edit',
            lazy: () =>
              import('./portal/pages/students/StudentForm').then((m) => ({
                Component: m.StudentForm,
              })),
          },
          {
            path: 'promote',
            lazy: () =>
              import('./portal/pages/students/Promote').then((m) => ({ Component: m.Promote })),
          },
          {
            path: 'users',
            lazy: () => import('./portal/pages/Users').then((m) => ({ Component: m.Users })),
          },
          { path: 'setup', loader: () => redirect('/admin/setup/years') },
          {
            path: 'setup/years',
            lazy: () =>
              import('./portal/pages/setup/AcademicYears').then((m) => ({
                Component: m.AcademicYears,
              })),
          },
          {
            path: 'setup/classes',
            lazy: () =>
              import('./portal/pages/setup/Classes').then((m) => ({ Component: m.Classes })),
          },
          {
            path: 'setup/subjects',
            lazy: () =>
              import('./portal/pages/setup/Subjects').then((m) => ({ Component: m.Subjects })),
          },
          {
            path: 'setup/grades',
            lazy: () =>
              import('./portal/pages/setup/GradeScales').then((m) => ({
                Component: m.GradeScales,
              })),
          },
          {
            path: 'account',
            lazy: () =>
              import('./portal/pages/AccountSettings').then((m) => ({
                Component: m.AccountSettings,
              })),
          },
          {
            path: 'fees',
            lazy: () =>
              import('./portal/pages/fees/FeeOverview').then((m) => ({ Component: m.FeeOverview })),
          },
          {
            path: 'fees/assign',
            lazy: () =>
              import('./portal/pages/fees/AssignFees').then((m) => ({ Component: m.AssignFees })),
          },
          {
            path: 'students/:id/receipts/:paymentId',
            lazy: () =>
              import('./portal/pages/fees/Receipt').then((m) => ({ Component: m.AdminReceipt })),
          },
          {
            path: 'payment-requests',
            lazy: () =>
              import('./portal/pages/fees/PaymentRequests').then((m) => ({
                Component: m.PaymentRequests,
              })),
          },
          {
            path: 'payment-requests/:id',
            lazy: () =>
              import('./portal/pages/fees/PaymentReview').then((m) => ({
                Component: m.PaymentReview,
              })),
          },
          {
            path: 'exams',
            lazy: () =>
              import('./portal/pages/exams/ExamList').then((m) => ({ Component: m.ExamList })),
          },
          {
            path: 'exams/new',
            lazy: () =>
              import('./portal/pages/exams/ExamForm').then((m) => ({ Component: m.ExamForm })),
          },
          {
            path: 'exams/:id',
            lazy: () =>
              import('./portal/pages/exams/ExamDetail').then((m) => ({ Component: m.ExamDetail })),
          },
          {
            path: 'exams/:id/edit',
            lazy: () =>
              import('./portal/pages/exams/ExamForm').then((m) => ({ Component: m.ExamForm })),
          },
          {
            path: 'exams/:id/marks/:paperId',
            lazy: () =>
              import('./portal/pages/exams/MarksEntry').then((m) => ({ Component: m.MarksEntry })),
          },
          {
            path: 'exams/:id/results',
            lazy: () =>
              import('./portal/pages/exams/ExamResults').then((m) => ({
                Component: m.ExamResults,
              })),
          },
          {
            path: 'activity',
            lazy: () => import('./portal/pages/Activity').then((m) => ({ Component: m.Activity })),
          },
          {
            path: 'setup/payment',
            lazy: () =>
              import('./portal/pages/setup/PaymentSettings').then((m) => ({
                Component: m.PaymentSettings,
              })),
          },
          {
            path: '*',
            lazy: () =>
              import('./portal/pages/Placeholders').then((m) => ({ Component: m.PortalNotFound })),
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
              import('./portal/pages/me/MyProfile').then((m) => ({ Component: m.MyProfile })),
          },
          {
            path: 'account',
            lazy: () =>
              import('./portal/pages/AccountSettings').then((m) => ({
                Component: m.AccountSettings,
              })),
          },
          {
            path: 'fees',
            lazy: () => import('./portal/pages/me/MyFees').then((m) => ({ Component: m.MyFees })),
          },
          {
            path: 'fees/:feeId/pay',
            lazy: () => import('./portal/pages/me/PayFee').then((m) => ({ Component: m.PayFee })),
          },
          {
            path: 'results',
            lazy: () =>
              import('./portal/pages/me/MyResults').then((m) => ({ Component: m.MyResults })),
          },
          {
            path: 'receipts/:paymentId',
            lazy: () =>
              import('./portal/pages/fees/Receipt').then((m) => ({ Component: m.MyReceipt })),
          },
          {
            path: '*',
            lazy: () =>
              import('./portal/pages/Placeholders').then((m) => ({ Component: m.PortalNotFound })),
          },
        ],
      },
    ],
  },
])

// Dev only: `VITE_API_MOCK=true npm run dev` answers /api/v1 from src/portal/mocks
// while the backend returns 501. The dynamic import is dropped from production builds.
async function startMocks() {
  if (import.meta.env.VITE_API_MOCK === 'true') {
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

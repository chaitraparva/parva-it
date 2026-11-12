import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import App from './App'

// The admin portal is loaded only when someone opens /admin, so visitors never download it.
const AdminRoot = lazy(() => import('./admin/AdminRoot'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const Dashboard = lazy(() => import('./admin/Dashboard'))
const Leads = lazy(() => import('./admin/Leads'))
const LeadDetail = lazy(() => import('./admin/LeadDetail'))
const Team = lazy(() => import('./admin/TeamSettings').then((m) => ({ default: m.Team })))
const Settings = lazy(() => import('./admin/TeamSettings').then((m) => ({ default: m.Settings })))
const LoginPage = lazy(() => import('./admin/AuthPages').then((m) => ({ default: m.LoginPage })))
const ForgotPasswordPage = lazy(() => import('./admin/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./admin/AuthPages').then((m) => ({ default: m.ResetPasswordPage })))

const wait = (el: ReactNode) => <Suspense fallback={<div className="adm-loading">Loading…</div>}>{el}</Suspense>

export const router = createBrowserRouter([
  { path: '/', Component: App },
  {
    path: '/admin',
    element: wait(<AdminRoot><Outlet /></AdminRoot>),
    children: [
      { path: 'login', element: wait(<LoginPage />) },
      { path: 'forgot-password', element: wait(<ForgotPasswordPage />) },
      { path: 'reset-password', element: wait(<ResetPasswordPage />) },
      {
        element: wait(<AdminLayout />),
        children: [
          { index: true, element: wait(<Dashboard />) },
          { path: 'leads', element: wait(<Leads />) },
          { path: 'leads/:id', element: wait(<LeadDetail />) },
          { path: 'team', element: wait(<Team />) },
          { path: 'settings', element: wait(<Settings />) },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

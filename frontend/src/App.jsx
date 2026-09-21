import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'

// Project Manager / Core Workspace Components
import ProjectManagerDashboard from './pages/project-manager/ProjectManagerDashboard.jsx'
import MyProjects from './pages/project-manager/MyProjects.jsx'
import ProjectDetails from './pages/project-manager/ProjectDetails.jsx'
import RiskAnalysis from './pages/project-manager/RiskAnalysis.jsx'
import Alerts from './pages/project-manager/Alerts.jsx'
import FieldUpdates from './pages/project-manager/FieldUpdates.jsx'
import Reports from './pages/project-manager/Reports.jsx'
import Recommendations from './pages/project-manager/Recommendations.jsx'
import Profile from './pages/project-manager/Profile.jsx'
import Messages from './pages/project-manager/Messages.jsx'
import Settings from './pages/project-manager/Settings.jsx'

// Admin Panel Components
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AllProjects from './pages/admin/AllProjects.jsx'
import ProjectManagers from './pages/admin/ProjectManagers.jsx'
import AdminDistricts from './pages/admin/AdminDistricts.jsx'
import AdminSystemActivity from './pages/admin/AdminSystemActivity.jsx'
import UserDetailPage from './pages/admin/UserDetailPage.jsx'

// Global Utilities & Auth Shells
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import LoginForm from './components/auth/LoginForm.jsx'
import SignupForm from './components/auth/SignupForm.jsx' // Brought in from incoming branch
import NotFound from './pages/NotFound.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'

function App() {
  return (
    <SidebarProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />

        {/* Root Redirect Hook */}
        <Route path="/dashboard" element={<Navigate to="/project-manager/dashboard" replace />} />

        {/* Project Manager Workspace */}
        <Route
          path="/project-manager/dashboard"
          element={
            <ProtectedRoute>
              <ProjectManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/projects"
          element={
            <ProtectedRoute requiredPermission={['projects', 'read']}>
              <MyProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/projects/:projectId"
          element={
            <ProtectedRoute requiredPermission={['projects', 'read']}>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/risk-analysis"
          element={
            <ProtectedRoute>
              <RiskAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/field-updates"
          element={
            <ProtectedRoute>
              <FieldUpdates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/recommendations"
          element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project-manager/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Admin Console Workspace */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <AllProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/project-managers"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <ProjectManagers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/districts"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <AdminDistricts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system-activity"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <AdminSystemActivity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <ProtectedRoute requiredPermission={['users', 'read']}>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Shared Viewport References */}
        <Route
          path="/admin/projects/:projectId"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/risk-analysis"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <RiskAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/field-updates"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <FieldUpdates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/alerts"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recommendations"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <Recommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requiredPermission={['admin', 'read']}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Global Error Boundaries */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SidebarProvider>
  )
}

export default App

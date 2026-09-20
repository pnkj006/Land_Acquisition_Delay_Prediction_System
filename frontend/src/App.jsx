import { Navigate, Route, Routes } from 'react-router-dom'

import LandingPage from './pages/LandingPage.jsx'
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

import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AllProjects from './pages/admin/AllProjects.jsx'
import ProjectManagers from './pages/admin/ProjectManagers.jsx'
import AdminDistricts from './pages/admin/AdminDistricts.jsx'
import AdminSystemActivity from './pages/admin/AdminSystemActivity.jsx'
import UserDetailPage from './pages/admin/UserDetailPage.jsx'

import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import RoleFallback from './components/auth/RoleFallback.jsx'
import LoginForm from './components/auth/LoginForm.jsx'
import SignupForm from './components/auth/SignupForm.jsx'

import NotFound from './pages/NotFound.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'

const pmPage = (Page) => (
  <ProtectedRoute roles={['project-manager', 'Project Manager']}>
    <Page />
  </ProtectedRoute>
)

const sharedPage = (Page) => (
  <ProtectedRoute
    roles={[
      'admin',
      'Administrator',
      'project-manager',
      'Project Manager',
    ]}
  >
    <Page />
  </ProtectedRoute>
)

const adminPage = (Page) => (
  <ProtectedRoute roles={['admin', 'Administrator']}>
    <Page />
  </ProtectedRoute>
)

function App() {
  return (
    <SidebarProvider>
      <Routes>
        {/* ==================== EXISTING MAIN ROUTES ==================== */}

        <Route
          path="/"
          element={<Navigate to="/project-manager/dashboard" replace />}
        />

        <Route path="/login" element={<LoginForm />} />

        <Route path="/signup" element={<SignupForm />} />

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

        {/* Existing admin user detail route */}
        <Route
          path="/admin/users/:userId"
          element={
            <ProtectedRoute requiredPermission={['users', 'read']}>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ==================== NEW ADMIN ROUTES ==================== */}

        <Route
          path="/admin/dashboard"
          element={adminPage(AdminDashboard)}
        />

        <Route
          path="/admin/projects"
          element={adminPage(AllProjects)}
        />

        <Route
          path="/admin/project-managers"
          element={adminPage(ProjectManagers)}
        />

        <Route
          path="/admin/districts"
          element={adminPage(AdminDistricts)}
        />

        <Route
          path="/admin/system-activity"
          element={adminPage(AdminSystemActivity)}
        />

        {/* ==================== SHARED / PM ROUTES ==================== */}

        <Route
          path="/dashboard"
          element={pmPage(ProjectManagerDashboard)}
        />

        <Route
          path="/risk-analysis"
          element={sharedPage(RiskAnalysis)}
        />

        <Route
          path="/field-updates"
          element={sharedPage(FieldUpdates)}
        />

        <Route
          path="/recommendations"
          element={sharedPage(Recommendations)}
        />

        <Route
          path="/alerts"
          element={sharedPage(Alerts)}
        />

        <Route
          path="/reports"
          element={sharedPage(Reports)}
        />

        <Route
          path="/profile"
          element={sharedPage(Profile)}
        />

        <Route
          path="/messages"
          element={pmPage(Messages)}
        />

        <Route
          path="/settings"
          element={sharedPage(Settings)}
        />

        <Route
          path="/projects"
          element={sharedPage(MyProjects)}
        />

        <Route
          path="/projects/:projectId"
          element={sharedPage(ProjectDetails)}
        />

        {/* ==================== ADMIN ALIASES ==================== */}

        <Route
          path="/admin/projects/:projectId"
          element={adminPage(ProjectDetails)}
        />

        <Route
          path="/admin/risk-analysis"
          element={adminPage(RiskAnalysis)}
        />

        <Route
          path="/admin/field-updates"
          element={adminPage(FieldUpdates)}
        />

        <Route
          path="/admin/alerts"
          element={adminPage(Alerts)}
        />

        <Route
          path="/admin/recommendations"
          element={adminPage(Recommendations)}
        />

        <Route
          path="/admin/reports"
          element={adminPage(Reports)}
        />

        <Route
          path="/admin/profile"
          element={adminPage(Profile)}
        />

        <Route
          path="/admin/settings"
          element={adminPage(Settings)}
        />

        {/* Catch any other /admin URL */}
        <Route
          path="/admin/*"
          element={adminPage(AdminDashboard)}
        />

        {/* ==================== FALLBACK ==================== */}

        <Route path="*" element={<RoleFallback />} />
      </Routes>
    </SidebarProvider>
  )
}

export default App;
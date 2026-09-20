import { Navigate, Route, Routes } from 'react-router-dom'
import ProjectManagerDashboard from './pages/project-manager/ProjectManagerDashboard.jsx'
import MyProjects from './pages/project-manager/MyProjects.jsx'
import ProjectDetails from './pages/project-manager/ProjectDetails.jsx'
import RiskAnalysis from './pages/project-manager/RiskAnalysis.jsx'
import Alerts from './pages/project-manager/Alerts.jsx'
import FieldUpdates from './pages/project-manager/FieldUpdates.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import LoginForm from './components/auth/LoginForm.jsx'
import NotFound from './pages/NotFound.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'
import UserDetailPage from './pages/admin/UserDetailPage.jsx'

function App() {
  return (
    <SidebarProvider>
      <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/" element={<Navigate to="/project-manager/dashboard" replace />} />
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
      {/* Admin routes */}
      <Route
        path="/admin/users/:userId"
        element={
          <ProtectedRoute requiredPermission={['users', 'read']}>
            <UserDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </SidebarProvider>
  )
}

export default App

import { Navigate, Route, Routes } from 'react-router-dom'
import ProjectManagerDashboard from './pages/project-manager/ProjectManagerDashboard.jsx'
import MyProjects from './pages/project-manager/MyProjects.jsx'
import ProjectDetails from './pages/project-manager/ProjectDetails.jsx'
import RiskAnalysis from './pages/project-manager/RiskAnalysis.jsx'
import Alerts from './pages/project-manager/Alerts.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import LoginForm from './components/auth/LoginForm.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'

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
          <ProtectedRoute>
            <MyProjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project-manager/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        }
      />
      {/* Risk Analysis — the route the existing sidebar nav item already
          points to (see NAV_ITEMS in utils/constants.js). No existing routes
          were changed; only this missing page was wired up. */}
      <Route
        path="/project-manager/risk-analysis"
        element={
          <ProtectedRoute>
            <RiskAnalysis />
          </ProtectedRoute>
        }
      />
      {/* Alerts — the route the existing sidebar nav item already points to
          (see NAV_ITEMS in utils/constants.js). No existing routes changed. */}
      <Route
        path="/project-manager/alerts"
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/project-manager/dashboard" replace />} />
      </Routes>
    </SidebarProvider>
  )
}

export default App

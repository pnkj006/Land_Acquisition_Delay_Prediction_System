import { Navigate, Route, Routes } from 'react-router-dom'
import ProjectManagerDashboard from './pages/project-manager/ProjectManagerDashboard.jsx'
import MyProjects from './pages/project-manager/MyProjects.jsx'
import ProjectDetails from './pages/project-manager/ProjectDetails.jsx'
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
      <Route path="*" element={<Navigate to="/project-manager/dashboard" replace />} />
      </Routes>
    </SidebarProvider>
  )
}

export default App

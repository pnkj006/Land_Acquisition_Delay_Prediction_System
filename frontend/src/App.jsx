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
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import LoginForm from './components/auth/LoginForm.jsx'
import SignupForm from './components/auth/SignupForm.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'

const protectedPage = (Page) => <ProtectedRoute><Page /></ProtectedRoute>

export default function App() {
  return (
    <SidebarProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/dashboard" element={protectedPage(ProjectManagerDashboard)} />
        <Route path="/risk-analysis" element={protectedPage(RiskAnalysis)} />
        <Route path="/field-updates" element={protectedPage(FieldUpdates)} />
        <Route path="/recommendations" element={protectedPage(Recommendations)} />
        <Route path="/alerts" element={protectedPage(Alerts)} />
        <Route path="/reports" element={protectedPage(Reports)} />
        <Route path="/profile" element={protectedPage(Profile)} />
        <Route path="/messages" element={protectedPage(Messages)} />
        <Route path="/settings" element={protectedPage(Settings)} />
        <Route path="/projects" element={protectedPage(MyProjects)} />
        <Route path="/projects/:projectId" element={protectedPage(ProjectDetails)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SidebarProvider>
  )
}

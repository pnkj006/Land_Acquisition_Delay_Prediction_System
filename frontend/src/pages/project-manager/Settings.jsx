import { useState } from 'react'
import { ChevronRight, Eye, LogOut, Mail, MenuSquare, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSidebar } from '../../context/SidebarContext.jsx'

function Toggle({ checked, label, description, onChange, rowClassName = 'py-2.5' }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${rowClassName}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-gray-500">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-gray-800">{children}</h3></div>
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { collapsed, toggleCollapsed } = useSidebar()
  const [notifications, setNotifications] = useState({ alerts: true, risk: true, updates: true })
  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <DashboardLayout activeKey="settings" watermarkClassName="opacity-[0.025]">
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title="Settings" subtitle="Manage the options available in this frontend session." />
        <div className="space-y-4 lg:space-y-5">
          <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5">
            <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <SectionTitle icon={Mail}>Account</SectionTitle>
            <div className="mt-3 space-y-2.5 text-sm">
              <div><p className="text-xs text-gray-500">Signed in as</p><p className="mt-0.5 font-medium text-gray-800">{user?.name || '—'}</p><p className="text-xs text-gray-500">{user?.email || '—'}</p></div>
              <button type="button" onClick={() => navigate('/profile')} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark">Manage profile <ChevronRight className="h-4 w-4" /></button>
            </div>
            </section>
            <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <SectionTitle icon={MenuSquare}>Appearance</SectionTitle>
            <Toggle checked={collapsed} onChange={toggleCollapsed} label="Compact sidebar" description="Use the existing collapsed navigation rail. This applies immediately." />
            </section>
          </div>
          <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5" style={{ alignItems: 'start' }}>
          <section className="h-auto min-h-0 self-start rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionTitle icon={Eye}>Notifications</SectionTitle>
            <div className="mt-4 divide-y divide-gray-100">
              <Toggle rowClassName="py-3.5" checked={notifications.alerts} onChange={(value) => setNotifications((current) => ({ ...current, alerts: value }))} label="Alert notifications" description="Set your local preference for alert notices." />
              <Toggle rowClassName="py-3.5" checked={notifications.risk} onChange={(value) => setNotifications((current) => ({ ...current, risk: value }))} label="Risk notifications" description="Set your local preference for risk-related notices." />
              <Toggle rowClassName="py-3.5" checked={notifications.updates} onChange={(value) => setNotifications((current) => ({ ...current, updates: value }))} label="Project update notifications" description="Set your local preference for field and project-update notices." />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-gray-400">Notification delivery preferences are not connected to a backend and reset after a refresh.</p>
          </section>
          <section className="h-auto min-h-0 self-start rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <SectionTitle icon={ShieldCheck}>Security and accessibility</SectionTitle>
            <div className="mt-4 space-y-3">
              <p className="text-sm leading-relaxed text-gray-600">Authentication is currently provided by the existing demo session. Password and access-control management are not available without a backend account service.</p>
              <p className="text-sm leading-relaxed text-gray-600">The interface uses semantic buttons, labels, and keyboard-focusable controls. Use your browser or operating-system accessibility preferences for additional display support.</p>
              <Button variant="outline" size="sm" icon={LogOut} onClick={handleLogout}>Sign out</Button>
            </div>
          </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

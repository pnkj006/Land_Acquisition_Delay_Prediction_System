import { useEffect, useState } from 'react'
import { Calendar, Edit2, Save, Shield, UserRound, X } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import Input from '../../components/common/Input.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { notifications, timeAgo } = useNotifications()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  useEffect(() => setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' }), [user])

  const initials = (user?.name || 'U').split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const handleSave = () => { updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }); setEditing(false) }
  const handleCancel = () => { setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' }); setEditing(false) }

  return (
    <DashboardLayout activeKey="profile">
      <PageHeader title="Profile" subtitle="Manage your account information. Changes apply for this browser session only." actions={editing ? <Button variant="outline" size="sm" icon={X} onClick={handleCancel}>Cancel</Button> : <Button variant="primary" size="sm" icon={Edit2} onClick={() => setEditing(true)}>Edit Profile</Button>} />
      <div className="space-y-5">
        <section className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white ring-2 ring-primary-100">{initials}</div>
          <div className="min-w-0 flex-1"><h3 className="truncate text-lg font-bold text-gray-800">{user?.name || 'User'}</h3><p className="text-sm text-gray-500">{user?.role || 'Project Manager'}</p><p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500"><Shield className="h-3.5 w-3.5" />{user?.district || 'District not available'}, {user?.state || 'State not available'}</p></div>
          <span className="inline-flex w-fit rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">Active account</span>
        </section>
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-800">Account information</h3><p className="mt-0.5 text-xs text-gray-500">Your role, location, and contact details.</p></div>{editing ? <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>Save changes</Button> : null}</div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Full name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} readOnly={!editing} className={!editing ? 'bg-gray-50' : ''} />
            <Input label="Official email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} readOnly={!editing} className={!editing ? 'bg-gray-50' : ''} />
            <Input label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder={editing ? 'Add phone number' : 'Not available'} readOnly={!editing} className={!editing ? 'bg-gray-50' : ''} />
            <Input label="Role" value={user?.role || 'Not available'} readOnly className="bg-gray-50" />
            <Input label="District" value={user?.district || 'Not available'} readOnly className="bg-gray-50" />
            <Input label="Organization" value="Not available" readOnly className="bg-gray-50" />
          </div>
          {editing ? <p className="mt-3 text-xs text-gray-500">This frontend has no profile API; saved edits are retained only until the current session ends.</p> : null}
        </section>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-gray-800">Account details</h3></div><dl className="space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-gray-500">Account ID</dt><dd className="font-medium text-gray-800">{user?.id || '—'}</dd></div><div className="flex justify-between gap-4"><dt className="text-gray-500">Account type</dt><dd className="font-medium text-gray-800">District project manager</dd></div><div className="flex justify-between gap-4"><dt className="text-gray-500">Email</dt><dd className="truncate font-medium text-gray-800">{user?.email || '—'}</dd></div></dl></section>
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-gray-800">Recent activity</h3></div>{notifications.length === 0 ? <EmptyState title="No recent activity" message="Activity will appear here when it is available." /> : <ul className="divide-y divide-gray-100">{notifications.slice(0, 4).map((notification) => <li key={notification.id} className="py-2.5"><p className="text-xs text-gray-700">{notification.message}</p><p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(notification.timestamp)}</p></li>)}</ul>}</section>
        </div>
      </div>
    </DashboardLayout>
  )
}

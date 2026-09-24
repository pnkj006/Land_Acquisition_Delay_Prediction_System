import { useMemo, useState } from 'react'
import { Archive, Bell, Check, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout.jsx'
import PageHeader from '../../components/layout/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import FilterDropdown from '../../components/common/FilterDropdown.jsx'
import SearchBar from '../../components/common/SearchBar.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'
import { useProjects } from '../../hooks/useProjects.js'
import { markAlertRead } from '../../api/alerts.api.js'

const CATEGORIES = [{ value: '', label: 'All messages' }, { value: 'unread', label: 'Unread' }, { value: 'risk', label: 'Risk' }, { value: 'legal', label: 'Legal' }, { value: 'compensation', label: 'Compensation' }, { value: 'approval', label: 'Approval' }, { value: 'update', label: 'Field update' }]
const SENDERS = { risk: 'Risk Monitoring', legal: 'Legal Coordination', compensation: 'Compensation Desk', approval: 'Approval Desk', update: 'Field Operations' }

export default function Messages() {
  const navigate = useNavigate()
  const { notifications, markAllRead, timeAgo } = useNotifications()
  const { projects, loading: projectsLoading } = useProjects({ pageSize: 100 })
  const [filters, setFilters] = useState({ category: '', search: '', view: 'active' })
  const [archivedIds, setArchivedIds] = useState(() => new Set())
  const [selectedId, setSelectedId] = useState(null)
  const messages = useMemo(() => { const projectById = new Map(projects.map((project) => [project.id, project])); return notifications.map((notification) => ({ ...notification, project: projectById.get(notification.projectId) || null, sender: SENDERS[notification.type] || 'System notification', read: notification.isRead })) }, [notifications, projects])
  const filteredMessages = useMemo(() => messages.filter((message) => { const archived = archivedIds.has(message.id); if ((filters.view === 'archived') !== archived) return false; if (filters.category === 'unread' && message.read) return false; if (filters.category && filters.category !== 'unread' && message.type !== filters.category) return false; const query = filters.search.trim().toLowerCase(); return !query || [message.sender, message.message, message.project?.name].some((value) => value?.toLowerCase().includes(query)) }), [messages, archivedIds, filters])
  const selected = filteredMessages.find((message) => message.id === selectedId) || filteredMessages[0] || null
  const unreadCount = filteredMessages.filter((message) => !message.read).length
  
  const selectMessage = (message) => { 
    setSelectedId(message.id); 
    if (!message.read) {
      markAlertRead(message.id).catch(console.error)
      // Optimistic update would ideally happen in context, but for now just let it be or refresh context
    }
  }
  const toggleArchive = (id) => setArchivedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next })
  return (
    <DashboardLayout activeKey="messages">
      <PageHeader title="Messages" subtitle="Project updates, alerts, and coordination notices." actions={<Button variant="outline" size="sm" icon={Check} onClick={markAllRead}>Mark all read</Button>} />
      <div className="mb-4 flex flex-wrap gap-3"><FilterDropdown options={CATEGORIES} value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} className="w-full sm:w-auto" /><SearchBar placeholder="Search messages..." value={filters.search} onChange={(value) => setFilters((current) => ({ ...current, search: value }))} className="w-full sm:w-60" /><FilterDropdown options={[{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]} value={filters.view} onChange={(value) => setFilters((current) => ({ ...current, view: value }))} className="w-full sm:w-auto" /></div>
      <section className="min-h-[520px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]"><div className="border-b border-gray-100 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{unreadCount} unread</p><span className="text-xs text-gray-400">{filteredMessages.length} total</span></div><div className="max-h-[360px] overflow-y-auto lg:max-h-[520px]">{projectsLoading ? <p className="p-4 text-xs text-gray-500">Loading messages…</p> : filteredMessages.length === 0 ? <p className="p-4 text-xs text-gray-500">No messages match this view.</p> : filteredMessages.map((message) => <button key={message.id} type="button" onClick={() => selectMessage(message)} className={`flex w-full gap-3 border-t border-gray-50 px-4 py-3 text-left transition-colors ${selected?.id === message.id ? 'bg-primary-50' : 'hover:bg-gray-50'}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${message.read ? 'bg-transparent' : 'bg-accent'}`} /><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><span className={`truncate text-xs ${message.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>{message.sender}</span><span className="shrink-0 text-[10px] text-gray-400">{timeAgo(message.timestamp)}</span></span><span className="mt-0.5 block truncate text-xs text-gray-500">{message.message}</span></span></button>)}</div></div>
        <div className="p-5">{!selected ? <EmptyState title="No message selected" message="Choose a message to view its details." /> : <><div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4"><div><p className="text-sm font-semibold text-gray-800">{selected.sender}</p><p className="mt-1 text-xs text-gray-400">{new Date(selected.timestamp).toLocaleString()}</p></div><div className="flex gap-2">{!selected.read && <Button variant="outline" size="sm" icon={Bell} onClick={() => selectMessage(selected)}>Mark read</Button>}<Button variant="outline" size="sm" icon={Archive} onClick={() => toggleArchive(selected.id)}>{archivedIds.has(selected.id) ? 'Restore' : 'Archive'}</Button></div></div><p className="py-5 text-sm leading-6 text-gray-700">{selected.message}</p>{selected.project ? <div className="rounded-lg border border-gray-100 bg-gray-50 p-4"><p className="text-xs font-semibold text-gray-700">Related project</p><p className="mt-1 text-sm font-medium text-gray-800">{selected.project.name}</p><p className="mt-1 text-xs text-gray-500">{selected.project.id} · {selected.project.district}</p><Button variant="ghost" size="sm" icon={ExternalLink} onClick={() => navigate(`/projects/${selected.project.id}`)} className="mt-2">View project</Button></div> : null}</>}</div>
      </section>
    </DashboardLayout>
  )
}

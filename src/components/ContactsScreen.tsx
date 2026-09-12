import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Building2,
  Clock,
  Star,
  Upload,
  Download,
  Plus,
  MoreHorizontal,
  MoreVertical,
  Search,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Pencil,
  Trash2,
  Check,
  X,
  CalendarDays,
  LayoutGrid,
  List,
  CheckSquare,
  FileText,
  ArrowRight,
  StickyNote,
  ChevronLeft,
} from 'lucide-react'

/* --------------------------------- model ---------------------------------- */

type CType = 'client' | 'lead' | 'team' | 'vendor' | 'others'
type CStatus = 'active' | 'progress' | 'inactive'

type Contact = {
  id: number
  name: string
  email: string
  phone: string
  company: string
  location: string
  type: CType
  status: CStatus
  tags: string[]
  lastContacted: number
  followUp: { date: string; time?: string; note?: string } | null
  starred: boolean
  about: string
  notes: { id: number; text: string; ts: number }[]
  tasks: { id: number; text: string; done: boolean; due?: string }[]
  activities: { id: number; kind: 'meeting' | 'call' | 'email' | 'proposal' | 'note'; text: string; ts: number }[]
}

const TYPES: { key: CType; label: string; bg: string; fg: string }[] = [
  { key: 'client', label: 'Client', bg: '#EFECFE', fg: '#6D4AFF' },
  { key: 'lead', label: 'Lead', bg: '#E7F0FF', fg: '#2F6DF6' },
  { key: 'team', label: 'Team', bg: '#E0E7FF', fg: '#4F46E5' },
  { key: 'vendor', label: 'Vendor', bg: '#FFF3E0', fg: '#D97706' },
  { key: 'others', label: 'Others', bg: '#F3F4F6', fg: '#6B7280' },
]

const STATUSES: { key: CStatus; label: string; bg: string; fg: string }[] = [
  { key: 'active', label: 'Active', bg: '#E4F6EC', fg: '#10B981' },
  { key: 'progress', label: 'In Progress', bg: '#E7F0FF', fg: '#2F6DF6' },
  { key: 'inactive', label: 'Inactive', bg: '#FDE8EC', fg: '#E11D48' },
]

const ACTIVITY_COLORS: Record<string, string> = {
  meeting: '#7C5BFF',
  call: '#10B981',
  email: '#2F6DF6',
  proposal: '#2F6DF6',
  note: '#9CA3AF',
}

const typeOf = (k: CType) => TYPES.find((t) => t.key === k) ?? TYPES[0]
const statusOf = (k: CStatus) => STATUSES.find((s) => s.key === k) ?? STATUSES[0]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function iso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtDay(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* --------------------------------- seeds ---------------------------------- */

let idSeq = 5000
const now = Date.now()
const D = 86400000

function mkNote(text: string, daysAgo: number) {
  return { id: idSeq++, text, ts: now - daysAgo * D }
}
function mkAct(kind: 'meeting' | 'call' | 'email' | 'proposal' | 'note', text: string, daysAgo: number) {
  return { id: idSeq++, kind, text, ts: now - daysAgo * D }
}

const seedContacts = (): Contact[] => [
  {
    id: idSeq++, name: 'Arjun S', email: 'arjun@techtech.in', phone: '+91 98765 43210', company: 'TechTech Solutions', location: 'Chennai, India',
    type: 'client', status: 'active', tags: ['Web Development'], lastContacted: now - 2 * D,
    followUp: { date: iso(new Date(now + 6 * D)), time: '10:00 AM', note: 'Discuss project proposal and timeline.' },
    starred: true, about: 'Key client for web and app development projects. Exploring long-term collaboration for upcoming AI tools.',
    notes: [mkNote('Prefers email over calls. Decision maker for TechTech budget.', 3)],
    tasks: [
      { id: idSeq++, text: 'Send revised proposal draft', done: false, due: iso(new Date(now + 3 * D)) },
      { id: idSeq++, text: 'Prepare pricing breakdown', done: true },
    ],
    activities: [
      mkAct('meeting', 'Meeting - Project Update', 2),
      mkAct('proposal', 'Sent Proposal', 4),
      mkAct('call', 'Call - Requirement Discussion', 7),
      mkAct('note', 'Added Note', 10),
    ],
  },
  {
    id: idSeq++, name: 'Priya Kumar', email: 'priya@edulearn.com', phone: '+91 91234 56780', company: 'EduLearn', location: 'Bengaluru, India',
    type: 'lead', status: 'progress', tags: ['EdTech'], lastContacted: now - 3 * D,
    followUp: { date: iso(new Date(now + 3 * D)), time: '2:00 PM', note: 'Demo of the study planner module.' },
    starred: false, about: 'Interested in the AI study planner for their learning platform.',
    notes: [], tasks: [], activities: [mkAct('call', 'Call - Initial Discovery', 3), mkAct('email', 'Emailed product deck', 6)],
  },
  {
    id: idSeq++, name: 'Rahul Khan', email: 'rahul@greenfuture.org', phone: '+91 99887 76655', company: 'GreenFuture', location: 'Pune, India',
    type: 'client', status: 'active', tags: ['Sustainability'], lastContacted: now - 4 * D,
    followUp: { date: iso(new Date(now + 8 * D)), time: '11:30 AM', note: 'Quarterly review.' },
    starred: true, about: 'Long-term client. Runs sustainability reports through our platform.',
    notes: [], tasks: [], activities: [mkAct('meeting', 'Meeting - Quarterly Review', 4)],
  },
  {
    id: idSeq++, name: 'Sneha S', email: 'sneha@designhub.in', phone: '+91 90909 80807', company: 'DesignHub', location: 'Chennai, India',
    type: 'vendor', status: 'active', tags: ['Design'], lastContacted: now - 5 * D,
    followUp: null, starred: false, about: 'Design partner for brand and UI assets.',
    notes: [], tasks: [], activities: [mkAct('email', 'Shared brand assets link', 5)],
  },
  {
    id: idSeq++, name: 'Vignesh T', email: 'vignesh@buildit.co', phone: '+91 90000 11223', company: 'BuildIt', location: 'Hyderabad, India',
    type: 'client', status: 'inactive', tags: ['Construction'], lastContacted: now - 7 * D,
    followUp: null, starred: false, about: 'Project paused due to budget cycle. Revisit in Q4.',
    notes: [], tasks: [], activities: [mkAct('note', 'Marked as inactive', 7)],
  },
  {
    id: idSeq++, name: 'Nandini M', email: 'nandini@creovent.com', phone: '+91 93332 22110', company: 'CreoVent', location: 'Mumbai, India',
    type: 'lead', status: 'progress', tags: ['Startup'], lastContacted: now - 8 * D,
    followUp: { date: iso(new Date(now + 2 * D)), time: '4:30 PM', note: 'Follow up on pilot feedback.' },
    starred: false, about: 'Startup founder evaluating the platform for internal productivity.',
    notes: [], tasks: [], activities: [mkAct('call', 'Call - Pilot Feedback', 8)],
  },
  {
    id: idSeq++, name: 'Farooq A', email: 'farooq@innovatech.in', phone: '+91 98111 22334', company: 'InnovaTech', location: 'Delhi, India',
    type: 'client', status: 'active', tags: ['Web Development', 'Mobile App'], lastContacted: now - 11 * D,
    followUp: { date: iso(new Date(now + 5 * D)), time: '3:00 PM', note: 'Sprint review and next phase scoping.' },
    starred: true, about: 'Client for ongoing web and mobile development sprints.',
    notes: [], tasks: [], activities: [mkAct('meeting', 'Meeting - Sprint Planning', 11)],
  },
  {
    id: idSeq++, name: 'Deepak P', email: 'deepak@logisprime.com', phone: '+91 98700 12345', company: 'LogisPrime', location: 'Coimbatore, India',
    type: 'others', status: 'active', tags: ['Logistics'], lastContacted: now - 13 * D,
    followUp: null, starred: false, about: 'Logistics partner contact for deliveries and invoices.',
    notes: [], tasks: [], activities: [mkAct('email', 'Emailed invoice copy', 13)],
  },
]

/* -------------------------------- storage --------------------------------- */

const STORAGE_KEY = 'zikzik-contacts-v1'

function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* corrupted → reseed */
  }
  const seeded = seedContacts()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  } catch {
    /* unavailable */
  }
  return seeded
}

/* ------------------------------- pills/bits ------------------------------- */

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: bg, color: fg }}>
      {children}
    </span>
  )
}

/* ------------------------------ contact modal ----------------------------- */

type Draft = {
  id?: number
  name: string
  email: string
  phone: string
  company: string
  location: string
  type: CType
  status: CStatus
  tags: string
  about: string
  fuDate: string
  fuTime: string
  fuNote: string
}

const emptyDraft = (): Draft => ({
  name: '', email: '', phone: '', company: '', location: '',
  type: 'client', status: 'active', tags: '', about: '',
  fuDate: '', fuTime: '', fuNote: '',
})

function ContactModal({
  draft,
  setDraft,
  onClose,
  onSave,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  onClose: () => void
  onSave: () => void
}) {
  const set = (p: Partial<Draft>) => setDraft({ ...draft, ...p })
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16182B]/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_24px_60px_rgba(30,25,80,0.25)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-bold tracking-tight text-[#111827]">
            {draft.id ? 'Edit Contact' : 'Add Contact'}
          </h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F2F9]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Name</label>
            <input autoFocus value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Arjun S"
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Email</label>
            <input value={draft.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@company.com"
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Phone</label>
            <input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 …"
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Company</label>
            <input value={draft.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. TechTech Solutions"
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]" />
          </div>
        </div>

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Location</label>
        <input value={draft.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Chennai, India"
          className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]" />

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Type</label>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button key={t.key} onClick={() => set({ type: t.key })}
              className={`rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                draft.type === t.key ? 'border-transparent text-white' : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
              }`}
              style={draft.type === t.key ? { background: t.fg } : undefined}>
              {t.label}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Status</label>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button key={s.key} onClick={() => set({ status: s.key })}
              className={`rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                draft.status === s.key ? 'border-transparent text-white' : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
              }`}
              style={draft.status === s.key ? { background: s.fg } : undefined}>
              {s.label}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Tags (comma separated)</label>
        <input value={draft.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="e.g. Web Development, Priority"
          className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]" />

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Next follow-up (optional)</label>
            <input type="date" value={draft.fuDate} onChange={(e) => set({ fuDate: e.target.value })}
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Time</label>
            <input type="time" value={draft.fuTime} onChange={(e) => set({ fuTime: e.target.value })}
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]" />
          </div>
        </div>

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">About</label>
        <textarea value={draft.about} onChange={(e) => set({ about: e.target.value })} rows={3}
          placeholder="Short context about this contact…"
          className="mb-4 w-full resize-none rounded-[10px] border border-[#E7E5F2] bg-white p-3 text-[13px] leading-relaxed text-[#111827] outline-none focus:border-[#B9A7FF]" />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[10px] border border-[#E7E5F2] px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F6F5FB]">
            Cancel
          </button>
          <button onClick={onSave}
            className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]">
            {draft.id ? 'Save changes' : 'Create contact'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------ small modals ------------------------------ */

function SmallModal({
  title,
  onClose,
  onSave,
  children,
}: {
  title: string
  onClose: () => void
  onSave: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16182B]/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_24px_60px_rgba(30,25,80,0.25)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold tracking-tight text-[#111827]">{title}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F2F9]">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[10px] border border-[#E7E5F2] px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F6F5FB]">
            Cancel
          </button>
          <button onClick={onSave}
            className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]">
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ================================ the page ================================ */

export default function ContactsScreen({ onNavigate }: { onNavigate: (nav: string) => void }) {
  const initial = useRef(loadContacts())
  const [contacts, setContacts] = useState<Contact[]>(initial.current)
  const [selectedId, setSelectedId] = useState<number | null>(initial.current[0]?.id ?? null)
  const [typeTab, setTypeTab] = useState<'all' | CType>('all')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'any' | CStatus>('any')
  const [companyFilter, setCompanyFilter] = useState<'any' | string>('any')
  const [tagFilter, setTagFilter] = useState<'any' | string>('any')
  const [dropFilter, setDropFilter] = useState<'status' | 'company' | 'tags' | null>(null)
  const [sortBy, setSortBy] = useState<'contacted' | 'name' | 'followup'>('contacted')
  const [sortOpen, setSortOpen] = useState(false)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [headerMenu, setHeaderMenu] = useState(false)
  const [rowMenu, setRowMenu] = useState<number | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [modal, setModal] = useState<{ draft: Draft } | null>(null)
  const [small, setSmall] = useState<{ kind: 'note' | 'task'; text: string; due: string } | null>(null)
  const [logMenu, setLogMenu] = useState(false)
  const [rightTab, setRightTab] = useState<'overview' | 'activity' | 'tasks' | 'notes' | 'files'>('overview')
  const [mobileDetail, setMobileDetail] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const csvInput = useRef<HTMLInputElement>(null)

  const today = new Date()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
    } catch {
      /* unavailable */
    }
  }, [contacts])

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  function patchContact(id: number, patch: Partial<Contact>) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  /* ------------------------------- derived ------------------------------- */

  const weekAhead = iso(new Date(Date.now() + 7 * D))

  const stats = useMemo(() => {
    const total = contacts.length
    const clients = contacts.filter((c) => c.type === 'client').length
    const due = contacts.filter((c) => c.followUp && c.followUp.date <= weekAhead).length
    const starred = contacts.filter((c) => c.starred).length
    return { total, clients, due, starred }
  }, [contacts, weekAhead])

  const companies = useMemo(() => Array.from(new Set(contacts.map((c) => c.company).filter(Boolean))), [contacts])
  const allTags = useMemo(() => Array.from(new Set(contacts.flatMap((c) => c.tags))), [contacts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contacts
      .filter((c) => (typeTab === 'all' ? true : c.type === typeTab))
      .filter((c) => (statusFilter === 'any' ? true : c.status === statusFilter))
      .filter((c) => (companyFilter === 'any' ? true : c.company === companyFilter))
      .filter((c) => (tagFilter === 'any' ? true : c.tags.includes(tagFilter)))
      .filter((c) =>
        q
          ? c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'followup') {
          const av = a.followUp?.date ?? '9999'
          const bv = b.followUp?.date ?? '9999'
          return av < bv ? -1 : 1
        }
        return b.lastContacted - a.lastContacted
      })
  }, [contacts, typeTab, statusFilter, companyFilter, tagFilter, query, sortBy])

  const active = contacts.find((c) => c.id === selectedId) ?? null

  /* -------------------------------- crud --------------------------------- */

  function saveDraft() {
    if (!modal) return
    const d = modal.draft
    if (!d.name.trim()) return
    const tags = d.tags.split(',').map((t) => t.trim()).filter(Boolean)
    const followUp = d.fuDate ? { date: d.fuDate, time: d.fuTime || undefined, note: d.fuNote || undefined } : null
    if (d.id) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === d.id
            ? { ...c, name: d.name.trim(), email: d.email.trim(), phone: d.phone.trim(), company: d.company.trim(), location: d.location.trim(), type: d.type, status: d.status, tags, about: d.about, followUp, lastContacted: Date.now() }
            : c,
        ),
      )
      showToast('Contact updated')
    } else {
      const c: Contact = {
        id: idSeq++, name: d.name.trim(), email: d.email.trim(), phone: d.phone.trim(), company: d.company.trim(),
        location: d.location.trim(), type: d.type, status: d.status, tags, lastContacted: Date.now(), followUp,
        starred: false, about: d.about, notes: [], tasks: [],
        activities: [{ id: idSeq++, kind: 'note', text: 'Contact created', ts: Date.now() }],
      }
      setContacts((prev) => [c, ...prev])
      setSelectedId(c.id)
      showToast('Contact created')
    }
    setModal(null)
  }

  function openEdit(c: Contact) {
    setModal({
      draft: {
        id: c.id, name: c.name, email: c.email, phone: c.phone, company: c.company, location: c.location,
        type: c.type, status: c.status, tags: c.tags.join(', '), about: c.about,
        fuDate: c.followUp?.date ?? '', fuTime: c.followUp?.time ?? '', fuNote: c.followUp?.note ?? '',
      },
    })
  }

  function deleteContact(id: number) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(null)
    setSelected((prev) => prev.filter((x) => x !== id))
    setRowMenu(null)
    showToast('Contact deleted')
  }

  function importCsv(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      const added: Contact[] = []
      lines.forEach((line, i) => {
        const cols = line.split(',').map((s) => s.trim())
        if (i === 0 && cols[0]?.toLowerCase().includes('name')) return
        const [name, email, company, type] = cols
        if (!name) return
        const t = (['client', 'lead', 'team', 'vendor'] as const).find((k) => k === (type || '').toLowerCase()) ?? 'others'
        added.push({
          id: idSeq++, name, email: email || '', phone: '', company: company || '', location: '',
          type: t, status: 'active', tags: ['Imported'], lastContacted: Date.now(), followUp: null,
          starred: false, about: '', notes: [], tasks: [],
          activities: [{ id: idSeq++, kind: 'note', text: 'Imported from CSV', ts: Date.now() }],
        })
      })
      if (added.length === 0) {
        showToast('No valid rows found (Name, Email, Company, Type)')
        return
      }
      setContacts((prev) => [...added, ...prev])
      showToast(`Imported ${added.length} contact${added.length === 1 ? '' : 's'}`)
    }
    reader.readAsText(file)
  }

  function exportCsv() {
    const rows = [
      ['Name', 'Email', 'Phone', 'Company', 'Type', 'Status', 'Tags', 'Next Follow-up'],
      ...contacts.map((c) => [
        c.name, c.email, c.phone, c.company, c.type, c.status, c.tags.join('; '), c.followUp?.date ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'zikzik-contacts.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Exported contacts.csv')
  }

  /* ------------------------------ detail ops ----------------------------- */

  function addNote() {
    if (!active || !small || !small.text.trim()) return
    patchContact(active.id, { notes: [...active.notes, { id: idSeq++, text: small.text.trim(), ts: Date.now() }] })
    patchContact(active.id, {
      activities: [{ id: idSeq++, kind: 'note', text: 'Added Note', ts: Date.now() }, ...active.activities],
    })
    setSmall(null)
    showToast('Note added')
  }

  function addTask() {
    if (!active || !small || !small.text.trim()) return
    patchContact(active.id, {
      tasks: [...active.tasks, { id: idSeq++, text: small.text.trim(), done: false, due: small.due || undefined }],
    })
    setSmall(null)
    setRightTab('tasks')
    showToast('Task added — view it in the Tasks tab')
  }

  function logActivity(kind: 'meeting' | 'call' | 'email' | 'proposal') {
    if (!active) return
    const labels = { meeting: 'Meeting logged', call: 'Call logged', email: 'Email logged', proposal: 'Proposal sent' }
    patchContact(active.id, {
      activities: [{ id: idSeq++, kind, text: labels[kind], ts: Date.now() }, ...active.activities],
      lastContacted: Date.now(),
    })
    setLogMenu(false)
    setRightTab('activity')
    showToast('Activity logged')
  }

  function toggleTask(contactId: number, taskId: number) {
    const c = contacts.find((x) => x.id === contactId)
    if (!c) return
    patchContact(contactId, { tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) })
  }

  function deleteTask(contactId: number, taskId: number) {
    const c = contacts.find((x) => x.id === contactId)
    if (!c) return
    patchContact(contactId, { tasks: c.tasks.filter((t) => t.id !== taskId) })
  }

  function deleteNote(contactId: number, noteId: number) {
    const c = contacts.find((x) => x.id === contactId)
    if (!c) return
    patchContact(contactId, { notes: c.notes.filter((n) => n.id !== noteId) })
  }

  const activeFilters =
    (statusFilter !== 'any' ? 1 : 0) + (companyFilter !== 'any' ? 1 : 0) + (tagFilter !== 'any' ? 1 : 0)

  /* ------------------------------- detail -------------------------------- */

  function DetailBody({ c }: { c: Contact }) {
    const t = typeOf(c.type)
    const s = statusOf(c.status)
    const dueSoon = c.followUp && c.followUp.date <= weekAhead

    return (
      <div className="flex flex-col">
        {/* header */}
        <div className="flex items-start gap-3.5 px-4 pb-3 pt-4">
          {mobileDetail && (
            <button
              onClick={() => setMobileDetail(false)}
              className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F2F9] xl:hidden"
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#E9E6FB] text-[15px] font-bold text-[#4B3BD8]">
            {initials(c.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[18px] font-bold tracking-tight text-[#111827]">{c.name}</h3>
              <button
                onClick={() => patchContact(c.id, { starred: !c.starred })}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#FFF8E6] ${
                  c.starred ? 'text-[#F5B50A]' : 'text-[#C4C4D4] hover:text-[#F5B50A]'
                }`}
                title={c.starred ? 'Remove star' : 'Add star'}
              >
                <Star className="h-4 w-4" fill={c.starred ? 'currentColor' : 'none'} strokeWidth={1.8} />
              </button>
            </div>
            <p className="mt-0.5 truncate text-[12.5px] text-[#9CA3AF]">
              {typeOf(c.type).label} {c.company ? `• ${c.company}` : ''}
            </p>
          </div>
          <span className="relative">
            <button
              onClick={() => setRowMenu(rowMenu === c.id ? null : c.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
              aria-label="Contact options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {rowMenu === c.id && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setRowMenu(null)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.13 }}
                    className="absolute right-0 top-full z-40 mt-1 w-36 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                  >
                    <button
                      onClick={() => {
                        openEdit(c)
                        setRowMenu(null)
                      }}
                      className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#6B7280]" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        deleteContact(c.id)
                        setMobileDetail(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </span>
        </div>

        {/* tabs */}
        <div className="flex gap-4 border-b border-[#ECECF4] px-4">
          {(['overview', 'activity', 'tasks', 'notes', 'files'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setRightTab(k)}
              className={`relative pb-2.5 text-[12.5px] font-semibold capitalize transition-colors ${
                rightTab === k ? 'text-[#5B4DFF]' : 'text-[#9CA3AF] hover:text-[#374151]'
              }`}
            >
              {k}
              {rightTab === k && (
                <motion.span layoutId="contact-tab" className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[#5B4DFF]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 px-4 py-3">
          {rightTab === 'overview' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: Mail, value: c.email },
                  { icon: Phone, value: c.phone },
                  { icon: Briefcase, value: c.company },
                  { icon: MapPin, value: c.location },
                ]
                  .filter((r) => r.value)
                  .map((r) => (
                    <div key={r.value} className="flex items-center gap-2.5">
                      <r.icon className="h-4 w-4 shrink-0 text-[#6B7280]" strokeWidth={1.9} />
                      <span className="truncate text-[13px] font-medium text-[#1F2937]">{r.value}</span>
                    </div>
                  ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Pill bg={t.bg} fg={t.fg}>{t.label}</Pill>
                {c.tags.map((tag) => (
                  <Pill key={tag} bg="#E7F0FF" fg="#2F6DF6">{tag}</Pill>
                ))}
              </div>

              <div className="rounded-[14px] border border-[#ECECF4] bg-[#FBFAFE] p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#111827]">About</span>
                  <button
                    onClick={() => openEdit(c)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[#8B8A9A] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
                    title="Edit contact"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[12.5px] leading-relaxed text-[#6B7280]">{c.about || 'No description yet.'}</p>
              </div>

              {/* follow-up */}
              <div className="rounded-[14px] border border-[#ECECF4] bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-[#111827]">
                    <CalendarDays className="h-4 w-4 text-[#5B4DFF]" strokeWidth={2} />
                    Upcoming Follow-up
                  </span>
                  <button
                    onClick={() => onNavigate('Calendar')}
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
                  >
                    View in Calendar <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
                  </button>
                </div>
                {c.followUp ? (
                  <div className="mt-2.5 flex items-start gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${dueSoon ? 'bg-[#EEEDFC]' : 'bg-[#F3F2F9]'}`}>
                      <CalendarDays className={`h-5 w-5 ${dueSoon ? 'text-[#5B4DFF]' : 'text-[#8B8A9A]'}`} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-bold text-[#111827]">{fmtDate(c.followUp.date)}</div>
                      {c.followUp.time && <div className="text-[12px] font-medium text-[#6B7280]">{c.followUp.time}</div>}
                      {c.followUp.note && <div className="mt-0.5 text-[11.5px] text-[#9CA3AF]">{c.followUp.note}</div>}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-[12px] text-[#9CA3AF]">No follow-up scheduled — set one when editing this contact.</p>
                )}
              </div>

              {/* recent activity preview */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#111827]">Recent Activity</span>
                  <button
                    onClick={() => setRightTab('activity')}
                    className="text-[11.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
                  >
                    View all
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {c.activities.slice(0, 4).map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ACTIVITY_COLORS[a.kind] }} />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[#1F2937]">{a.text}</span>
                      <span className="shrink-0 text-[11px] text-[#9CA3AF]">{fmtDay(a.ts)}</span>
                    </div>
                  ))}
                  {c.activities.length === 0 && <p className="text-[12px] text-[#9CA3AF]">No activity yet.</p>}
                </div>
              </div>

              {/* quick actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSmall({ kind: 'task', text: '', due: iso(today) })}
                  className="flex items-center justify-center gap-1.5 rounded-[10px] bg-[#EEEDFC] py-2.5 text-[11.5px] font-bold text-[#5B4DFF] transition-colors hover:bg-[#E2DCFC]"
                >
                  <CheckSquare className="h-4 w-4" strokeWidth={2.2} /> Add Task
                </button>
                <button
                  onClick={() => setSmall({ kind: 'note', text: '', due: '' })}
                  className="flex items-center justify-center gap-1.5 rounded-[10px] bg-[#EEEDFC] py-2.5 text-[11.5px] font-bold text-[#5B4DFF] transition-colors hover:bg-[#E2DCFC]"
                >
                  <FileText className="h-4 w-4" strokeWidth={2.2} /> Add Note
                </button>
                <div className="relative">
                  <button
                    onClick={() => setLogMenu((o) => !o)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#EEEDFC] py-2.5 text-[11.5px] font-bold text-[#5B4DFF] transition-colors hover:bg-[#E2DCFC]"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.4} /> Log Activity
                  </button>
                  <AnimatePresence>
                    {logMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setLogMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.13 }}
                          className="absolute bottom-full right-0 z-40 mb-1.5 w-40 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                        >
                          {(
                            [
                              { key: 'meeting', label: 'Meeting' },
                              { key: 'call', label: 'Call' },
                              { key: 'email', label: 'Email' },
                              { key: 'proposal', label: 'Sent Proposal' },
                            ] as const
                          ).map((o) => (
                            <button
                              key={o.key}
                              onClick={() => logActivity(o.key)}
                              className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                            >
                              <span className="h-2 w-2 rounded-full" style={{ background: ACTIVITY_COLORS[o.key] }} />
                              {o.label}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {rightTab === 'activity' && (
            <div className="flex flex-col gap-3">
              {c.activities.length === 0 && <p className="py-6 text-center text-[12.5px] text-[#9CA3AF]">No activity logged yet.</p>}
              {c.activities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-[12px] border border-[#ECECF4] bg-white px-3 py-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ACTIVITY_COLORS[a.kind] }} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#111827]">{a.text}</span>
                  <span className="shrink-0 text-[11px] text-[#9CA3AF]">{fmtDay(a.ts)}</span>
                </div>
              ))}
            </div>
          )}

          {rightTab === 'tasks' && (
            <div className="flex flex-col gap-2">
              {c.tasks.length === 0 && <p className="py-6 text-center text-[12.5px] text-[#9CA3AF]">No tasks for this contact.</p>}
              {c.tasks.map((t) => (
                <div key={t.id} className="group flex items-center gap-2.5 rounded-[12px] border border-[#ECECF4] bg-white px-3 py-2.5">
                  <button
                    onClick={() => toggleTask(c.id, t.id)}
                    className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border transition-all ${
                      t.done ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]' : 'border-[#D5CFEE] bg-white hover:border-[#7C5BFF]'
                    }`}
                    aria-label="Toggle task"
                  >
                    {t.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.4} />}
                  </button>
                  <span className={`min-w-0 flex-1 text-[13px] font-medium ${t.done ? 'text-[#9CA3AF] line-through' : 'text-[#111827]'}`}>
                    {t.text}
                  </span>
                  {t.due && <span className="shrink-0 text-[11px] font-medium text-[#9CA3AF]">{fmtDate(t.due)}</span>}
                  <button
                    onClick={() => deleteTask(c.id, t.id)}
                    className="shrink-0 text-[#C4C4D4] opacity-0 transition-colors hover:text-[#DC2626] group-hover:opacity-100"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSmall({ kind: 'task', text: '', due: iso(today) })}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-[#D9D6EA] py-2.5 text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:border-[#B9A7FF] hover:bg-[#F6F3FF]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} /> Add Task
              </button>
            </div>
          )}

          {rightTab === 'notes' && (
            <div className="flex flex-col gap-2">
              {c.notes.length === 0 && <p className="py-6 text-center text-[12.5px] text-[#9CA3AF]">No notes yet.</p>}
              {c.notes.map((n) => (
                <div key={n.id} className="group rounded-[12px] border border-[#ECECF4] bg-[#FBFAFE] px-3 py-2.5">
                  <p className="text-[12.5px] leading-relaxed text-[#1F2937]">{n.text}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10.5px] text-[#9CA3AF]">{fmtDay(n.ts)}</span>
                    <button
                      onClick={() => deleteNote(c.id, n.id)}
                      className="text-[#C4C4D4] opacity-0 transition-colors hover:text-[#DC2626] group-hover:opacity-100"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setSmall({ kind: 'note', text: '', due: '' })}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-[#D9D6EA] py-2.5 text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:border-[#B9A7FF] hover:bg-[#F6F3FF]"
              >
                <StickyNote className="h-4 w-4" strokeWidth={2.2} /> Add Note
              </button>
            </div>
          )}

          {rightTab === 'files' && (
            <div className="flex flex-col items-center py-10 text-center">
              <FileText className="h-7 w-7 text-[#C4C4D4]" strokeWidth={1.6} />
              <p className="mt-2 text-[12.5px] font-medium text-[#9CA3AF]">No files attached to this contact yet.</p>
              <button
                onClick={() => onNavigate('Documents')}
                className="mt-3 rounded-full bg-[#EEEDFC] px-4 py-1.5 text-[12px] font-semibold text-[#5B4DFF] transition-colors hover:bg-[#E2DCFC]"
              >
                Open Documents
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* -------------------------------- render ------------------------------- */

  const tabs: { key: 'all' | CType; label: string }[] = [
    { key: 'all', label: 'All' },
    ...TYPES.map((t) => ({ key: t.key, label: t.label })),
  ]

  const detailBody = active ? <DetailBody c={active} /> : null

  return (
    <div className="flex h-full min-h-0">
      {/* ============================== main column ============================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="shrink-0 px-6 pt-5 xl:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">Contacts</h1>
              <p className="mt-0.5 text-[13.5px] text-[#6B7280]">
                Manage your clients, track interactions, and build stronger relationships.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => csvInput.current?.click()}
                className="flex h-10 items-center gap-2 rounded-[10px] border border-[#ECECF4] bg-white px-4 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F6F5FB]"
              >
                <Upload className="h-4 w-4" strokeWidth={2} />
                Import
              </button>
              <div className="relative">
                <div className="flex overflow-hidden rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] shadow-[0_4px_12px_rgba(106,79,255,0.3)]">
                  <button
                    onClick={() => setModal({ draft: emptyDraft() })}
                    className="flex items-center gap-1.5 py-2.5 pl-4 pr-2.5 text-[13px] font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.4} />
                    Add Contact
                  </button>
                  <button
                    onClick={() => setHeaderMenu((o) => !o)}
                    className="flex items-center border-l border-white/25 px-2 text-white"
                    aria-label="More contact options"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${headerMenu ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {headerMenu && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setHeaderMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 top-full z-40 mt-1.5 w-48 rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                      >
                        <button
                          onClick={() => {
                            exportCsv()
                            setHeaderMenu(false)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                        >
                          <Download className="h-4 w-4 text-[#6B7280]" strokeWidth={2} /> Export CSV
                        </button>
                        <button
                          onClick={() => {
                            if (selected.length === 0) {
                              showToast('Select contacts first')
                            } else {
                              selected.forEach((id) => deleteContact(id))
                              showToast(`${selected.length} contact${selected.length === 1 ? '' : 's'} deleted`)
                            }
                            setHeaderMenu(false)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#DC2626] transition-colors hover:bg-[#FEF2F2]"
                        >
                          <Trash2 className="h-4 w-4" /> Delete selected
                        </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
          </div>

          {/* type tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeTab(t.key)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                  typeTab === t.key
                    ? 'bg-[#16182B] text-white shadow-[0_3px_10px_rgba(22,24,43,0.25)]'
                    : 'border border-[#ECECF4] bg-white text-[#374151] hover:bg-[#F6F5FB]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Total Contacts', value: stats.total, icon: Users, bg: '#EEEDFC', fg: '#5B4DFF' },
              { label: 'Clients', value: stats.clients, icon: Building2, bg: '#E7F0FF', fg: '#2F6DF6' },
              { label: 'Follow-ups Due', value: stats.due, icon: Clock, bg: '#EEEDFC', fg: '#5B4DFF' },
              { label: 'Starred', value: stats.starred, icon: Star, bg: '#FFF8E6', fg: '#F5B50A' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px]" style={{ background: s.bg }}>
                  <s.icon className="h-5 w-5" style={{ color: s.fg }} strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[20px] font-bold leading-tight text-[#111827]">{s.value}</div>
                  <div className="text-[12px] font-medium text-[#9CA3AF]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* toolbar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-[10px] border border-[#ECECF4] bg-white px-3 focus-within:border-[#B9A7FF] sm:max-w-[360px]">
              <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts, companies, or tags..."
                className="w-full bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search">
                  <X className="h-4 w-4 text-[#9CA3AF]" />
                </button>
              )}
            </div>

            {(
              [
                { key: 'status', label: statusFilter === 'any' ? 'Status' : statusOf(statusFilter as CStatus).label, items: STATUSES.map((s) => ({ v: s.key, l: s.label })) },
                { key: 'company', label: companyFilter === 'any' ? 'Company' : companyFilter, items: companies.map((c) => ({ v: c, l: c })) },
                { key: 'tags', label: tagFilter === 'any' ? 'Tags' : `#${tagFilter}`, items: allTags.map((t) => ({ v: t, l: t })) },
              ] as const
            ).map((d) => (
              <div key={d.key} className="relative">
                <button
                  onClick={() => setDropFilter(dropFilter === d.key ? null : d.key)}
                  className={`flex h-10 items-center gap-1.5 rounded-[10px] border px-3.5 text-[12.5px] font-semibold transition-colors ${
                    (d.key === 'status' && statusFilter !== 'any') ||
                    (d.key === 'company' && companyFilter !== 'any') ||
                    (d.key === 'tags' && tagFilter !== 'any')
                      ? 'border-[#B9A7FF] bg-[#EEEDFC] text-[#5B4DFF]'
                      : 'border-[#ECECF4] bg-white text-[#374151] hover:bg-[#F6F5FB]'
                  }`}
                >
                  {d.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropFilter === d.key ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {dropFilter === d.key && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setDropFilter(null)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="absolute left-0 top-full z-40 mt-1.5 max-h-56 w-48 overflow-y-auto rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                      >
                        <button
                          onClick={() => {
                            if (d.key === 'status') setStatusFilter('any')
                            if (d.key === 'company') setCompanyFilter('any')
                            if (d.key === 'tags') setTagFilter('any')
                            setDropFilter(null)
                          }}
                          className="flex w-full items-center rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#9CA3AF] hover:bg-[#F6F5FB]"
                        >
                          Any
                        </button>
                        {d.items.map((it) => (
                          <button
                            key={it.v}
                            onClick={() => {
                              if (d.key === 'status') setStatusFilter(it.v as CStatus)
                              if (d.key === 'company') setCompanyFilter(it.v)
                              if (d.key === 'tags') setTagFilter(it.v)
                              setDropFilter(null)
                            }}
                            className="flex w-full items-center rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                          >
                            {it.l}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setSortOpen((o) => !o)}
                  className="flex h-10 items-center gap-1 rounded-[10px] bg-[#EEEDFC] px-3.5 text-[12px] font-semibold text-[#5B4DFF] transition-colors hover:bg-[#E2DCFC]"
                >
                  Sort: {sortBy === 'contacted' ? 'Last Contacted' : sortBy === 'name' ? 'Name' : 'Follow-up'}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 top-full z-40 mt-1 w-44 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                      >
                        {(
                          [
                            { key: 'contacted', label: 'Last Contacted' },
                            { key: 'name', label: 'Name A–Z' },
                            { key: 'followup', label: 'Next Follow-up' },
                          ] as const
                        ).map((s) => (
                          <button
                            key={s.key}
                            onClick={() => {
                              setSortBy(s.key)
                              setSortOpen(false)
                            }}
                            className="flex w-full items-center justify-between rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                          >
                            {s.label}
                            {sortBy === s.key && <Check className="h-3.5 w-3.5 text-[#5B4DFF]" strokeWidth={2.4} />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => setView((v) => (v === 'list' ? 'grid' : 'list'))}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ECECF4] bg-white text-[#6B7280] transition-colors hover:bg-[#F6F5FB]"
                title={view === 'list' ? 'Switch to grid' : 'Switch to list'}
              >
                {view === 'list' ? <List className="h-4 w-4" strokeWidth={2} /> : <LayoutGrid className="h-4 w-4" strokeWidth={2} />}
              </button>
            </div>
          </div>
        </div>

        {/* list */}
        <div className="min-h-0 flex-1 px-6 py-4 xl:px-8">
          <div className="overflow-hidden rounded-[16px] border border-[#ECECF4] bg-white">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <Users className="h-7 w-7 text-[#C4C4D4]" strokeWidth={1.6} />
                <p className="mt-2 text-[13.5px] font-medium text-[#9CA3AF]">No contacts match your filters.</p>
              </div>
            ) : view === 'list' ? (
              <>
                <div className="hidden grid-cols-[44px_minmax(0,1.4fr)_minmax(0,1fr)_100px_120px_120px_130px_44px_40px] items-center border-b border-[#F0EFF7] px-5 py-2.5 lg:grid">
                  <span>
                    <button
                      onClick={() => setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((c) => c.id)))}
                      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors ${
                        selected.length === filtered.length && filtered.length > 0
                          ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]'
                          : 'border-[#D5CFEE] bg-white hover:border-[#7C5BFF]'
                      }`}
                      aria-label="Select all"
                    >
                      {selected.length === filtered.length && filtered.length > 0 && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3.2} />
                      )}
                    </button>
                  </span>
                  {['Name', 'Company', 'Type', 'Status', 'Last Contacted', 'Next Follow-up'].map((h) => (
                    <span key={h} className="text-[12px] font-semibold text-[#9CA3AF]">
                      {h}
                    </span>
                  ))}
                  <span />
                  <span />
                </div>

                {filtered.map((c) => {
                  const t = typeOf(c.type)
                  const s = statusOf(c.status)
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedId(c.id)
                        setRightTab('overview')
                        setMobileDetail(true)
                      }}
                      className="group flex cursor-pointer flex-col gap-2 border-b border-[#F0EFF7] px-5 py-3 transition-colors last:border-b-0 hover:bg-[#FAF9FF] lg:grid lg:grid-cols-[44px_minmax(0,1.4fr)_minmax(0,1fr)_100px_120px_120px_130px_44px_40px] lg:items-center lg:gap-0"
                    >
                      <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelected((prev) => (prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]))}
                          className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors ${
                            selected.includes(c.id)
                              ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]'
                              : 'border-[#D5CFEE] bg-white hover:border-[#7C5BFF]'
                          }`}
                          aria-label="Select contact"
                        >
                          {selected.includes(c.id) && <Check className="h-3 w-3 text-white" strokeWidth={3.2} />}
                        </button>
                      </span>

                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E9E6FB] text-[11px] font-bold text-[#4B3BD8]">
                          {initials(c.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-semibold text-[#111827]">{c.name}</span>
                          <span className="block truncate text-[11.5px] text-[#9CA3AF]">{c.email}</span>
                        </span>
                      </span>

                      <span className="hidden truncate text-[12.5px] font-medium text-[#374151] lg:block">{c.company || '—'}</span>
                      <span className="hidden lg:block"><Pill bg={t.bg} fg={t.fg}>{t.label}</Pill></span>
                      <span className="hidden lg:block"><Pill bg={s.bg} fg={s.fg}>{s.label}</Pill></span>
                      <span className="hidden text-[12.5px] font-medium text-[#374151] lg:block">{fmtDay(c.lastContacted)}</span>
                      <span className="hidden lg:block">
                        {c.followUp ? (
                          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#374151]">
                            <CalendarDays className="h-3.5 w-3.5 text-[#5B4DFF]" strokeWidth={2} />
                            {fmtDate(c.followUp.date)}
                          </span>
                        ) : (
                          <span className="text-[12.5px] text-[#C4C4D4]">-</span>
                        )}
                      </span>

                      <span className="hidden lg:flex">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            patchContact(c.id, { starred: !c.starred })
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#FFF8E6] ${
                            c.starred ? 'text-[#F5B50A]' : 'text-[#C4C4D4] hover:text-[#F5B50A]'
                          }`}
                          title={c.starred ? 'Remove star' : 'Add star'}
                        >
                          <Star className="h-[17px] w-[17px]" fill={c.starred ? 'currentColor' : 'none'} strokeWidth={1.8} />
                        </button>
                      </span>

                      <span className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <span className="relative">
                          <button
                            onClick={() => setRowMenu(rowMenu === c.id ? null : c.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
                            aria-label="Contact options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <AnimatePresence>
                            {rowMenu === c.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setRowMenu(null)} />
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.13 }}
                                  className="absolute right-0 top-full z-40 mt-1 w-36 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                                >
                                  <button
                                    onClick={() => {
                                      openEdit(c)
                                      setRowMenu(null)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-[#6B7280]" /> Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      patchContact(c.id, { starred: !c.starred })
                                      setRowMenu(null)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                                  >
                                    <Star className="h-3.5 w-3.5 text-[#6B7280]" /> {c.starred ? 'Unstar' : 'Star'}
                                  </button>
                                  <button
                                    onClick={() => deleteContact(c.id)}
                                    className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </span>
                      </span>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((c) => {
                  const t = typeOf(c.type)
                  const s = statusOf(c.status)
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedId(c.id)
                        setRightTab('overview')
                        setMobileDetail(true)
                      }}
                      className="cursor-pointer rounded-[14px] border border-[#ECECF4] bg-white p-4 transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(70,60,140,0.10)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E9E6FB] text-[12px] font-bold text-[#4B3BD8]">
                          {initials(c.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold text-[#111827]">{c.name}</div>
                          <div className="truncate text-[11.5px] text-[#9CA3AF]">{c.email}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            patchContact(c.id, { starred: !c.starred })
                          }}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                            c.starred ? 'text-[#F5B50A]' : 'text-[#C4C4D4] hover:text-[#F5B50A]'
                          }`}
                        >
                          <Star className="h-4 w-4" fill={c.starred ? 'currentColor' : 'none'} strokeWidth={1.8} />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <Pill bg={t.bg} fg={t.fg}>{t.label}</Pill>
                        <Pill bg={s.bg} fg={s.fg}>{s.label}</Pill>
                        {c.followUp && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-[#6B7280]">
                            <CalendarDays className="h-3 w-3 text-[#5B4DFF]" strokeWidth={2} />
                            {fmtDate(c.followUp.date)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 truncate text-[11.5px] text-[#9CA3AF]">{c.company}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================== detail panel ============================= */}
      <aside className="hidden w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[#ECECF4] bg-white xl:flex">
        {active ? (
          detailBody
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <Users className="h-8 w-8 text-[#C4C4D4]" strokeWidth={1.6} />
            <p className="mt-3 text-[13.5px] font-medium text-[#9CA3AF]">Select a contact to see details, follow-ups and history.</p>
          </div>
        )}
      </aside>

      {/* mobile detail overlay */}
      <AnimatePresence>
        {mobileDetail && active && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-white xl:hidden"
          >
            {detailBody}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================ overlays =============================== */}
      <input
        ref={csvInput}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) importCsv(e.target.files[0])
          e.target.value = ''
        }}
      />

      <AnimatePresence>
        {modal && (
          <ContactModal draft={modal.draft} setDraft={(d) => setModal({ draft: d })} onClose={() => setModal(null)} onSave={saveDraft} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {small && small.kind === 'note' && (
          <SmallModal title="Add Note" onClose={() => setSmall(null)} onSave={addNote}>
            <textarea
              autoFocus
              value={small.text}
              onChange={(e) => setSmall({ ...small, text: e.target.value })}
              rows={4}
              placeholder="Write a note about this contact…"
              className="w-full resize-none rounded-[10px] border border-[#E7E5F2] bg-white p-3 text-[13px] leading-relaxed text-[#111827] outline-none focus:border-[#B9A7FF]"
            />
          </SmallModal>
        )}
        {small && small.kind === 'task' && (
          <SmallModal title="Add Task" onClose={() => setSmall(null)} onSave={addTask}>
            <input
              autoFocus
              value={small.text}
              onChange={(e) => setSmall({ ...small, text: e.target.value })}
              placeholder="Task description"
              className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
            />
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Due date</label>
            <input
              type="date"
              value={small.due}
              onChange={(e) => setSmall({ ...small, due: e.target.value })}
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
            />
          </SmallModal>
        )}
      </AnimatePresence>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-[12px] border border-[#ECECF4] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(40,35,90,0.18)]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E4F6EC]">
              <Check className="h-3 w-3 text-[#1F9D63]" strokeWidth={3} />
            </span>
            <span className="text-[13px] font-semibold text-[#111827]">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  User,
  Calendar,
  Dumbbell,
  Users,
  TrendingUp,
  Minus,
  ChevronDown,
  AlertTriangle,
  SlidersHorizontal,
  Bell,
  Plus,
  Check,
  MoreVertical,
  Trash2,
  Pencil,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react'
import { schedule } from '../data'

/* --------------------------------- model ---------------------------------- */

type Priority = 'high' | 'medium' | 'low'

type Task = {
  id: number
  title: string
  desc: string
  category: string
  due: string // yyyy-mm-dd
  time?: number // minutes from midnight
  priority: Priority
  done: boolean
}

const CATEGORIES: { key: string; label: string; icon: React.ElementType; bg: string; fg: string }[] = [
  { key: 'college', label: 'College', icon: GraduationCap, bg: '#EFECFE', fg: '#6D4AFF' },
  { key: 'personal', label: 'Personal', icon: User, bg: '#EEECFE', fg: '#5B4DFF' },
  { key: 'project', label: 'Project', icon: Calendar, bg: '#E7F0FF', fg: '#2F6DF6' },
  { key: 'health', label: 'Health', icon: Dumbbell, bg: '#E4F6EC', fg: '#10B981' },
  { key: 'extracurricular', label: 'Extracurricular', icon: Users, bg: '#FDE8F1', fg: '#EC4899' },
]

const PRIORITIES: { key: Priority; label: string; icon: React.ElementType; bg: string; fg: string }[] = [
  { key: 'high', label: 'High', icon: TrendingUp, bg: '#FDE8EC', fg: '#E11D48' },
  { key: 'medium', label: 'Medium', icon: Minus, bg: '#FFF3E0', fg: '#D97706' },
  { key: 'low', label: 'Low', icon: ChevronDown, bg: '#E4F6EC', fg: '#10B981' },
]

const cat = (k: string) => CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[0]
const pri = (k: Priority) => PRIORITIES.find((p) => p.key === k) ?? PRIORITIES[1]

/* ------------------------------ date helpers ------------------------------ */

function iso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function minsToLabel(m: number) {
  const h24 = Math.floor(m / 60)
  const min = m % 60
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h}:${String(min).padStart(2, '0')} ${ampm}`
}

function timeInputToMins(v: string) {
  const [h, m] = v.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function dueLabel(due: string, today: Date) {
  const t = iso(today)
  const tm = iso(addDays(today, 1))
  if (due === t) return 'Today'
  if (due === tm) return 'Tomorrow'
  const d = new Date(due + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* --------------------------------- seeds ---------------------------------- */

const TODAY = '2026-09-12'
const TOMORROW = '2026-09-13'

let idSeq = 2000
const buildSeeds = (): Task[] => [
  { id: idSeq++, title: 'Engineering Graphics Assignment', desc: 'Complete module 2 problems', category: 'college', due: TODAY, time: 720, priority: 'high', done: false },
  { id: idSeq++, title: 'Electron Devices Notes', desc: 'Revise BJT and MOSFET', category: 'college', due: TODAY, time: 1080, priority: 'medium', done: false },
  { id: idSeq++, title: 'Gym', desc: 'Back and Biceps', category: 'health', due: TODAY, time: 1140, priority: 'medium', done: false },
  { id: idSeq++, title: 'Project Discussion', desc: 'Meet with team', category: 'project', due: TOMORROW, time: 660, priority: 'high', done: false },
  { id: idSeq++, title: 'Read research paper', desc: 'VLSI trends 2024', category: 'personal', due: '2026-09-14', priority: 'low', done: false },
  { id: idSeq++, title: 'Maths Practice', desc: 'Solve previous year questions', category: 'college', due: '2026-09-14', priority: 'medium', done: false },
  { id: idSeq++, title: 'Plan next week', desc: 'Organize schedule and goals', category: 'personal', due: '2026-09-15', priority: 'low', done: false },
  { id: idSeq++, title: 'Club Meeting', desc: 'Tech Club', category: 'extracurricular', due: '2026-09-16', priority: 'medium', done: false },
  { id: idSeq++, title: 'Environment Science Report', desc: 'Prepare final draft', category: 'college', due: '2026-09-18', priority: 'high', done: false },
  { id: idSeq++, title: 'Physics Lab Report', desc: 'Submit delay analysis', category: 'college', due: '2026-09-10', time: 1020, priority: 'high', done: false },
  { id: idSeq++, title: 'Scholarship Form', desc: 'Attach documents and submit', category: 'personal', due: '2026-09-08', priority: 'medium', done: false },
  { id: idSeq++, title: 'Submit Lab Report', desc: 'Digital electronics lab', category: 'college', due: '2026-09-11', time: 960, priority: 'medium', done: true },
  { id: idSeq++, title: 'Buy Stationery', desc: 'A4 sheets and pens', category: 'personal', due: '2026-09-10', priority: 'low', done: true },
  { id: idSeq++, title: 'Return Library Books', desc: 'Two books at the counter', category: 'college', due: '2026-09-09', priority: 'low', done: true },
]

/* ------------------------------ progress ring ----------------------------- */

function Ring({ pct, size = 46 }: { pct: number; size?: number }) {
  const r = (size - 9) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECEAF8" strokeWidth="7" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#taskRing)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct / 100) }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="taskRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C5BFF" />
          <stop offset="100%" stopColor="#4F7CFF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ---------------------------------- modal --------------------------------- */

type Draft = {
  id?: number
  title: string
  desc: string
  category: string
  due: string
  time: string
  priority: Priority
}

const emptyDraft = (preset: Partial<Draft> = {}): Draft => ({
  title: '',
  desc: '',
  category: 'college',
  due: iso(new Date()),
  time: '',
  priority: 'medium',
  ...preset,
})

function TaskModal({
  draft,
  setDraft,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
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
        className="w-full max-w-[460px] rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_24px_60px_rgba(30,25,80,0.25)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-bold tracking-tight text-[#111827]">
            {draft.id ? 'Edit task' : 'New Task'}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F2F9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Title</label>
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. Engineering Graphics Assignment"
          className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
        />

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Description (optional)</label>
        <input
          value={draft.desc}
          onChange={(e) => set({ desc: e.target.value })}
          placeholder="Add a short note"
          className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
        />

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Category</label>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => set({ category: c.key })}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                draft.category === c.key
                  ? 'border-transparent text-white'
                  : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
              }`}
              style={draft.category === c.key ? { background: c.fg } : undefined}
            >
              <c.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {c.label}
            </button>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Due date</label>
            <input
              type="date"
              value={draft.due}
              onChange={(e) => set({ due: e.target.value })}
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Time (optional)</label>
            <input
              type="time"
              value={draft.time}
              onChange={(e) => set({ time: e.target.value })}
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
            />
          </div>
        </div>

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Priority</label>
        <div className="mb-4 flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              onClick={() => set({ priority: p.key })}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-[9px] border py-2 text-[12.5px] font-semibold transition-colors ${
                draft.priority === p.key
                  ? 'border-transparent text-white'
                  : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
              }`}
              style={draft.priority === p.key ? { background: p.fg } : undefined}
            >
              <p.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-semibold text-[#DC2626] transition-colors hover:bg-[#FEF2F2]"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-[10px] border border-[#E7E5F2] px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F6F5FB]"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {draft.id ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ================================ the page ================================ */

export default function TasksScreen({ onNavigate }: { onNavigate: (nav: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>(buildSeeds)
  const [tab, setTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'any' | Priority>('any')
  const [categoryFilter, setCategoryFilter] = useState<'any' | string>('any')
  const [filterOpen, setFilterOpen] = useState(false)
  const [modal, setModal] = useState<{ draft: Draft; edit: boolean } | null>(null)
  const [rowMenu, setRowMenu] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const today = new Date()
  const todayIso = iso(today)

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }

  /* ------------------------------- derived ------------------------------- */

  const isOverdue = (t: Task) => !t.done && t.due < todayIso

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.done).length
    const dueToday = tasks.filter((t) => !t.done && t.due === todayIso).length
    const overdue = tasks.filter(isOverdue).length
    return { total, completed, dueToday, overdue, pct: total ? Math.round((completed / total) * 100) : 0 }
  }, [tasks, todayIso])

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => {
        if (tab === 'completed') return t.done
        if (t.done) return false
        if (tab === 'today') return t.due === todayIso
        if (tab === 'upcoming') return t.due > todayIso
        if (tab === 'overdue') return t.due < todayIso
        return true
      })
      .filter((t) => (priorityFilter === 'any' ? true : t.priority === priorityFilter))
      .filter((t) => (categoryFilter === 'any' ? true : t.category === categoryFilter))
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        if (a.due !== b.due) return a.due < b.due ? -1 : 1
        return (a.time ?? 9999) - (b.time ?? 9999)
      })
  }, [tasks, tab, priorityFilter, categoryFilter, todayIso])

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    tasks.forEach((t) => (m[t.category] = (m[t.category] ?? 0) + 1))
    return m
  }, [tasks])

  const activeFilters = (priorityFilter !== 'any' ? 1 : 0) + (categoryFilter !== 'any' ? 1 : 0)

  /* --------------------------------- crud -------------------------------- */

  function saveDraft() {
    if (!modal) return
    const d = modal.draft
    if (!d.title.trim()) return
    const base: Task = {
      id: d.id ?? idSeq++,
      title: d.title.trim(),
      desc: d.desc.trim(),
      category: d.category,
      due: d.due || todayIso,
      time: d.time ? timeInputToMins(d.time) : undefined,
      priority: d.priority,
      done: tasks.find((t) => t.id === d.id)?.done ?? false,
    }
    setTasks((prev) => (d.id ? prev.map((t) => (t.id === d.id ? base : t)) : [...prev, base]))
    setModal(null)
    showToast(d.id ? 'Task updated' : 'Task created')
  }

  function toggleDone(id: number) {
    setTasks((prev) => {
      const t = prev.find((x) => x.id === id)
      if (t && !t.done) showToast('Task completed 🎉')
      return prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x))
    })
  }

  function openEdit(t: Task) {
    setModal({
      edit: true,
      draft: {
        id: t.id,
        title: t.title,
        desc: t.desc,
        category: t.category,
        due: t.due,
        time: t.time !== undefined ? minsToTime(t.time) : '',
        priority: t.priority,
      },
    })
    setRowMenu(null)
  }

  function minsToTime(m: number) {
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  }

  /* -------------------------------- render ------------------------------- */

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
  ] as const

  return (
    <div className="flex h-full min-h-0">
      {/* ============================== main column ============================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="shrink-0 px-6 pt-5 xl:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">Tasks</h1>
              <p className="mt-0.5 text-[13.5px] text-[#6B7280]">Turn your plans into progress.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setFilterOpen((o) => !o)}
                  className={`flex h-10 items-center gap-2 rounded-[10px] border px-4 text-[13px] font-semibold transition-colors ${
                    activeFilters > 0
                      ? 'border-[#B9A7FF] bg-[#EEEDFC] text-[#5B4DFF]'
                      : 'border-[#ECECF4] bg-white text-[#374151] hover:bg-[#F6F5FB]'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
                  Filter
                  {activeFilters > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5B4DFF] text-[9px] font-bold text-white">
                      {activeFilters}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {filterOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setFilterOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 top-full z-40 mt-1.5 w-64 rounded-[14px] border border-[#ECECF4] bg-white p-3.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                      >
                        <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                          Priority
                        </div>
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {(['any', 'high', 'medium', 'low'] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPriorityFilter(p)}
                              className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold capitalize transition-colors ${
                                priorityFilter === p
                                  ? 'border-transparent bg-[#16182B] text-white'
                                  : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
                              }`}
                            >
                              {p === 'any' ? 'Any' : p}
                            </button>
                          ))}
                        </div>
                        <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                          Category
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(['any', ...CATEGORIES.map((c) => c.key)] as const).map((c) => (
                            <button
                              key={c}
                              onClick={() => setCategoryFilter(c)}
                              className={`rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                                categoryFilter === c
                                  ? 'border-transparent bg-[#16182B] text-white'
                                  : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
                              }`}
                            >
                              {c === 'any' ? 'Any' : cat(c).label}
                            </button>
                          ))}
                        </div>
                        {activeFilters > 0 && (
                          <button
                            onClick={() => {
                              setPriorityFilter('any')
                              setCategoryFilter('any')
                            }}
                            className="mt-3 w-full rounded-[9px] border border-[#E7E5F2] py-1.5 text-[12px] font-semibold text-[#6B7280] transition-colors hover:bg-[#F6F5FB]"
                          >
                            Reset filters
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => setModal({ edit: false, draft: emptyDraft() })}
                className="flex h-10 items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                New Task
              </button>
            </div>
          </div>

          {/* tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                  tab === t.key
                    ? 'bg-[#16182B] text-white shadow-[0_3px_10px_rgba(22,24,43,0.25)]'
                    : 'border border-[#ECECF4] bg-white text-[#374151] hover:bg-[#F6F5FB]'
                }`}
              >
                {t.label}
                {t.key === 'overdue' && stats.overdue > 0 && (
                  <span className={`ml-1.5 ${tab === t.key ? 'text-white/70' : 'text-[#E11D48]'}`}>
                    {stats.overdue}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#EEEDFC]">
                <Check className="h-5 w-5 text-[#5B4DFF]" strokeWidth={2.4} />
              </span>
              <div>
                <div className="text-[20px] font-bold leading-tight text-[#111827]">{stats.total}</div>
                <div className="text-[12px] font-medium text-[#9CA3AF]">Total Tasks</div>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
              <div className="relative shrink-0">
                <Ring pct={stats.pct} />
                <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-bold text-[#111827]">
                  {stats.pct}%
                </span>
              </div>
              <div>
                <div className="text-[20px] font-bold leading-tight text-[#111827]">{stats.completed}</div>
                <div className="text-[12px] font-medium text-[#9CA3AF]">Completed</div>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#EEEDFC]">
                <Calendar className="h-5 w-5 text-[#5B4DFF]" strokeWidth={2} />
              </span>
              <div>
                <div className="text-[20px] font-bold leading-tight text-[#111827]">{stats.dueToday}</div>
                <div className="text-[12px] font-medium text-[#9CA3AF]">Due Today</div>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#FDE8EC]">
                <AlertTriangle className="h-5 w-5 text-[#E11D48]" strokeWidth={2} />
              </span>
              <div>
                <div className="text-[20px] font-bold leading-tight text-[#111827]">{stats.overdue}</div>
                <div className="text-[12px] font-medium text-[#9CA3AF]">Overdue</div>
              </div>
            </div>
          </div>
        </div>

        {/* task list */}
        <div className="min-h-0 flex-1 px-6 py-4 xl:px-8">
          <div className="rounded-[16px] border border-[#ECECF4] bg-white">
            <h2 className="px-5 pb-2 pt-4 text-[16px] font-bold tracking-tight text-[#111827]">Tasks</h2>

            {/* header row (desktop) */}
            <div className="hidden grid-cols-[44px_minmax(0,1fr)_140px_130px_110px_40px] items-center px-5 pb-2 md:grid">
              <span className="text-[12px] font-semibold text-[#9CA3AF]">
                <button
                  onClick={() => {
                    const allDone = filtered.length > 0 && filtered.every((t) => t.done)
                    setTasks((prev) =>
                      prev.map((t) => (filtered.some((f) => f.id === t.id) ? { ...t, done: !allDone } : t)),
                    )
                  }}
                  className="h-[18px] w-[18px] rounded-[5px] border border-[#D5CFEE] transition-colors hover:border-[#7C5BFF]"
                  title="Toggle all visible"
                />
              </span>
              {['Task', 'Category', 'Due Date', 'Priority'].map((h) => (
                <span key={h} className="text-[12px] font-semibold text-[#9CA3AF]">
                  {h}
                </span>
              ))}
              <span />
            </div>

            {/* rows */}
            <div className="pb-2">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <Check className="h-7 w-7 text-[#C4C4D4]" strokeWidth={1.8} />
                  <p className="mt-2 text-[13.5px] font-medium text-[#9CA3AF]">
                    No tasks here — you're all caught up.
                  </p>
                </div>
              )}
              {filtered.map((t) => {
                const c = cat(t.category)
                const p = pri(t.priority)
                const overdue = isOverdue(t)
                return (
                  <div
                    key={t.id}
                    className="group flex flex-col gap-2 border-t border-[#F0EFF7] px-5 py-3 transition-colors first:border-t-0 hover:bg-[#FAF9FF] md:grid md:grid-cols-[44px_minmax(0,1fr)_140px_130px_110px_40px] md:items-center md:gap-0"
                  >
                    {/* checkbox */}
                    <span className="flex items-center">
                      <button
                        onClick={() => toggleDone(t.id)}
                        aria-label={t.done ? 'Mark incomplete' : 'Mark complete'}
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-all ${
                          t.done
                            ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]'
                            : 'border-[#D5CFEE] bg-white hover:border-[#7C5BFF]'
                        }`}
                      >
                        {t.done && <Check className="h-3 w-3 text-white" strokeWidth={3.2} />}
                      </button>
                    </span>

                    {/* title + desc + mobile pills */}
                    <button onClick={() => openEdit(t)} className="min-w-0 text-left">
                      <span
                        className={`block truncate text-[14px] font-semibold ${
                          t.done ? 'text-[#9CA3AF] line-through' : 'text-[#111827]'
                        }`}
                      >
                        {t.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-[#9CA3AF]">{t.desc}</span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5 md:hidden">
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                          style={{ background: c.bg, color: c.fg }}
                        >
                          <c.icon className="h-3 w-3" strokeWidth={2.2} />
                          {c.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                            overdue ? 'bg-[#FDE8EC] text-[#E11D48]' : 'bg-[#F3F2F9] text-[#6B7280]'
                          }`}
                        >
                          {dueLabel(t.due, today)}
                          {t.time !== undefined ? ` · ${minsToLabel(t.time)}` : ''}
                        </span>
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                          style={{ background: p.bg, color: p.fg }}
                        >
                          <p.icon className="h-3 w-3" strokeWidth={2.2} />
                          {p.label}
                        </span>
                      </span>
                    </button>

                    {/* category */}
                    <span className="hidden md:block">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                        style={{ background: c.bg, color: c.fg }}
                      >
                        <c.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                        {c.label}
                      </span>
                    </span>

                    {/* due */}
                    <span className="hidden md:block">
                      <span
                        className={`block text-[13px] font-semibold ${
                          overdue ? 'text-[#E11D48]' : 'text-[#111827]'
                        }`}
                      >
                        {dueLabel(t.due, today)}
                      </span>
                      {t.time !== undefined && (
                        <span className="block text-[11.5px] text-[#9CA3AF]">{minsToLabel(t.time)}</span>
                      )}
                    </span>

                    {/* priority */}
                    <span className="hidden md:block">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                        style={{ background: p.bg, color: p.fg }}
                      >
                        <p.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                        {p.label}
                      </span>
                    </span>

                    {/* menu */}
                    <span className="flex justify-end">
                      <span className="relative">
                        <button
                          onClick={() => setRowMenu(rowMenu === t.id ? null : t.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] opacity-0 transition-all hover:bg-[#F3F2F9] hover:text-[#111827] group-hover:opacity-100"
                          aria-label="Task options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <AnimatePresence>
                          {rowMenu === t.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setRowMenu(null)} />
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.13 }}
                                className="absolute right-0 top-full z-40 mt-1 w-32 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                              >
                                <button
                                  onClick={() => openEdit(t)}
                                  className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-[#6B7280]" /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setTasks((prev) => prev.filter((x) => x.id !== t.id))
                                    setRowMenu(null)
                                    showToast('Task deleted')
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
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ============================== right panel ============================== */}
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#ECECF4] bg-white p-4 xl:flex">
        {/* Today */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Today</h3>
              <p className="mt-0.5 text-[12px] text-[#9CA3AF]">
                {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => onNavigate('Calendar')}
              className="flex items-center gap-1 text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
            >
              View Calendar
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {schedule.map((s) => (
              <div key={s.time} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.dot }} />
                <span className="w-[54px] shrink-0 text-[11.5px] font-semibold text-[#6B7280]">{s.time}</span>
                <span className="min-w-0 truncate text-[12.5px] font-semibold text-[#111827]">
                  {s.title}
                  <span className="font-normal text-[#9CA3AF]">
                    {' '}
                    ({s.title === 'Gym' ? 'Fitness Center' : s.place})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Categories */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Task Categories</h3>
            <button
              onClick={() => setCategoryFilter('any')}
              className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
              title="Show all categories"
            >
              Manage
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategoryFilter((f) => (f === c.key ? 'any' : c.key))}
                className={`flex items-center gap-3 rounded-[10px] px-1.5 py-1.5 text-left transition-colors ${
                  categoryFilter === c.key ? 'bg-[#EEEDFC]' : 'hover:bg-[#F6F5FB]'
                }`}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-[9px]"
                  style={{ background: c.bg }}
                >
                  <c.icon className="h-4 w-4" style={{ color: c.fg }} strokeWidth={2} />
                </span>
                <span className="flex-1 text-[13.5px] font-semibold text-[#111827]">{c.label}</span>
                <span className="rounded-full bg-[#F3F2F9] px-2 py-0.5 text-[11.5px] font-bold text-[#6B7280]">
                  {catCounts[c.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Add */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Quick Add</h3>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { label: 'Task', icon: Check, preset: {} as Partial<Draft> },
              { label: 'Class', icon: GraduationCap, preset: { category: 'college' } },
              { label: 'Event', icon: Calendar, preset: { category: 'project' } },
              { label: 'Reminder', icon: Bell, preset: { category: 'personal', priority: 'high' as Priority } },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => setModal({ edit: false, draft: emptyDraft({ due: todayIso, ...q.preset }) })}
                className="flex flex-col items-center gap-1.5 rounded-[12px] border border-[#ECECF4] bg-[#FBFAFE] py-3 transition-all hover:-translate-y-[2px] hover:border-[#C9BCFF] hover:bg-[#F6F3FF]"
              >
                <q.icon className="h-5 w-5 text-[#5B4DFF]" strokeWidth={2} />
                <span className="text-[11px] font-semibold text-[#374151]">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* quote */}
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#EFECFE] via-[#E7E4FD] to-[#DDD6FB] p-4">
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#5B4DFF]" strokeWidth={2.2} />
            <p className="text-[13.5px] font-medium italic leading-relaxed text-[#3D3564]">
              "Consistent progress leads to big results."
            </p>
          </div>
        </div>
      </aside>

      {/* ================================ overlays =============================== */}
      <AnimatePresence>
        {modal && (
          <TaskModal
            draft={modal.draft}
            setDraft={(d) => setModal({ edit: modal.edit, draft: d })}
            onClose={() => setModal(null)}
            onSave={saveDraft}
            onDelete={modal.edit && modal.draft.id ? () => {
              setTasks((prev) => prev.filter((t) => t.id !== modal.draft.id))
              setModal(null)
              showToast('Task deleted')
            } : undefined}
          />
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

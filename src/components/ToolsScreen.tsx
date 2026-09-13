import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ChevronDown,
  List,
  LayoutGrid,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ArrowRight,
  X,
  Check,
  Github,
  Triangle,
  Sparkle,
  Code2,
  PenTool,
  Box,
} from 'lucide-react'

/* --------------------------------- model ---------------------------------- */

type CatKey = 'ai' | 'development' | 'design' | 'productivity' | 'others'

type Tool = {
  id: number
  name: string
  desc: string
  category: CatKey
  price: number
  renewal: string // yyyy-mm-dd
  logo: string // logo key
}

const CATEGORIES: { key: CatKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'ai', label: 'AI', icon: Layers, color: '#7C5BFF' },
  { key: 'development', label: 'Development', icon: Code2, color: '#2F6DF6' },
  { key: 'design', label: 'Design', icon: PenTool, color: '#EC4899' },
  { key: 'productivity', label: 'Productivity', icon: Box, color: '#10B981' },
  { key: 'others', label: 'Others', icon: LayoutGrid, color: '#9CA3AF' },
]

const catOf = (k: CatKey) => CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[4]

type Status = 'active' | 'expiring' | 'expired'

const STATUS_STYLE: Record<Status, { label: string; bg: string; fg: string }> = {
  active: { label: 'Active', bg: '#E4F6EC', fg: '#10B981' },
  expiring: { label: 'Expiring Soon', bg: '#FFF3E0', fg: '#D97706' },
  expired: { label: 'Expired', bg: '#FDE8EC', fg: '#E11D48' },
}

const EXPIRING_WINDOW = 7 // days

function statusOf(tool: Tool, todayIso: string, daysLeft: number): Status {
  if (tool.renewal < todayIso) return 'expired'
  if (daysLeft <= EXPIRING_WINDOW) return 'expiring'
  return 'active'
}

function daysLeftOf(renewal: string, todayIso: string) {
  const a = new Date(renewal + 'T00:00:00').getTime()
  const b = new Date(todayIso + 'T00:00:00').getTime()
  return Math.round((a - b) / 86400000)
}

function iso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function addMonths(dateIso: string, n: number) {
  const d = new Date(dateIso + 'T00:00:00')
  d.setMonth(d.getMonth() + n)
  return iso(d)
}

function fmtDate(dateIso: string) {
  return new Date(dateIso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtMoney(n: number) {
  return `$${n.toFixed(2)}`
}

/* --------------------------------- logos ---------------------------------- */

const LOGOS: Record<
  string,
  { bg: string; fg: string; border?: boolean; render: (fg: string) => React.ReactNode }
> = {
  chatgpt: { bg: '#FFFFFF', fg: '#16182B', border: true, render: (fg) => <span className="text-[15px] font-black" style={{ color: fg }}>G</span> },
  claude: { bg: '#FCEFEC', fg: '#D97757', render: () => <Sparkle className="h-5 w-5" style={{ color: '#D97757' }} fill="currentColor" strokeWidth={0} /> },
  gemini: { bg: 'linear-gradient(135deg,#4F7CFF,#9B5BFF)', fg: '#FFFFFF', render: () => <Sparkle className="h-5 w-5 text-white" fill="currentColor" strokeWidth={0} /> },
  github: { bg: '#16182B', fg: '#FFFFFF', render: () => <Github className="h-5 w-5 text-white" strokeWidth={2} /> },
  notion: { bg: '#FFFFFF', fg: '#111827', border: true, render: (fg) => <span className="text-[15px] font-black" style={{ color: fg }}>N</span> },
  figma: { bg: '#1E1E2E', fg: '#FFFFFF', render: (fg) => <span className="text-[14px] font-black" style={{ color: fg }}>F</span> },
  vercel: { bg: '#16182B', fg: '#FFFFFF', render: () => <Triangle className="h-4 w-4 text-white" fill="currentColor" strokeWidth={0} /> },
  canva: { bg: 'linear-gradient(135deg,#00C4CC,#8B3DFF)', fg: '#FFFFFF', render: (fg) => <span className="text-[15px] font-black" style={{ color: fg }}>C</span> },
  generic: { bg: '#EEEDFC', fg: '#6D4AFF', render: () => <Layers className="h-5 w-5 text-[#6D4AFF]" strokeWidth={2} /> },
}

function ToolLogo({ logo, className = 'h-11 w-11' }: { logo: string; className?: string }) {
  const l = LOGOS[logo] ?? LOGOS.generic
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[12px] ${l.border ? 'border border-[#E7E5F2]' : ''} ${className}`}
      style={{ background: l.bg }}
    >
      {l.render(l.fg)}
    </span>
  )
}

function autoLogo(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('chatgpt') || n.includes('openai')) return 'chatgpt'
  if (n.includes('claude')) return 'claude'
  if (n.includes('gemini') || n.includes('bard')) return 'gemini'
  if (n.includes('github') || n.includes('copilot')) return 'github'
  if (n.includes('notion')) return 'notion'
  if (n.includes('figma')) return 'figma'
  if (n.includes('vercel')) return 'vercel'
  if (n.includes('canva')) return 'canva'
  return 'generic'
}

/* --------------------------------- seeds ---------------------------------- */

type Draft = { id?: number; name: string; desc: string; category: CatKey; price: number; renewal: string }

let idSeq = 6000

const seedTools = (): Tool[] => [
  { id: idSeq++, name: 'ChatGPT Plus', desc: 'More capable AI for work and study', category: 'ai', price: 20, renewal: '2026-10-12', logo: 'chatgpt' },
  { id: idSeq++, name: 'Claude Pro', desc: 'Advanced AI assistant', category: 'ai', price: 20, renewal: '2026-11-05', logo: 'claude' },
  { id: idSeq++, name: 'Gemini Advanced', desc: "Google's most capable AI model", category: 'ai', price: 19.99, renewal: '2026-12-01', logo: 'gemini' },
  { id: idSeq++, name: 'GitHub Copilot', desc: 'AI pair programmer', category: 'development', price: 10, renewal: '2026-09-25', logo: 'github' },
  { id: idSeq++, name: 'Notion Plus', desc: 'All-in-one workspace', category: 'productivity', price: 8, renewal: '2026-09-15', logo: 'notion' },
  { id: idSeq++, name: 'Figma Professional', desc: 'Design and prototyping', category: 'design', price: 12, renewal: '2026-08-20', logo: 'figma' },
  { id: idSeq++, name: 'Vercel Pro', desc: 'Deploy and host your projects', category: 'development', price: 20, renewal: '2026-11-18', logo: 'vercel' },
  { id: idSeq++, name: 'Canva Pro', desc: 'Design anything', category: 'design', price: 12.99, renewal: '2027-01-10', logo: 'canva' },
]

/* -------------------------------- storage --------------------------------- */

const STORAGE_KEY = 'zikzik-tools-v1'

function loadTools(): Tool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* corrupted → reseed */
  }
  const seeded = seedTools()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  } catch {
    /* unavailable */
  }
  return seeded
}

/* ================================ the page ================================ */

export default function ToolsScreen() {
  const initial = useRef(loadTools())
  const [tools, setTools] = useState<Tool[]>(initial.current)
  const [catTab, setCatTab] = useState<'all' | CatKey>('all')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'any' | Status>('any')
  const [catFilter, setCatFilter] = useState<'any' | CatKey>('any')
  const [dropFilter, setDropFilter] = useState<'status' | 'category' | null>(null)
  const [sortBy, setSortBy] = useState<'renewal' | 'name' | 'price'>('renewal')
  const [sortOpen, setSortOpen] = useState(false)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [headerMenu, setHeaderMenu] = useState(false)
  const [rowMenu, setRowMenu] = useState<number | null>(null)
  const [modal, setModal] = useState<{ draft: Draft } | null>(null)
  const [spendMode, setSpendMode] = useState<'monthly' | 'yearly'>('monthly')
  const [spendOpen, setSpendOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const todayIso = iso(new Date())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tools))
    } catch {
      /* unavailable */
    }
  }, [tools])

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  /* ------------------------------- derived ------------------------------- */

  const enriched = useMemo(
    () =>
      tools.map((t) => {
        const dl = daysLeftOf(t.renewal, todayIso)
        return { ...t, dl, status: statusOf(t, todayIso, dl) }
      }),
    [tools, todayIso],
  )

  const stats = useMemo(() => {
    const total = enriched.length
    const active = enriched.filter((t) => t.status === 'active').length
    const expiring = enriched.filter((t) => t.status === 'expiring').length
    const expired = enriched.filter((t) => t.status === 'expired').length
    return { total, active, expiring, expired }
  }, [enriched])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enriched
      .filter((t) => (catTab === 'all' ? true : t.category === catTab))
      .filter((t) => (statusFilter === 'any' ? true : t.status === statusFilter))
      .filter((t) => (catFilter === 'any' ? true : t.category === catFilter))
      .filter((t) => (q ? t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'price') return b.price - a.price
        return a.renewal < b.renewal ? -1 : 1
      })
  }, [enriched, catTab, statusFilter, catFilter, query, sortBy])

  const upcoming = useMemo(
    () =>
      enriched
        .filter((t) => t.status !== 'expired')
        .sort((a, b) => (a.renewal < b.renewal ? -1 : 1))
        .slice(0, 4),
    [enriched],
  )

  const spending = useMemo(() => {
    const activeTools = enriched.filter((t) => t.status === 'active')
    const byCat: Record<string, number> = {}
    activeTools.forEach((t) => {
      byCat[t.category] = (byCat[t.category] ?? 0) + t.price
    })
    const mult = spendMode === 'yearly' ? 12 : 1
    const rows = CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      value: (byCat[c.key] ?? 0) * mult,
    })).filter((r) => r.value > 0)
    const total = rows.reduce((s, r) => s + r.value, 0)
    return { rows, total, mult }
  }, [enriched, spendMode])

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    enriched.forEach((t) => (m[t.category] = (m[t.category] ?? 0) + 1))
    return m
  }, [enriched])

  /* -------------------------------- crud --------------------------------- */

  function saveDraft() {
    if (!modal) return
    const d = modal.draft
    if (!d.name.trim()) return
    if (d.id) {
      setTools((prev) =>
        prev.map((t) =>
          t.id === d.id
            ? { ...t, name: d.name.trim(), desc: d.desc.trim(), category: d.category, price: d.price, renewal: d.renewal || t.renewal, logo: autoLogo(d.name) }
            : t,
        ),
      )
      showToast('Tool updated')
    } else {
      setTools((prev) => [
        { id: idSeq++, name: d.name.trim(), desc: d.desc.trim(), category: d.category, price: d.price, renewal: d.renewal || iso(new Date()), logo: autoLogo(d.name) },
        ...prev,
      ])
      showToast('Tool added')
    }
    setModal(null)
  }

  function renewTool(id: number) {
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, renewal: addMonths(t.renewal > todayIso ? t.renewal : todayIso, 1) } : t)))
    setRowMenu(null)
    showToast('Renewed for 1 month')
  }

  function deleteTool(id: number) {
    setTools((prev) => prev.filter((t) => t.id !== id))
    setRowMenu(null)
    showToast('Tool removed')
  }

  const activeFilters = (statusFilter !== 'any' ? 1 : 0) + (catFilter !== 'any' ? 1 : 0)

  /* -------------------------------- render ------------------------------- */

  const tabs: { key: 'all' | CatKey; label: string }[] = [
    { key: 'all', label: 'All' },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
  ]

  const daysColor = (dl: number) => (dl <= EXPIRING_WINDOW ? '#E11D48' : dl <= 14 ? '#D97706' : '#9CA3AF')

  const rowMenuHandlers = (t: (typeof enriched)[number]) => ({
    onEdit: () => {
      setModal({ draft: { id: t.id, name: t.name, desc: t.desc, category: t.category, price: t.price, renewal: t.renewal } })
      setRowMenu(null)
    },
    onRenew: () => renewTool(t.id),
    onDelete: () => deleteTool(t.id),
  })

  const FileMenuBtn = ({ t }: { t: (typeof enriched)[number] }) => (
    <span className="relative">
      <button
        onClick={() => setRowMenu(rowMenu === t.id ? null : t.id)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
        aria-label="Tool options"
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
              className="absolute right-0 top-full z-40 mt-1 w-44 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
            >
              {(
                [
                  { label: 'Edit tool', icon: Pencil, action: rowMenuHandlers(t).onEdit },
                  { label: 'Renew +1 month', icon: RefreshCw, action: rowMenuHandlers(t).onRenew },
                ] as const
              ).map((it) => (
                <button
                  key={it.label}
                  onClick={it.action}
                  className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                >
                  <it.icon className="h-3.5 w-3.5 text-[#6B7280]" /> {it.label}
                </button>
              ))}
              <button
                onClick={rowMenuHandlers(t).onDelete}
                className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  )

  return (
    <div className="flex h-full min-h-0">
      {/* ============================== main column ============================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="shrink-0 px-6 pt-5 xl:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">Tools</h1>
              <p className="mt-0.5 text-[13.5px] text-[#6B7280]">
                Manage your tools, subscriptions, and get the most out of your productivity stack.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModal({ draft: { name: '', desc: '', category: 'ai', price: 0, renewal: iso(new Date()) } })}
                className="flex h-10 items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                Add Tool
              </button>
              <div className="relative">
                <button
                  onClick={() => setHeaderMenu((o) => !o)}
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ECECF4] bg-white text-[#6B7280] transition-colors hover:bg-[#F6F5FB]"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
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
                            const exp = enriched.filter((t) => t.status === 'expiring')
                            showToast(exp.length === 0 ? 'No tools expiring soon' : `${exp.length} tool${exp.length === 1 ? '' : 's'} expiring within ${EXPIRING_WINDOW} days`)
                            setHeaderMenu(false)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                        >
                          <Clock className="h-4 w-4 text-[#6B7280]" strokeWidth={2} /> Check expiring
                        </button>
                        <button
                          onClick={() => {
                            setCatTab('all')
                            setStatusFilter('any')
                            setCatFilter('any')
                            setQuery('')
                            setHeaderMenu(false)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                        >
                          <LayoutGrid className="h-4 w-4 text-[#6B7280]" strokeWidth={2} /> Reset filters
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* category tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setCatTab(t.key)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                  catTab === t.key
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
              { label: 'Total Tools', value: stats.total, icon: Layers, bg: '#EEEDFC', fg: '#5B4DFF' },
              { label: 'Active', value: stats.active, icon: CheckCircle2, bg: '#E4F6EC', fg: '#10B981' },
              { label: 'Expiring Soon', value: stats.expiring, icon: Clock, bg: '#FFF3E0', fg: '#D97706' },
              { label: 'Expired', value: stats.expired, icon: AlertTriangle, bg: '#FDE8EC', fg: '#E11D48' },
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
            <div className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-[10px] border border-[#ECECF4] bg-white px-3 focus-within:border-[#B9A7FF] sm:max-w-[340px]">
              <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools..."
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
                {
                  key: 'status',
                  label: statusFilter === 'any' ? 'Status' : STATUS_STYLE[statusFilter as Status].label,
                  items: (['active', 'expiring', 'expired'] as Status[]).map((s) => ({ v: s, l: STATUS_STYLE[s].label })),
                },
                {
                  key: 'category',
                  label: catFilter === 'any' ? 'Category' : catOf(catFilter as CatKey).label,
                  items: CATEGORIES.map((c) => ({ v: c.key, l: c.label })),
                },
              ] as const
            ).map((d) => (
              <div key={d.key} className="relative">
                <button
                  onClick={() => setDropFilter(dropFilter === d.key ? null : d.key)}
                  className={`flex h-10 items-center gap-1.5 rounded-[10px] border px-3.5 text-[12.5px] font-semibold transition-colors ${
                    (d.key === 'status' && statusFilter !== 'any') || (d.key === 'category' && catFilter !== 'any')
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
                        className="absolute left-0 top-full z-40 mt-1.5 w-44 rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                      >
                        <button
                          onClick={() => {
                            if (d.key === 'status') setStatusFilter('any')
                            if (d.key === 'category') setCatFilter('any')
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
                              if (d.key === 'status') setStatusFilter(it.v as Status)
                              if (d.key === 'category') setCatFilter(it.v as CatKey)
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
                  Sort: {sortBy === 'renewal' ? 'Renewal Date' : sortBy === 'name' ? 'Name' : 'Price'}
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
                            { key: 'renewal', label: 'Renewal Date' },
                            { key: 'name', label: 'Name A–Z' },
                            { key: 'price', label: 'Price (high first)' },
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
              <div className="flex overflow-hidden rounded-[10px] border border-[#ECECF4] bg-white">
                {(
                  [
                    { key: 'list', icon: List },
                    { key: 'grid', icon: LayoutGrid },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    className={`flex h-10 w-10 items-center justify-center transition-colors ${
                      view === v.key ? 'bg-[#EEEDFC] text-[#5B4DFF]' : 'text-[#6B7280] hover:bg-[#F6F5FB]'
                    }`}
                    title={v.key === 'list' ? 'List view' : 'Grid view'}
                  >
                    <v.icon className="h-4 w-4" strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* table */}
        <div className="min-h-0 flex-1 px-6 py-4 xl:px-8">
          <div className="overflow-hidden rounded-[16px] border border-[#ECECF4] bg-white">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <Layers className="h-7 w-7 text-[#C4C4D4]" strokeWidth={1.6} />
                <p className="mt-2 text-[13.5px] font-medium text-[#9CA3AF]">No tools match your filters.</p>
              </div>
            ) : view === 'list' ? (
              <>
                <div className="hidden grid-cols-[minmax(0,1.5fr)_110px_140px_170px_130px_40px] items-center border-b border-[#F0EFF7] px-5 py-2.5 md:grid">
                  {['Tool', 'Category', 'Price', 'Renewal', 'Status'].map((h) => (
                    <span key={h} className="text-[12px] font-semibold text-[#9CA3AF]">
                      {h}
                    </span>
                  ))}
                  <span />
                </div>
                {filtered.map((t) => {
                  const s = STATUS_STYLE[t.status]
                  const c = catOf(t.category)
                  const expired = t.status === 'expired'
                  return (
                    <div
                      key={t.id}
                      className="group flex flex-col gap-2 border-b border-[#F0EFF7] px-5 py-3 transition-colors last:border-b-0 hover:bg-[#FAF9FF] md:grid md:grid-cols-[minmax(0,1.5fr)_110px_140px_170px_130px_40px] md:items-center md:gap-0"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <ToolLogo logo={t.logo} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-bold text-[#111827]">{t.name}</span>
                          <span className="block truncate text-[11.5px] text-[#9CA3AF]">{t.desc}</span>
                        </span>
                      </span>
                      <span className="hidden md:block">
                        <span className="inline-flex items-center rounded-full bg-[#F3F2F9] px-2.5 py-1 text-[11.5px] font-semibold text-[#4B5563]">
                          {c.label}
                        </span>
                      </span>
                      <span className="hidden text-[12.5px] font-semibold text-[#111827] md:block">
                        {fmtMoney(t.price)} <span className="font-medium text-[#9CA3AF]">/ month</span>
                      </span>
                      <span className="hidden md:block">
                        <span className={`block text-[12.5px] font-semibold ${t.status === 'expiring' ? 'text-[#E11D48]' : 'text-[#111827]'}`}>
                          {fmtDate(t.renewal)}
                        </span>
                        {!expired && (
                          <span className="block text-[11px] font-medium" style={{ color: daysColor(t.dl) }}>
                            {t.dl === 1 ? '1 day left' : `${t.dl} days left`}
                          </span>
                        )}
                      </span>
                      <span className="hidden md:block">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                          style={{ background: s.bg, color: s.fg }}
                        >
                          {s.label}
                        </span>
                      </span>
                      <span className="flex justify-end">
                        <FileMenuBtn t={t} />
                      </span>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((t) => {
                  const s = STATUS_STYLE[t.status]
                  const c = catOf(t.category)
                  const expired = t.status === 'expired'
                  return (
                    <div
                      key={t.id}
                      className="rounded-[14px] border border-[#ECECF4] bg-white p-4 transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(70,60,140,0.10)]"
                    >
                      <div className="flex items-start justify-between">
                        <ToolLogo logo={t.logo} />
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: s.bg, color: s.fg }}
                        >
                          {s.label}
                        </span>
                      </div>
                      <div className="mt-2.5 truncate text-[14px] font-bold text-[#111827]">{t.name}</div>
                      <div className="truncate text-[11.5px] text-[#9CA3AF]">{t.desc}</div>
                      <div className="mt-2.5 flex items-center justify-between text-[12px]">
                        <span className="font-semibold text-[#111827]">
                          {fmtMoney(t.price)}
                          <span className="font-medium text-[#9CA3AF]"> / mo</span>
                        </span>
                        <span className="inline-flex items-center rounded-full bg-[#F3F2F9] px-2 py-0.5 text-[10.5px] font-semibold text-[#4B5563]">
                          {c.label}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className={`text-[11.5px] font-semibold ${t.status === 'expiring' ? 'text-[#E11D48]' : 'text-[#6B7280]'}`}>
                          {fmtDate(t.renewal)}
                        </span>
                        {!expired && (
                          <span className="text-[11px] font-medium" style={{ color: daysColor(t.dl) }}>
                            {t.dl === 1 ? '1 day left' : `${t.dl} days left`}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 border-t border-[#F0EFF7] pt-2 text-right">
                        <FileMenuBtn t={t} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================== right panel ============================== */}
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#ECECF4] bg-white p-4 xl:flex">
        {/* Upcoming Renewals */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Upcoming Renewals</h3>
            <button
              onClick={() => {
                setCatTab('all')
                setStatusFilter('any')
                setCatFilter('any')
                setSortBy('renewal')
                setQuery('')
              }}
              className="flex items-center gap-1 text-[12px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
            >
              View All <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <ToolLogo logo={t.logo} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-[#111827]">{t.name}</div>
                  <div className="text-[11.5px] font-semibold text-[#6B7280]">{fmtMoney(t.price)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[12px] font-bold" style={{ color: daysColor(t.dl) }}>
                    {fmtDate(t.renewal)}
                  </div>
                  <div className="text-[11px] font-medium" style={{ color: daysColor(t.dl) }}>
                    {t.dl === 1 ? '1 day left' : `${t.dl} days left`}
                  </div>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <p className="py-3 text-center text-[12px] text-[#9CA3AF]">No upcoming renewals.</p>}
          </div>
        </div>

        {/* Monthly Spending */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="whitespace-nowrap text-[15.5px] font-bold tracking-tight text-[#111827]">Monthly Spending</h3>
            <div className="relative">
              <button
                onClick={() => setSpendOpen((o) => !o)}
                className="flex items-center gap-1 rounded-full bg-[#F3F2F9] px-2.5 py-1 text-[11px] font-semibold text-[#374151] transition-colors hover:bg-[#ECEAF7]"
              >
                {spendMode === 'monthly' ? 'This Month' : 'Yearly'}
                <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {spendOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setSpendOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 top-full z-40 mt-1 w-36 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                    >
                      {(
                        [
                          { key: 'monthly', label: 'This Month' },
                          { key: 'yearly', label: 'Yearly (×12)' },
                        ] as const
                      ).map((o) => (
                        <button
                          key={o.key}
                          onClick={() => {
                            setSpendMode(o.key)
                            setSpendOpen(false)
                          }}
                          className="flex w-full items-center justify-between rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                        >
                          {o.label}
                          {spendMode === o.key && <Check className="h-3.5 w-3.5 text-[#5B4DFF]" strokeWidth={2.4} />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-2 text-[26px] font-extrabold tracking-tight text-[#111827]">
            {fmtMoney(spending.total)}
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[#EFEDF8]">
            {spending.rows.map((r) => (
              <div key={r.key} style={{ width: `${spending.total ? (r.value / spending.total) * 100 : 0}%`, background: r.color }} />
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {CATEGORIES.map((c) => {
              const row = spending.rows.find((r) => r.key === c.key)
              return (
                <div key={c.key} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1 font-medium text-[#374151]">{c.label}</span>
                  <span className="font-semibold text-[#6B7280]">{fmtMoney(row?.value ?? 0)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Categories</h3>
            <button
              onClick={() => {
                setCatTab('all')
                setCatFilter('any')
              }}
              className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
              title="Show all categories"
            >
              Manage
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCatFilter((f) => (f === c.key ? 'any' : c.key))}
                className={`flex items-center gap-3 rounded-[10px] px-1.5 py-1.5 text-left transition-colors ${
                  catFilter === c.key ? 'bg-[#EEEDFC]' : 'hover:bg-[#F6F5FB]'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#EEEDFC]">
                  <c.icon className="h-4 w-4" style={{ color: c.color }} strokeWidth={2} />
                </span>
                <span className="flex-1 text-[13.5px] font-semibold text-[#111827]">{c.label}</span>
                <span className="rounded-full bg-[#F3F2F9] px-2 py-0.5 text-[11.5px] font-bold text-[#6B7280]">
                  {catCounts[c.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* quote */}
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#EFECFE] via-[#E7E4FD] to-[#DDD6FB] p-4">
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
          <div className="flex items-start gap-2.5">
            <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-[#5B4DFF]" fill="currentColor" strokeWidth={0} />
            <p className="text-[13.5px] font-medium italic leading-relaxed text-[#3D3564]">
              "The right tools make big things possible."
            </p>
          </div>
        </div>
      </aside>

      {/* ================================ overlays =============================== */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16182B]/40 p-4 backdrop-blur-[2px]"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[440px] rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_24px_60px_rgba(30,25,80,0.25)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[17px] font-bold tracking-tight text-[#111827]">
                  {modal.draft.id ? 'Edit Tool' : 'Add Tool'}
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F2F9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Name</label>
              <input
                autoFocus
                value={modal.draft.name}
                onChange={(e) => setModal({ draft: { ...modal.draft, name: e.target.value } })}
                placeholder="e.g. Notion Plus"
                className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
              />

              <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Description</label>
              <input
                value={modal.draft.desc}
                onChange={(e) => setModal({ draft: { ...modal.draft, desc: e.target.value } })}
                placeholder="Short description"
                className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
              />

              <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Category</label>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setModal({ draft: { ...modal.draft, category: c.key } })}
                    className={`rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                      modal.draft.category === c.key ? 'border-transparent text-white' : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
                    }`}
                    style={modal.draft.category === c.key ? { background: c.color } : undefined}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Price / month ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={modal.draft.price || ''}
                    onChange={(e) => setModal({ draft: { ...modal.draft, price: Number(e.target.value) || 0 } })}
                    placeholder="0.00"
                    className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Renewal date</label>
                  <input
                    type="date"
                    value={modal.draft.renewal}
                    onChange={(e) => setModal({ draft: { ...modal.draft, renewal: e.target.value } })}
                    className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModal(null)}
                  className="rounded-[10px] border border-[#E7E5F2] px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F6F5FB]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDraft}
                  className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {modal.draft.id ? 'Save changes' : 'Add tool'}
                </button>
              </div>
            </motion.div>
          </motion.div>
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

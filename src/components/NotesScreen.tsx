import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  User,
  Folder,
  Lightbulb,
  FileText,
  Link as LinkIcon,
  Archive,
  Bookmark,
  CheckSquare,
  FlaskConical,
  Leaf,
  Trophy,
  LayoutGrid,
  MoreHorizontal,
  Pin,
  Trash2,
  Pencil,
  Search,
  SlidersHorizontal,
  Plus,
  X,
  Check,
} from 'lucide-react'

/* --------------------------------- model ---------------------------------- */

type CategoryKey = 'college' | 'personal' | 'projects' | 'ideas' | 'research' | 'links'

type Note = {
  id: number
  title: string
  content: string
  category: CategoryKey
  tags: string[]
  icon: string
  pinned: boolean
  archived: boolean
  updatedAt: number
}

const HOUR = 3600000
const DAY = 24 * HOUR

const CATEGORIES: {
  key: CategoryKey
  label: string
  tabLabel: string
  icon: React.ElementType
  bg: string
  fg: string
}[] = [
  { key: 'college', label: 'College', tabLabel: 'Lecture Notes', icon: GraduationCap, bg: '#EFECFE', fg: '#6D4AFF' },
  { key: 'personal', label: 'Personal', tabLabel: 'Personal', icon: User, bg: '#EEECFE', fg: '#5B4DFF' },
  { key: 'projects', label: 'Projects', tabLabel: 'Projects', icon: Folder, bg: '#E7F0FF', fg: '#2F6DF6' },
  { key: 'ideas', label: 'Ideas', tabLabel: 'Ideas', icon: Lightbulb, bg: '#E4F6EC', fg: '#10B981' },
  { key: 'research', label: 'Research', tabLabel: 'Research', icon: FileText, bg: '#EFECFE', fg: '#6D4AFF' },
  { key: 'links', label: 'Links', tabLabel: 'Links', icon: LinkIcon, bg: '#EFECFE', fg: '#6D4AFF' },
]

const cat = (k: string) => CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[0]

const ICONS: Record<string, React.ElementType> = {
  filetext: FileText,
  bookmark: Bookmark,
  check: CheckSquare,
  flask: FlaskConical,
  link: LinkIcon,
  trophy: Trophy,
  leaf: Leaf,
  file: FileText,
}

const ICON_TINTS: Record<string, { bg: string; fg: string }> = {
  purple: { bg: '#EFECFE', fg: '#6D4AFF' },
  pink: { bg: '#FDE8F1', fg: '#EC4899' },
  green: { bg: '#E4F6EC', fg: '#10B981' },
  amber: { bg: '#FFF3E0', fg: '#D97706' },
  blue: { bg: '#E7F0FF', fg: '#2F6DF6' },
}

/* --------------------------------- seeds ---------------------------------- */

const now = Date.now()
let idSeq = 3000

const seedNotes = (): Note[] => [
  { id: idSeq++, title: 'Engineering Graphics Notes', content: 'Projection of planes, solids and isometric views. Important formulas and examples.', category: 'college', tags: ['Engineering Graphics'], icon: 'filetext', pinned: false, archived: false, updatedAt: now - 2 * HOUR },
  { id: idSeq++, title: 'Electron Devices Summary', content: 'Diodes, BJT, MOSFET characteristics and key formulas for end sem.', category: 'college', tags: ['Electron Devices'], icon: 'bookmark', pinned: false, archived: false, updatedAt: now - 5 * HOUR },
  { id: idSeq++, title: 'Project Ideas', content: 'AI based study planner\nEV tracking app\nSmart attendance system\n…', category: 'ideas', tags: ['Projects'], icon: 'filetext', pinned: false, archived: false, updatedAt: now - 1 * DAY },
  { id: idSeq++, title: 'To-Do / Goals', content: '- Complete lab records\n- Read research paper\n- Gym 5 days a week\n- Learn Flutter\n…', category: 'personal', tags: ['Goals'], icon: 'check', pinned: false, archived: false, updatedAt: now - 1 * DAY - HOUR },
  { id: idSeq++, title: 'Chemistry Notes', content: 'Unit 1: Atomic structure\nUnit 2: Chemical bonding\nUnit 3: Thermodynamics\n…', category: 'college', tags: ['Chemistry'], icon: 'flask', pinned: false, archived: false, updatedAt: now - 2 * DAY },
  { id: idSeq++, title: 'Important Links', content: 'Useful resources and links for projects, courses and competitions.', category: 'links', tags: ['Resources'], icon: 'link', pinned: false, archived: false, updatedAt: now - 3 * DAY },
  { id: idSeq++, title: 'Hackathon Plan', content: 'Team: Algorythms\nProblem statement ideas\nTech stack and timeline\n…', category: 'projects', tags: ['Hackathon'], icon: 'trophy', pinned: false, archived: false, updatedAt: now - 4 * DAY },
  { id: idSeq++, title: 'Environmental Science', content: 'Unit 1: Ecosystems\nUnit 2: Biodiversity\nUnit 3: Climate change', category: 'college', tags: ['Environmental Science'], icon: 'leaf', pinned: false, archived: false, updatedAt: now - 4 * DAY - HOUR },
  { id: idSeq++, title: 'Quick Notes', content: 'Random thoughts, ideas and reminders to revisit later.', category: 'personal', tags: [], icon: 'file', pinned: false, archived: false, updatedAt: now - 5 * DAY },
]

/* -------------------------------- storage --------------------------------- */

const STORAGE_KEY = 'zikzik-notes-v1'

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* corrupted storage → reseed */
  }
  const seeded = seedNotes()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  } catch {
    /* storage unavailable */
  }
  return seeded
}

/* ------------------------------ misc helpers ------------------------------ */

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Edited just now'
  if (mins < 60) return `Edited ${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Edited ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `Edited ${days} day${days === 1 ? '' : 's'} ago`
}

/* --------------------------------- editor --------------------------------- */

type Draft = {
  id?: number
  title: string
  content: string
  category: CategoryKey
  tags: string
  icon: string
  pinned: boolean
}

const emptyDraft = (): Draft => ({
  title: '',
  content: '',
  category: 'college',
  tags: '',
  icon: 'filetext',
  pinned: false,
})

function NoteModal({
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
  const tint = ICON_TINTS[tintForIconKey(draft.icon)]

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
        className="w-full max-w-[560px] rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_24px_60px_rgba(30,25,80,0.25)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[12px]"
              style={{ background: tint.bg }}
            >
              {(() => {
                const Icon = ICONS[draft.icon] ?? FileText
                return <Icon className="h-5 w-5" style={{ color: tint.fg }} strokeWidth={2} />
              })()}
            </span>
            <h3 className="text-[17px] font-bold tracking-tight text-[#111827]">
              {draft.id ? 'Edit note' : 'New Note'}
            </h3>
          </div>
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
          placeholder="Note title"
          className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[14px] font-semibold text-[#111827] outline-none focus:border-[#B9A7FF]"
        />

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Content</label>
        <textarea
          value={draft.content}
          onChange={(e) => set({ content: e.target.value })}
          rows={8}
          placeholder="Write your note… (line breaks are kept)"
          className="mb-3 w-full resize-none rounded-[10px] border border-[#E7E5F2] bg-white p-3 text-[13.5px] leading-relaxed text-[#111827] outline-none focus:border-[#B9A7FF]"
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

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Tags (comma separated)</label>
        <input
          value={draft.tags}
          onChange={(e) => set({ tags: e.target.value })}
          placeholder="e.g. Thermodynamics, Mid-sem"
          className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
        />

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Icon</label>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {Object.entries(ICONS).map(([key, Icon]) => {
            const t = ICON_TINTS[tintForIconKey(key)]
            return (
              <button
                key={key}
                onClick={() => set({ icon: key })}
                className={`flex h-9 w-9 items-center justify-center rounded-[10px] border-2 transition-all ${
                  draft.icon === key ? 'border-[#7C5BFF]' : 'border-transparent hover:border-[#E7E5F2]'
                }`}
                style={{ background: t.bg }}
                title={key}
              >
                <Icon className="h-4 w-4" style={{ color: t.fg }} strokeWidth={2} />
              </button>
            )
          })}
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
              {draft.id ? 'Save changes' : 'Create note'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ================================ the page ================================ */

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>(loadNotes)
  const [tab, setTab] = useState<'all' | CategoryKey | 'archive'>('all')
  const [query, setQuery] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [modal, setModal] = useState<{ draft: Draft; edit: boolean } | null>(null)
  const [cardMenu, setCardMenu] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  /* persist */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    } catch {
      /* storage unavailable */
    }
  }, [notes])

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  /* ------------------------------ derived ------------------------------- */

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    notes.forEach((n) => {
      const k = n.archived ? 'archive' : n.category
      m[k] = (m[k] ?? 0) + 1
    })
    return m
  }, [notes])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes
      .filter((n) => {
        if (pinnedOnly && !n.pinned) return false
        if (tab === 'all') return !n.archived
        if (tab === 'archive') return n.archived
        return !n.archived && n.category === tab
      })
      .filter((n) =>
        q
          ? n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return sortBy === 'recent' ? b.updatedAt - a.updatedAt : a.title.localeCompare(b.title)
      })
  }, [notes, tab, query, pinnedOnly, sortBy])

  const recent = useMemo(
    () => notes.filter((n) => !n.archived).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4),
    [notes],
  )

  /* -------------------------------- crud -------------------------------- */

  function saveDraft() {
    if (!modal) return
    const d = modal.draft
    if (!d.title.trim()) return
    const tags = d.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    if (d.id) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === d.id
            ? { ...n, title: d.title.trim(), content: d.content, category: d.category, tags, icon: d.icon, pinned: d.pinned, updatedAt: Date.now() }
            : n,
        ),
      )
      showToast('Note updated')
    } else {
      setNotes((prev) => [
        {
          id: idSeq++,
          title: d.title.trim(),
          content: d.content,
          category: d.category,
          tags,
          icon: d.icon,
          pinned: d.pinned,
          archived: false,
          updatedAt: Date.now(),
        },
        ...prev,
      ])
      showToast('Note created')
    }
    setModal(null)
  }

  function openEdit(n: Note) {
    setModal({
      edit: true,
      draft: {
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        tags: n.tags.join(', '),
        icon: n.icon,
        pinned: n.pinned,
      },
    })
    setCardMenu(null)
  }

  function togglePin(id: number) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)))
    setCardMenu(null)
    const t = notes.find((n) => n.id === id)
    showToast(t?.pinned ? 'Note unpinned' : 'Note pinned')
  }

  function toggleArchive(id: number) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, archived: !n.archived, pinned: false } : n)))
    setCardMenu(null)
    const t = notes.find((n) => n.id === id)
    showToast(t?.archived ? 'Note unarchived' : 'Note archived')
  }

  function deleteNote(id: number) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setCardMenu(null)
    showToast('Note deleted')
  }

  /* ------------------------------- render ------------------------------- */

  const tabs: { key: 'all' | CategoryKey; label: string; icon: React.ElementType }[] = [ // note: 'archive' handled via More menu
    { key: 'all', label: 'All', icon: LayoutGrid },
    ...CATEGORIES.slice(0, 5).map((c) => ({ key: c.key as 'all' | CategoryKey, label: c.tabLabel, icon: c.icon })),
  ]

  return (
    <div className="flex h-full min-h-0">
      {/* ============================== main column ============================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="shrink-0 px-6 pt-5 xl:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">Notes</h1>
              <p className="mt-0.5 text-[13.5px] text-[#6B7280]">
                Capture ideas, organize your thoughts, and never lose track.
              </p>
            </div>
            <button
              onClick={() => setModal({ edit: false, draft: emptyDraft() })}
              className="flex h-10 items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              New Note
            </button>
          </div>

          {/* category tabs */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                  tab === t.key
                    ? 'bg-[#16182B] text-white shadow-[0_3px_10px_rgba(22,24,43,0.25)]'
                    : 'border border-[#ECECF4] bg-white text-[#374151] hover:bg-[#F6F5FB]'
                }`}
              >
                <t.icon className="h-3.5 w-3.5" strokeWidth={2.1} />
                {t.label}
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setMoreOpen((o) => !o)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                  tab === 'links' || tab === 'archive'
                    ? 'bg-[#16182B] text-white'
                    : 'border-[#ECECF4] bg-white text-[#374151] hover:bg-[#F6F5FB]'
                }`}
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={2.1} />
                More
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="absolute left-0 top-full z-40 mt-1.5 w-44 rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                    >
                      {[...CATEGORIES.slice(5), { key: 'archive' as const, label: 'Archive', icon: Archive }].map((c) => (
                        <button
                          key={c.key}
                          onClick={() => {
                            setTab(c.key as 'links' | 'archive')
                            setMoreOpen(false)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                        >
                          <c.icon className="h-4 w-4 text-[#6B7280]" strokeWidth={2} />
                          {c.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* mobile search */}
          <div className="mt-4 flex h-10 items-center gap-2 rounded-[10px] border border-[#ECECF4] bg-white px-3 focus-within:border-[#B9A7FF] xl:hidden">
            <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your notes..."
              className="w-full bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search">
                <X className="h-4 w-4 text-[#9CA3AF]" />
              </button>
            )}
          </div>
        </div>

        {/* notes grid */}
        <div className="min-h-0 flex-1 px-6 py-4 xl:px-8">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-[#D9D6EA] bg-white/60 py-16 text-center">
              <FileText className="h-8 w-8 text-[#C4C4D4]" strokeWidth={1.6} />
              <p className="mt-3 text-[14px] font-semibold text-[#374151]">No notes found</p>
              <p className="mt-1 text-[12.5px] text-[#9CA3AF]">
                {query ? 'Try a different search.' : 'Create your first note to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((n) => {
                const c = cat(n.category)
                const Icon = ICONS[n.icon] ?? FileText
                const tint = ICON_TINTS[tintForIconKey(n.icon)]
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => openEdit(n)}
                    className={`group relative cursor-pointer rounded-[16px] border bg-white p-4 transition-all hover:-translate-y-[2px] hover:shadow-[0_10px_24px_rgba(70,60,140,0.10)] ${
                      n.pinned ? 'border-[#C9BCFF] shadow-[0_4px_14px_rgba(124,91,255,0.12)]' : 'border-[#ECECF4]'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-[12px]"
                        style={{ background: tint.bg }}
                      >
                        <Icon className="h-5 w-5" style={{ color: tint.fg }} strokeWidth={2} />
                      </span>
                      <span className="flex items-center gap-1">
                        {n.pinned && (
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5B4DFF]"
                            title="Pinned"
                          >
                            <Pin className="h-3.5 w-3.5 fill-[#5B4DFF]" />
                          </span>
                        )}
                        <span className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCardMenu(cardMenu === n.id ? null : n.id)
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
                            aria-label="Note options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <AnimatePresence>
                            {cardMenu === n.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setCardMenu(null) }} />
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.13 }}
                                  className="absolute right-0 top-full z-40 mt-1 w-40 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                                >
                                  <button
                                    onClick={(e) => { e.stopPropagation(); togglePin(n.id) }}
                                    className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                                  >
                                    <Pin className="h-3.5 w-3.5 text-[#6B7280]" />
                                    {n.pinned ? 'Unpin' : 'Pin'}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openEdit(n) }}
                                    className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-[#6B7280]" /> Edit
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleArchive(n.id) }}
                                    className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                                  >
                                    <Archive className="h-3.5 w-3.5 text-[#6B7280]" />
                                    {n.archived ? 'Unarchive' : 'Archive'}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteNote(n.id) }}
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

                    <h3 className="text-[15.5px] font-bold tracking-tight text-[#111827]">{n.title}</h3>
                    <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-[#6B7280] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden">
                      {n.content}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{ background: c.bg, color: c.fg }}
                      >
                        {c.label}
                      </span>
                      {n.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-[#E7F0FF] px-2 py-0.5 text-[10.5px] font-semibold text-[#2F6DF6]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 text-[11.5px] font-medium text-[#9CA3AF]">{timeAgo(n.updatedAt)}</div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================== right panel ============================== */}
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#ECECF4] bg-white p-4 xl:flex">
        {/* Search */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <h3 className="mb-3 text-[16.5px] font-bold tracking-tight text-[#111827]">Search Notes</h3>
          <div className="flex items-center gap-2">
            <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-[#E7E5F2] bg-white px-3 focus-within:border-[#B9A7FF]">
              <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your notes..."
                className="w-full bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear search">
                  <X className="h-4 w-4 text-[#9CA3AF]" />
                </button>
              )}
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className={`flex h-10 w-10 items-center justify-center rounded-[10px] border transition-colors ${
                  sortBy === 'title' || pinnedOnly
                    ? 'border-[#B9A7FF] bg-[#EEEDFC] text-[#5B4DFF]'
                    : 'border-[#E7E5F2] text-[#6B7280] hover:bg-[#F6F5FB]'
                }`}
                title="Sort & filter"
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
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
                      className="absolute right-0 top-full z-40 mt-1.5 w-48 rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                    >
                      {(
                        [
                          { key: 'recent', label: 'Recently edited' },
                          { key: 'title', label: 'Title A–Z' },
                        ] as const
                      ).map((s) => (
                        <button
                          key={s.key}
                          onClick={() => setSortBy(s.key)}
                          className="flex w-full items-center justify-between rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                        >
                          {s.label}
                          {sortBy === s.key && <Check className="h-4 w-4 text-[#5B4DFF]" strokeWidth={2.4} />}
                        </button>
                      ))}
                      <div className="my-1 border-t border-[#F0EFF7]" />
                      <button
                        onClick={() => setPinnedOnly((p) => !p)}
                        className="flex w-full items-center justify-between rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                      >
                        Pinned only
                        <span
                          className={`flex h-[16px] w-[16px] items-center justify-center rounded-[4px] border transition-colors ${
                            pinnedOnly
                              ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]'
                              : 'border-[#D5CFEE] bg-white'
                          }`}
                        >
                          {pinnedOnly && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.4} />}
                        </span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Categories</h3>
            <button
              onClick={() => setTab('all')}
              className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
              title="Show all notes"
            >
              Manage
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setTab((t) => (t === c.key ? 'all' : c.key))}
                className={`flex items-center gap-3 rounded-[10px] px-1.5 py-1.5 text-left transition-colors ${
                  tab === c.key ? 'bg-[#EEEDFC]' : 'hover:bg-[#F6F5FB]'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px]" style={{ background: c.bg }}>
                  <c.icon className="h-4 w-4" style={{ color: c.fg }} strokeWidth={2} />
                </span>
                <span className="flex-1 text-[13.5px] font-semibold text-[#111827]">{c.label}</span>
                <span className="rounded-full bg-[#F3F2F9] px-2 py-0.5 text-[11.5px] font-bold text-[#6B7280]">
                  {counts[c.key] ?? 0}
                </span>
              </button>
            ))}
            <button
              onClick={() => setTab((t) => (t === 'archive' ? 'all' : 'archive'))}
              className={`flex items-center gap-3 rounded-[10px] px-1.5 py-1.5 text-left transition-colors ${
                tab === 'archive' ? 'bg-[#EEEDFC]' : 'hover:bg-[#F6F5FB]'
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#F3F4F6]">
                <Archive className="h-4 w-4 text-[#6B7280]" strokeWidth={2} />
              </span>
              <span className="flex-1 text-[13.5px] font-semibold text-[#111827]">Archive</span>
              <span className="rounded-full bg-[#F3F2F9] px-2 py-0.5 text-[11.5px] font-bold text-[#6B7280]">
                {counts['archive'] ?? 0}
              </span>
            </button>
          </div>
        </div>

        {/* Recent Notes */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Recent Notes</h3>
            <button
              onClick={() => {
                setTab('all')
                setQuery('')
                setPinnedOnly(false)
              }}
              className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
            >
              View all
            </button>
          </div>
          <div className="mt-2 flex flex-col">
            {recent.map((n) => {
              const Icon = ICONS[n.icon] ?? FileText
              const tint = ICON_TINTS[tintForIconKey(n.icon)]
              return (
                <button
                  key={n.id}
                  onClick={() => openEdit(n)}
                  className="flex items-center gap-3 rounded-[10px] px-1.5 py-2 text-left transition-colors hover:bg-[#F6F5FB]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: tint.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: tint.fg }} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#111827]">{n.title}</span>
                    <span className="block text-[11.5px] text-[#9CA3AF]">{timeAgo(n.updatedAt)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Storage */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15.5px] font-bold tracking-tight text-[#111827]">Notes Storage</h3>
            <span className="text-[11.5px] font-medium text-[#9CA3AF]">{notes.length} / 100 notes</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFEDF8]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (notes.length / 100) * 100)}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-1.5 text-right text-[11.5px] font-semibold text-[#6B7280]">
            {Math.min(100, notes.length)}%
          </div>
        </div>
      </aside>

      {/* ================================ overlays =============================== */}
      <AnimatePresence>
        {modal && (
          <NoteModal
            draft={modal.draft}
            setDraft={(d) => setModal({ edit: modal.edit, draft: d })}
            onClose={() => setModal(null)}
            onSave={saveDraft}
            onDelete={
              modal.edit && modal.draft.id
                ? () => {
                    deleteNote(modal.draft.id!)
                    setModal(null)
                  }
                : undefined
            }
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

/* icon → tint mapping (kept outside component) */
function tintForIconKey(icon: string): string {
  const map: Record<string, string> = {
    filetext: 'purple',
    bookmark: 'pink',
    check: 'purple',
    flask: 'amber',
    link: 'purple',
    trophy: 'purple',
    leaf: 'green',
    file: 'purple',
  }
  return map[icon] ?? 'purple'
}

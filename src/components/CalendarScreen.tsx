import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Check,
  X,
  Trash2,
  MoreVertical,
  GraduationCap,
  Upload,
  LayoutGrid,
  MapPin,
} from 'lucide-react'

/* --------------------------------- model ---------------------------------- */

type ColorKey = 'purple' | 'blue' | 'pink' | 'green' | 'amber' | 'gray'

const PALETTE: Record<ColorKey, { bar: string; bg: string }> = {
  purple: { bar: '#7C5BFF', bg: '#EFECFE' },
  blue: { bar: '#2F6DF6', bg: '#E7F0FF' },
  pink: { bar: '#EC4899', bg: '#FDE8F1' },
  green: { bar: '#10B981', bg: '#E4F6EC' },
  amber: { bar: '#F59E0B', bg: '#FFF3E0' },
  gray: { bar: '#9CA3AF', bg: '#F3F4F6' },
}

const CATEGORIES: { key: string; label: string; color: ColorKey }[] = [
  { key: 'college', label: 'College Timetable', color: 'purple' },
  { key: 'personal', label: 'Personal Events', color: 'blue' },
  { key: 'tasks', label: 'Tasks / Deadlines', color: 'pink' },
  { key: 'health', label: 'Gym / Health', color: 'green' },
  { key: 'clubs', label: 'Clubs / Social', color: 'amber' },
  { key: 'others', label: 'Others', color: 'gray' },
]

const catLabel = (k: string) => CATEGORIES.find((c) => c.key === k)?.label ?? k
const catDot = (k: string) => PALETTE[CATEGORIES.find((c) => c.key === k)?.color ?? 'gray'].bar

type Ev = {
  id: number
  title: string
  location?: string
  category: string
  color: ColorKey
  recurring: boolean
  weekday?: number // 0 = Sun … 6 = Sat (recurring only)
  date?: string // yyyy-mm-dd (one-off only)
  start: number // minutes from midnight
  end: number
}

/* weekly college timetable (Mon = 1 … Sat = 6) */
const timetableSeeds: Omit<Ev, 'id' | 'recurring'>[] = [
  { title: 'Engineering Graphics', location: 'LT-1', category: 'college', color: 'purple', weekday: 1, start: 540, end: 600 },
  { title: 'Electron Devices', location: 'LT-3', category: 'college', color: 'blue', weekday: 1, start: 660, end: 720 },
  { title: 'Mathematics', location: 'LT-2', category: 'college', color: 'pink', weekday: 1, start: 780, end: 840 },
  { title: 'Engineering Design', location: 'LT-4', category: 'college', color: 'green', weekday: 1, start: 900, end: 960 },
  { title: 'Chemistry Lab', location: 'Lab-1', category: 'college', color: 'amber', weekday: 2, start: 540, end: 660 },
  { title: 'English', location: 'LT-2', category: 'college', color: 'purple', weekday: 2, start: 780, end: 840 },
  { title: 'Environmental Science', location: 'LT-3', category: 'college', color: 'blue', weekday: 2, start: 900, end: 960 },
  { title: 'Engineering Graphics', location: 'LT-1', category: 'college', color: 'purple', weekday: 3, start: 540, end: 600 },
  { title: 'Electron Devices', location: 'LT-3', category: 'college', color: 'blue', weekday: 3, start: 660, end: 720 },
  { title: 'Mathematics', location: 'LT-2', category: 'college', color: 'pink', weekday: 3, start: 780, end: 840 },
  { title: 'Engineering Design', location: 'LT-4', category: 'college', color: 'green', weekday: 3, start: 900, end: 960 },
  { title: 'Physics Lab', location: 'Lab-2', category: 'college', color: 'green', weekday: 4, start: 540, end: 660 },
  { title: 'English', location: 'LT-2', category: 'college', color: 'purple', weekday: 4, start: 780, end: 840 },
  { title: 'Library', category: 'others', color: 'gray', weekday: 4, start: 900, end: 960 },
  { title: 'Environmental Science', location: 'LT-3', category: 'college', color: 'blue', weekday: 5, start: 540, end: 600 },
  { title: 'Electron Devices', location: 'LT-3', category: 'college', color: 'blue', weekday: 5, start: 660, end: 720 },
  { title: 'Mathematics', location: 'LT-2', category: 'college', color: 'pink', weekday: 5, start: 780, end: 840 },
  { title: 'Project Discussion', location: 'Lab-1', category: 'college', color: 'amber', weekday: 5, start: 900, end: 960 },
  { title: 'Gym', category: 'health', color: 'pink', weekday: 3, start: 1020, end: 1080 },
]

/* this week's one-off events (Sat Sep 12 / Sun Sep 13, 2026) */
const personalSeeds: Omit<Ev, 'id' | 'recurring'>[] = [
  { title: 'Club Meeting', location: 'Main Block', category: 'clubs', color: 'pink', date: '2026-09-12', start: 600, end: 660 },
  { title: 'Self Study', location: 'Library', category: 'personal', color: 'blue', date: '2026-09-12', start: 780, end: 900 },
  { title: 'Football', location: 'Ground', category: 'health', color: 'green', date: '2026-09-13', start: 1020, end: 1080 },
]

/* ------------------------------ date helpers ------------------------------ */

const DAY = 86400000
const HOUR_H = 52 // px per hour in the grid
const DAY_START = 8 * 60 // 8:00 AM
const DAY_END = 22 * 60 // 10:00 PM

function startOfWeek(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

function iso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function sameDay(a: Date, b: Date) {
  return iso(a) === iso(b)
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

function minsToTimeInput(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function timeInputToMins(v: string) {
  const [h, m] = v.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/* --------------------------------- seeds ---------------------------------- */

let idSeq = 1000
const buildSeeds = (): Ev[] => [
  ...timetableSeeds.map((t) => ({ ...t, id: idSeq++, recurring: true })),
  ...personalSeeds.map((t) => ({ ...t, id: idSeq++, recurring: false })),
]

/* ------------------------------ mini calendar ----------------------------- */

function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: Date
  onSelect: (d: Date) => void
}) {
  const [monthAnchor, setMonthAnchor] = useState(new Date(selected))
  const today = new Date()

  useEffect(() => setMonthAnchor(new Date(selected)), [selected])

  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1)
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - first.getDay()) // Sunday start
  const cells = Array.from({ length: 35 }, (_, i) => addDays(gridStart, i))

  return (
    <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">
          {MONTHS[first.getMonth()]} {first.getFullYear()}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setMonthAnchor(new Date(first.getFullYear(), first.getMonth() - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F2F9]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMonthAnchor(new Date(first.getFullYear(), first.getMonth() + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F2F9]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="pb-2 text-[11px] font-semibold text-[#9CA3AF]">
            {d}
          </span>
        ))}
        {cells.map((d) => {
          const out = d.getMonth() !== first.getMonth()
          const isSel = sameDay(d, selected)
          const isToday = sameDay(d, today)
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelect(d)}
              className={`mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
                isSel
                  ? 'bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF] font-bold text-white shadow-[0_3px_8px_rgba(124,91,255,0.35)]'
                  : isToday
                    ? 'text-[#5B4DFF] ring-1 ring-[#7C5BFF]'
                    : out
                      ? 'text-[#C4C4D4] hover:bg-[#F3F2F9]'
                      : 'text-[#374151] hover:bg-[#F3F2F9]'
              }`}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------------------------- modal --------------------------------- */

type Draft = {
  id?: number
  title: string
  category: string
  color: ColorKey
  recurring: boolean
  weekday: number
  date: string
  start: string
  end: string
  location: string
}

const emptyDraft = (preset: Partial<Draft> = {}): Draft => ({
  title: '',
  category: 'personal',
  color: 'blue',
  recurring: false,
  weekday: 1,
  date: iso(new Date()),
  start: '09:00',
  end: '10:00',
  location: '',
  ...preset,
})

function EventModal({
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
            {draft.id ? 'Edit event' : draft.recurring ? 'Add class' : 'Add event'}
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
          placeholder="e.g. Mathematics"
          className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
        />

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Category</label>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => set({ category: c.key, color: c.color })}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                draft.category === c.key
                  ? 'border-[#B9A7FF] bg-[#EEEDFC] text-[#5B4DFF]'
                  : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: catDot(c.key) }} />
              {c.label}
            </button>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Starts</label>
            <input
              type="time"
              value={draft.start}
              onChange={(e) => set({ start: e.target.value })}
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Ends</label>
            <input
              type="time"
              value={draft.end}
              onChange={(e) => set({ end: e.target.value })}
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
            />
          </div>
        </div>

        <label className="mb-1.5 flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-[#374151]">
          <button
            type="button"
            onClick={() => set({ recurring: !draft.recurring })}
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors ${
              draft.recurring ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]' : 'border-[#D5CFEE] bg-white'
            }`}
          >
            {draft.recurring && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </button>
          Repeats weekly (college timetable)
        </label>

        {draft.recurring ? (
          <div className="mb-3">
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Day of week</label>
            <div className="flex gap-1">
              {WEEKDAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => set({ weekday: i })}
                  className={`h-9 flex-1 rounded-[9px] text-[12px] font-semibold transition-colors ${
                    draft.weekday === i
                      ? 'bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF] text-white'
                      : 'border border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Date</label>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => set({ date: e.target.value })}
              className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
            />
          </div>
        )}

        <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Location (optional)</label>
        <input
          value={draft.location}
          onChange={(e) => set({ location: e.target.value })}
          placeholder="e.g. LT-1, Lab-2, Library"
          className="mb-4 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
        />

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
              {draft.id ? 'Save changes' : 'Create'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------- import modal ------------------------------ */

const SAMPLE_IMPORT = `Numerical Methods, Mon, 14:00, 15:00, LT-5
Seminar, Thu, 14:00, 15:00, Seminar Hall
Chemistry Lab (Section B), Fri, 14:00, 16:00, Lab-2`

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (n: number) => void }) {
  const [text, setText] = useState(SAMPLE_IMPORT)

  function parse() {
    let count = 0
    text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const [title, day, start, end, location] = line.split(',').map((s) => s.trim())
        const wd = WEEKDAYS.findIndex((d) => d.toLowerCase() === (day || '').toLowerCase())
        const s = timeInputToMins(start || '')
        const e = timeInputToMins(end || '')
        if (title && wd >= 0 && e > s) {
          window.dispatchEvent(
            new CustomEvent('zikzik-import-entry', {
              detail: { title, weekday: wd, start: s, end: e, location: location || undefined },
            }),
          )
          count++
        }
      })
    if (count > 0) onImport(count)
  }

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
        className="w-full max-w-[480px] rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_24px_60px_rgba(30,25,80,0.25)]"
      >
        <div className="mb-1 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EEEDFC]">
            <Upload className="h-5 w-5 text-[#5B4DFF]" strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-[17px] font-bold tracking-tight text-[#111827]">Import Timetable</h3>
            <p className="text-[12px] text-[#9CA3AF]">From college portal / file — one class per line</p>
          </div>
        </div>
        <p className="mb-2 mt-3 text-[12px] font-medium text-[#6B7280]">
          Format: <span className="font-semibold text-[#374151]">Title, Day, HH:MM, HH:MM, Room</span>
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full resize-none rounded-[10px] border border-[#E7E5F2] bg-[#FBFAFE] p-3 font-mono text-[12px] leading-relaxed text-[#111827] outline-none focus:border-[#B9A7FF]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-[10px] border border-[#E7E5F2] px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F6F5FB]"
          >
            Cancel
          </button>
          <button
            onClick={parse}
            className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Import
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ================================ the page ================================ */

export default function CalendarScreen() {
  const [view, setView] = useState<'week' | 'month' | 'day' | 'agenda'>('week')
  const [selected, setSelected] = useState(() => startOfWeek(new Date()))
  const [events, setEvents] = useState<Ev[]>(buildSeeds)
  const [filters, setFilters] = useState<string[]>(CATEGORIES.map((c) => c.key))
  const [modal, setModal] = useState<{ draft: Draft; edit: boolean } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [addMenu, setAddMenu] = useState(false)
  const [rowMenu, setRowMenu] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const today = new Date()

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }

  /* import listener */
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<Ev, 'id' | 'recurring' | 'category' | 'color'>
      setEvents((prev) => [
        ...prev,
        { ...d, id: idSeq++, recurring: true, category: 'college', color: 'purple' },
      ])
    }
    window.addEventListener('zikzik-import-entry', h)
    return () => window.removeEventListener('zikzik-import-entry', h)
  }, [])

  const visible = useMemo(() => events.filter((e) => filters.includes(e.category)), [events, filters])

  function occurrencesOn(d: Date) {
    const wd = d.getDay()
    const key = iso(d)
    return visible
      .filter((e) => (e.recurring ? e.weekday === wd : e.date === key))
      .sort((a, b) => a.start - b.start)
  }

  /* ---------------------------- crud + moving ---------------------------- */

  function saveDraft() {
    if (!modal) return
    const d = modal.draft
    if (!d.title.trim()) return
    let start = timeInputToMins(d.start)
    let end = timeInputToMins(d.end)
    if (end <= start) end = start + 60
    const base: Ev = {
      id: d.id ?? idSeq++,
      title: d.title.trim(),
      location: d.location.trim() || undefined,
      category: d.category,
      color: d.color,
      recurring: d.recurring,
      weekday: d.recurring ? d.weekday : undefined,
      date: d.recurring ? undefined : d.date,
      start,
      end,
    }
    setEvents((prev) => (d.id ? prev.map((e) => (e.id === d.id ? base : e)) : [...prev, base]))
    setModal(null)
    showToast(d.id ? 'Changes saved' : 'Event created')
  }

  function deleteEvent(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setModal(null)
    setRowMenu(null)
    showToast('Event deleted')
  }

  function moveTo(id: number, dayDate: Date, clientY: number, colEl: HTMLElement) {
    const ev = events.find((e) => e.id === id)
    if (!ev) return
    const rect = colEl.getBoundingClientRect()
    const offset = clientY - rect.top
    const rawMin = DAY_START + Math.round(offset / (HOUR_H / 60) / 30) * 30
    const dur = ev.end - ev.start
    const start = Math.min(Math.max(rawMin, DAY_START), DAY_END - dur)
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? e.recurring
            ? { ...e, weekday: dayDate.getDay(), start, end: start + dur }
            : { ...e, date: iso(dayDate), start, end: start + dur }
          : e,
      ),
    )
    showToast(`Moved to ${WEEKDAYS[dayDate.getDay()]} ${minsToLabel(start)}`)
  }

  /* ------------------------------- views nav ------------------------------ */

  function step(dir: 1 | -1) {
    const s = new Date(selected)
    if (view === 'week' || view === 'agenda') s.setDate(s.getDate() + dir * 7)
    else if (view === 'day') s.setDate(s.getDate() + dir)
    else s.setMonth(s.getMonth() + dir)
    setSelected(s)
  }

  function goToday() {
    setSelected(startOfWeek(new Date()))
    showToast('Jumped to today')
  }

  function rangeLabel() {
    if (view === 'month') return `${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    if (view === 'day')
      return selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    const w = startOfWeek(selected)
    const e = addDays(w, 6)
    const f = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`
    return `${f(w)} – ${f(e)}, ${e.getFullYear()}`
  }

  const weekDates = useMemo(() => {
    const w = startOfWeek(selected)
    return Array.from({ length: 7 }, (_, i) => addDays(w, i))
  }, [selected])

  const monthGrid = useMemo(() => {
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1)
    const start = startOfWeek(first)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [selected])

  const agendaDays = useMemo(
    () => Array.from({ length: 21 }, (_, i) => addDays(startOfWeek(selected), i)),
    [selected],
  )

  const todayEvents = occurrencesOn(today)

  /* -------------------------------- render -------------------------------- */

  const views: { key: typeof view; label: string }[] = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'day', label: 'Day' },
    { key: 'agenda', label: 'Agenda' },
  ]

  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START + i * 60)

  function renderTimeGrid(days: Date[]) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-[#ECECF4] bg-white">
        {/* header */}
        <div
          className="grid shrink-0 border-b border-[#ECECF4]"
          style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="flex items-end justify-center pb-2 pt-3 text-[11.5px] font-semibold text-[#9CA3AF]">
            Time
          </div>
          {days.map((d) => {
            const isToday = sameDay(d, today)
            return (
              <div
                key={d.toISOString()}
                className={`flex flex-col items-center py-2.5 ${
                  isToday ? 'bg-[#EEEDFC]' : ''
                }`}
              >
                <span
                  className={`text-[13px] font-bold ${isToday ? 'text-[#5B4DFF]' : 'text-[#111827]'}`}
                >
                  {WEEKDAYS[d.getDay()]}
                </span>
                <span
                  className={`mt-0.5 text-[11px] font-medium ${
                    isToday ? 'text-[#5B4DFF]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {MONTHS[d.getMonth()].slice(0, 3)} {d.getDate()}
                </span>
              </div>
            )
          })}
        </div>
        {/* body */}
        <div className="min-h-0 flex-1 overflow-auto py-2.5">
          <div
            className="grid min-w-[820px]"
            style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(120px, 1fr))` }}
          >
            {/* gutter */}
            <div>
              {hours.map((h) => (
                <div key={h} className="relative border-t border-[#F0EFF7] first:border-t-0" style={{ height: HOUR_H }}>
                  <span className="absolute -top-2 right-2 text-[10.5px] font-medium text-[#9CA3AF]">
                    {minsToLabel(h)}
                  </span>
                </div>
              ))}
            </div>
            {/* day columns */}
            {days.map((d) => {
              const evs = occurrencesOn(d)
              const isToday = sameDay(d, today)
              return (
                <div
                  key={d.toISOString()}
                  className={`relative border-l border-[#F0EFF7] ${isToday ? 'bg-[#FAF9FF]' : ''}`}
                  style={{ minHeight: hours.length * HOUR_H }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const id = Number(e.dataTransfer.getData('text/plain'))
                    if (id) moveTo(id, d, e.clientY, e.currentTarget)
                  }}
                >
                  {hours.map((h) => (
                    <div key={h} className="border-t border-[#F0EFF7] first:border-t-0" style={{ height: HOUR_H }} />
                  ))}
                  {evs.map((ev) => (
                    <div
                      key={ev.id}
                      className="absolute left-1 right-1"
                      style={{
                        top: ((ev.start - DAY_START) / 60) * HOUR_H + 1,
                        height: Math.max(((ev.end - ev.start) / 60) * HOUR_H - 4, 26),
                      }}
                    >
                      <div
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(ev.id))}
                        onClick={() => {
                          setModal({
                            edit: true,
                            draft: {
                              id: ev.id,
                              title: ev.title,
                              category: ev.category,
                              color: ev.color,
                              recurring: ev.recurring,
                              weekday: ev.weekday ?? 1,
                              date: ev.date ?? iso(d),
                              start: minsToTimeInput(ev.start),
                              end: minsToTimeInput(ev.end),
                              location: ev.location ?? '',
                            },
                          })
                        }}
                        className="absolute inset-0 cursor-grab select-none overflow-hidden rounded-[8px] border-l-[3px] px-2 py-1 shadow-[0_1px_3px_rgba(40,35,90,0.08)] transition-shadow hover:shadow-[0_4px_12px_rgba(40,35,90,0.15)] active:cursor-grabbing"
                        style={{ background: PALETTE[ev.color].bg, borderLeftColor: PALETTE[ev.color].bar }}
                        title={`${ev.title} · ${minsToLabel(ev.start)} – ${minsToLabel(ev.end)}${ev.location ? ` · ${ev.location}` : ''}`}
                      >
                        <div className="truncate text-[11.5px] font-semibold leading-tight text-[#1F2937]">
                          {ev.title}
                        </div>
                        {ev.end - ev.start >= 60 && (
                          <>
                            <div className="truncate text-[10px] font-medium text-[#374151]">
                              {minsToLabel(ev.start)} – {minsToLabel(ev.end)}
                            </div>
                            {ev.location && (
                              <div className="truncate text-[10px] text-[#6B7280]">{ev.location}</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0">
      {/* ============================== main column ============================== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* heading + controls */}
        <div className="shrink-0 px-6 pt-5 xl:px-8">
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">Calendar</h1>
          <p className="mt-0.5 text-[13.5px] text-[#6B7280]">
            Manage your college timetable, events and stay on track.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {views.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`rounded-[10px] px-4 py-2 text-[13px] font-semibold transition-all ${
                    view === v.key
                      ? 'bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)]'
                      : 'border border-[#ECECF4] bg-white text-[#374151] hover:bg-[#F6F5FB]'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={() => step(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#ECECF4] bg-white text-[#374151] transition-colors hover:bg-[#F6F5FB]"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => step(1)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#ECECF4] bg-white text-[#374151] transition-colors hover:bg-[#F6F5FB]"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={goToday}
                className="h-9 rounded-[10px] border border-[#ECECF4] bg-white px-4 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F6F5FB]"
              >
                Today
              </button>
              <span className="px-1 text-[14px] font-bold text-[#111827]">{rangeLabel()}</span>

              <div className="relative">
                <div className="flex overflow-hidden rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] shadow-[0_4px_12px_rgba(106,79,255,0.3)]">
                  <button
                    onClick={() => setModal({ edit: false, draft: emptyDraft({ date: iso(today) }) })}
                    className="flex items-center gap-1.5 py-2 pl-3.5 pr-2.5 text-[13px] font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.4} />
                    Add Event
                  </button>
                  <button
                    onClick={() => setAddMenu((o) => !o)}
                    className="flex items-center border-l border-white/25 px-2 text-white"
                    aria-label="More create options"
                  >
                    <ChevronDown />
                  </button>
                </div>
                <AnimatePresence>
                  {addMenu && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setAddMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                      >
                        {[
                          { label: 'Add Event', icon: Plus, d: { recurring: false } as Partial<Draft> },
                          { label: 'Add Class', icon: GraduationCap, d: { recurring: true, category: 'college', color: 'purple' as ColorKey } },
                        ].map((it) => (
                          <button
                            key={it.label}
                            onClick={() => {
                              setModal({ edit: false, draft: emptyDraft({ date: iso(today), ...it.d }) })
                              setAddMenu(false)
                            }}
                            className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                          >
                            <it.icon className="h-4 w-4 text-[#6B7280]" strokeWidth={2} />
                            {it.label}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setImportOpen(true)
                            setAddMenu(false)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                        >
                          <Upload className="h-4 w-4 text-[#6B7280]" strokeWidth={2} />
                          Import Timetable
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* view body */}
        <div className="min-h-0 flex-1 px-6 pb-3 pt-4 xl:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="h-full min-h-0"
            >
              {(view === 'week' || view === 'day') && renderTimeGrid(view === 'week' ? weekDates : [selected])}

              {view === 'month' && (
                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border border-[#ECECF4] bg-white">
                  <div className="grid shrink-0 grid-cols-7 border-b border-[#ECECF4]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                      <div key={d} className="py-2.5 text-center text-[12px] font-bold text-[#374151]">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
                    {monthGrid.map((d) => {
                      const evs = occurrencesOn(d)
                      const out = d.getMonth() !== selected.getMonth()
                      const isToday = sameDay(d, today)
                      return (
                        <button
                          key={d.toISOString()}
                          onClick={() => {
                            setSelected(d)
                            setView('day')
                          }}
                          className={`flex flex-col items-stretch gap-1 overflow-hidden border-b border-r border-[#F0EFF7] p-1.5 text-left transition-colors ${
                            out ? 'bg-[#FBFBFD]' : 'bg-white hover:bg-[#FAF9FF]'
                          }`}
                        >
                          <span
                            className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11.5px] font-semibold ${
                              isToday
                                ? 'bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF] text-white'
                                : out
                                  ? 'text-[#C4C4D4]'
                                  : 'text-[#374151]'
                            }`}
                          >
                            {d.getDate()}
                          </span>
                          {evs.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className="flex items-center gap-1 truncate rounded-[5px] px-1 py-[2px] text-[10.5px] font-medium"
                              style={{ background: PALETTE[ev.color].bg, color: '#1F2937' }}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: PALETTE[ev.color].bar }}
                              />
                              <span className="truncate">{ev.title}</span>
                            </span>
                          ))}
                          {evs.length > 3 && (
                            <span className="px-1 text-[10px] font-semibold text-[#5B4DFF]">
                              +{evs.length - 3} more
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {view === 'agenda' && (
                <div className="h-full min-h-0 overflow-y-auto rounded-[16px] border border-[#ECECF4] bg-white p-5">
                  {agendaDays.filter((d) => occurrencesOn(d).length > 0).length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <LayoutGrid className="h-7 w-7 text-[#C4C4D4]" strokeWidth={1.6} />
                      <p className="mt-3 text-[13.5px] font-medium text-[#9CA3AF]">
                        Nothing scheduled in the next three weeks.
                      </p>
                    </div>
                  )}
                  {agendaDays.map((d) => {
                    const evs = occurrencesOn(d)
                    if (evs.length === 0) return null
                    const isToday = sameDay(d, today)
                    const label = isToday
                      ? 'Today'
                      : sameDay(d, addDays(today, 1))
                        ? 'Tomorrow'
                        : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                    return (
                      <div key={d.toISOString()} className="mb-4 last:mb-0">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span
                            className={`text-[13px] font-bold ${isToday ? 'text-[#5B4DFF]' : 'text-[#111827]'}`}
                          >
                            {label}
                          </span>
                          {isToday && (
                            <span className="rounded-full bg-[#EEEDFC] px-2 py-0.5 text-[10px] font-semibold text-[#5B4DFF]">
                              {evs.length} events
                            </span>
                          )}
                        </div>
                        <div className="overflow-hidden rounded-[12px] border border-[#ECECF4]">
                          {evs.map((ev, i) => (
                            <button
                              key={ev.id}
                              onClick={() =>
                                setModal({
                                  edit: true,
                                  draft: {
                                    id: ev.id,
                                    title: ev.title,
                                    category: ev.category,
                                    color: ev.color,
                                    recurring: ev.recurring,
                                    weekday: ev.weekday ?? 1,
                                    date: ev.date ?? iso(d),
                                    start: minsToTimeInput(ev.start),
                                    end: minsToTimeInput(ev.end),
                                    location: ev.location ?? '',
                                  },
                                })
                              }
                              className={`flex w-full items-center gap-3 bg-white px-3.5 py-2.5 text-left transition-colors hover:bg-[#FAF9FF] ${
                                i > 0 ? 'border-t border-[#F0EFF7]' : ''
                              }`}
                            >
                              <span
                                className="w-1 self-stretch rounded-full"
                                style={{ background: PALETTE[ev.color].bar }}
                              />
                              <span className="w-[120px] shrink-0 text-[12px] font-semibold text-[#6B7280]">
                                {minsToLabel(ev.start)} – {minsToLabel(ev.end)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-semibold text-[#111827]">
                                  {ev.title}
                                </span>
                                {ev.location && (
                                  <span className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#9CA3AF]">
                                    <MapPin className="h-3 w-3" /> {ev.location}
                                  </span>
                                )}
                              </span>
                              {ev.recurring && (
                                <span className="shrink-0 rounded-full bg-[#F3F2F9] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                                  Weekly
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* quick action cards */}
        <div className="grid shrink-0 grid-cols-1 gap-3 px-6 pb-5 sm:grid-cols-2 xl:grid-cols-4 xl:px-8">
          {[
            {
              title: 'Add Event',
              desc: 'Create a new event',
              icon: Plus,
              action: () => setModal({ edit: false, draft: emptyDraft({ date: iso(today) }) }),
            },
            {
              title: 'Add Class',
              desc: 'Add to timetable',
              icon: GraduationCap,
              action: () =>
                setModal({
                  edit: false,
                  draft: emptyDraft({ recurring: true, category: 'college', color: 'purple' }),
                }),
            },
            {
              title: 'Import Timetable',
              desc: 'From college portal / file',
              icon: Upload,
              action: () => setImportOpen(true),
            },
            {
              title: 'View Schedules',
              desc: 'See all your schedules',
              icon: LayoutGrid,
              action: () => setView('agenda'),
            },
          ].map((c) => (
            <button
              key={c.title}
              onClick={c.action}
              className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4 text-left shadow-[0_1px_4px_rgba(70,60,140,0.05)] transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(70,60,140,0.10)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#EEEDFC]">
                <c.icon className="h-5 w-5 text-[#5B4DFF]" strokeWidth={2} />
              </span>
              <span>
                <span className="block text-[14px] font-bold text-[#111827]">{c.title}</span>
                <span className="block text-[12px] text-[#9CA3AF]">{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================== right panel ============================== */}
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#ECECF4] bg-white p-4 xl:flex">
        <MiniCalendar
          selected={selected}
          onSelect={(d) => {
            setSelected(d)
          }}
        />

        {/* Event Types */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Event Types</h3>
            <button
              onClick={() => setFilters(CATEGORIES.map((c) => c.key))}
              className="rounded-full bg-[#EEEDFC] px-3 py-1 text-[12px] font-semibold text-[#5B4DFF] transition-colors hover:bg-[#E2DCFC]"
              title="Show all event types"
            >
              Manage
            </button>
          </div>
          <p className="mb-3 text-[12px] text-[#9CA3AF]">Manage what to show</p>
          <div className="flex flex-col gap-2.5">
            {CATEGORIES.map((c) => {
              const on = filters.includes(c.key)
              return (
                <button
                  key={c.key}
                  onClick={() =>
                    setFilters((prev) => (on ? prev.filter((k) => k !== c.key) : [...prev, c.key]))
                  }
                  className="flex items-center gap-2.5 text-left"
                >
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors ${
                      on ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]' : 'border-[#D5CFEE] bg-white'
                    }`}
                  >
                    {on && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: catDot(c.key) }} />
                  <span className="text-[13.5px] font-medium text-[#1F2937]">{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Today */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="mb-0.5 flex items-start justify-between">
            <div>
              <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">
                Today · {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="mt-0.5 text-[12px] text-[#9CA3AF]">
                {todayEvents.length} event{todayEvents.length === 1 ? '' : 's'}
              </p>
            </div>
            <button
              onClick={() => setModal({ edit: false, draft: emptyDraft({ date: iso(today) }) })}
              className="flex items-center gap-1 rounded-full bg-[#EEEDFC] px-3 py-1.5 text-[12px] font-semibold text-[#5B4DFF] transition-colors hover:bg-[#E2DCFC]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-col">
            {todayEvents.length === 0 && (
              <p className="py-4 text-center text-[12.5px] text-[#9CA3AF]">Nothing scheduled today.</p>
            )}
            {todayEvents.map((ev) => (
              <div key={ev.id} className="group flex items-start gap-2.5 py-2">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: PALETTE[ev.color].bar }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-[#111827]">{ev.title}</div>
                  <div className="mt-0.5 text-[12px] text-[#6B7280]">
                    {minsToLabel(ev.start)} – {minsToLabel(ev.end)}
                  </div>
                  {ev.location && <div className="text-[11.5px] text-[#9CA3AF]">{ev.location}</div>}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setRowMenu(rowMenu === ev.id ? null : ev.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
                    aria-label="Event options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {rowMenu === ev.id && (
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
                              setRowMenu(null)
                              setModal({
                                edit: true,
                                draft: {
                                  id: ev.id,
                                  title: ev.title,
                                  category: ev.category,
                                  color: ev.color,
                                  recurring: ev.recurring,
                                  weekday: ev.weekday ?? today.getDay(),
                                  date: ev.date ?? iso(today),
                                  start: minsToTimeInput(ev.start),
                                  end: minsToTimeInput(ev.end),
                                  location: ev.location ?? '',
                                },
                              })
                            }}
                            className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-[#6B7280]" /> Edit
                          </button>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ================================ overlays =============================== */}
      <AnimatePresence>
        {modal && (
          <EventModal
            draft={modal.draft}
            setDraft={(d) => setModal({ edit: modal.edit, draft: d })}
            onClose={() => setModal(null)}
            onSave={saveDraft}
            onDelete={modal.edit && modal.draft.id ? () => deleteEvent(modal.draft.id!) : undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importOpen && (
          <ImportModal
            onClose={() => setImportOpen(false)}
            onImport={(n) => {
              setImportOpen(false)
              showToast(`Imported ${n} class${n === 1 ? '' : 'es'} to your timetable`)
            }}
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

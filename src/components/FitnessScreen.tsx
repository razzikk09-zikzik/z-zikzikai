import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale,
  Flame,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Plus,
  Search,
  Trash2,
  MoreVertical,
  X,
  Check,
  ScanLine,
  Dumbbell,
  PieChart,
  Sparkle,
  LayoutGrid,
  UtensilsCrossed,
  TrendingUp,
  CalendarDays,
  ListChecks,
} from 'lucide-react'

/* --------------------------------- model ---------------------------------- */

type Goals = {
  weightGoal: number
  heightCm: number
  dailyCalories: number
  protein: number
  carbs: number
  fat: number
  weeklyWorkouts: number
}

type FoodEntry = { id: number; time: string; name: string; emoji: string; serving: string; kcal: number; p: number; c: number; f: number }
type WeightPoint = { date: string; kg: number }
type Workout = { id: number; date: string; type: string; mins: number }

type FitnessData = {
  goals: Goals
  weightLog: WeightPoint[]
  foodLog: Record<string, FoodEntry[]>
  workouts: Workout[]
}

/* -------------------------------- helpers --------------------------------- */

const DAY = 86400000
let idSeq = 7000

function iso(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function startOfWeek(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}
function fmtClock(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function fmtDayLong(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateShort(dateIso: string) {
  return new Date(dateIso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function bmiOf(kg: number, cm: number) {
  if (!kg || !cm) return 0
  return kg / (cm / 100) ** 2
}
function bmiLabel(v: number) {
  if (v < 18.5) return { label: 'Underweight', bg: '#FFF3E0', fg: '#D97706' }
  if (v < 25) return { label: 'Healthy', bg: '#E4F6EC', fg: '#10B981' }
  if (v < 30) return { label: 'Overweight', bg: '#FFF3E0', fg: '#D97706' }
  return { label: 'Obese', bg: '#FDE8EC', fg: '#E11D48' }
}

/* --------------------------------- seeds ---------------------------------- */

function seedData(): FitnessData {
  const goals: Goals = { weightGoal: 52, heightCm: 177, dailyCalories: 2800, protein: 160, carbs: 350, fat: 90, weeklyWorkouts: 5 }

  // ~3 months of daily weights 48.0 → 49.8 with gentle jitter
  const weightLog: WeightPoint[] = []
  const start = new Date(TODAY0.getTime() - 89 * DAY)
  for (let i = 0; i <= 89; i++) {
    const d = new Date(start.getTime() + i * DAY)
    const base = 48 + 1.8 * (i / 89)
    const jitter = Math.sin(i * 1.7) * 0.12 + Math.cos(i * 0.6) * 0.08
    let kg = +(base + jitter).toFixed(1)
    if (i === 89) kg = 49.8
    weightLog.push({ date: iso(d), kg })
  }

  // food logs for the last 12 days (today uses the exact reference rows)
  const foodLog: Record<string, FoodEntry[]> = {}
  const pool: Omit<FoodEntry, 'id' | 'time'>[] = [
    { name: 'Oats', emoji: '🥣', serving: '60 g', kcal: 228, p: 8, c: 40, f: 4 },
    { name: 'Chicken Breast', emoji: '🍗', serving: '150 g', kcal: 248, p: 46, c: 0, f: 5 },
    { name: 'Rice (cooked)', emoji: '🍚', serving: '200 g', kcal: 260, p: 5, c: 56, f: 1 },
    { name: 'Banana', emoji: '🍌', serving: '1 medium', kcal: 105, p: 1, c: 27, f: 0 },
    { name: 'Whey Protein', emoji: '🥛', serving: '1 scoop (30 g)', kcal: 120, p: 24, c: 3, f: 1 },
    { name: 'Coffee with Milk', emoji: '☕', serving: '1 cup', kcal: 150, p: 6, c: 15, f: 4 },
    { name: 'Almonds', emoji: '🌰', serving: '28 g', kcal: 170, p: 6, c: 6, f: 15 },
    { name: 'Dal (cooked)', emoji: '🍲', serving: '1 bowl', kcal: 300, p: 15, c: 50, f: 4 },
    { name: 'Dark Chocolate', emoji: '🍫', serving: '20 g', kcal: 115, p: 2, c: 8, f: 8 },
    { name: 'Greek Yogurt', emoji: '🥛', serving: '150 g', kcal: 154, p: 15, c: 8, f: 5 },
  ]
  const times = ['8:00 AM', '9:30 AM', '12:30 PM', '2:00 PM', '5:00 PM', '7:30 PM', '8:00 PM', '9:30 PM']
  for (let back = 12; back >= 1; back--) {
    const d = iso(new Date(TODAY0.getTime() - back * DAY))
    const n = 3 + ((back * 7) % 4)
    const entries: FoodEntry[] = []
    for (let k = 0; k < n; k++) {
      const p = pool[(back * 3 + k * 2) % pool.length]
      entries.push({ ...p, id: idSeq++, time: times[k % times.length] })
    }
    foodLog[d] = entries
  }
  foodLog[iso(TODAY0)] = [
    { id: idSeq++, time: '8:00 AM', name: 'Oats', emoji: '🥣', serving: '60 g', kcal: 228, p: 8, c: 40, f: 4 },
    { id: idSeq++, time: '9:30 AM', name: 'Coffee with Milk', emoji: '☕', serving: '1 cup', kcal: 150, p: 6, c: 15, f: 4 },
    { id: idSeq++, time: '11:30 AM', name: 'Almonds', emoji: '🌰', serving: '28 g', kcal: 170, p: 6, c: 6, f: 15 },
    { id: idSeq++, time: '12:30 PM', name: 'Chicken Breast', emoji: '🍗', serving: '150 g', kcal: 248, p: 46, c: 0, f: 5 },
    { id: idSeq++, time: '2:00 PM', name: 'Rice (cooked)', emoji: '🍚', serving: '200 g', kcal: 260, p: 5, c: 56, f: 1 },
    { id: idSeq++, time: '5:00 PM', name: 'Banana', emoji: '🍌', serving: '1 medium', kcal: 105, p: 1, c: 27, f: 0 },
    { id: idSeq++, time: '7:30 PM', name: 'Dal (cooked)', emoji: '🍲', serving: '1 bowl', kcal: 300, p: 15, c: 50, f: 4 },
    { id: idSeq++, time: '8:00 PM', name: 'Whey Protein', emoji: '🥛', serving: '1 scoop (30 g)', kcal: 120, p: 24, c: 3, f: 1 },
    { id: idSeq++, time: '9:30 PM', name: 'Dark Chocolate', emoji: '🍫', serving: '20 g', kcal: 115, p: 2, c: 8, f: 8 },
    { id: idSeq++, time: '10:00 PM', name: 'Greek Yogurt', emoji: '🥛', serving: '150 g', kcal: 154, p: 15, c: 8, f: 5 },
  ]

  const workouts: Workout[] = [
    { id: idSeq++, date: iso(new Date(TODAY0.getTime() - 4 * DAY)), type: 'Strength Training', mins: 45 },
    { id: idSeq++, date: iso(new Date(TODAY0.getTime() - 3 * DAY)), type: 'Running', mins: 30 },
    { id: idSeq++, date: iso(new Date(TODAY0.getTime() - 2 * DAY)), type: 'Cycling', mins: 40 },
    { id: idSeq++, date: iso(new Date(TODAY0.getTime() - 1 * DAY)), type: 'Strength Training', mins: 50 },
  ]

  return { goals, weightLog, foodLog, workouts }
}

const TODAY0 = new Date()
const TODAY_ISO0 = iso(TODAY0)

/* -------------------------------- storage --------------------------------- */

const STORAGE_KEY = 'zikzik-fitness-v1'

function loadFitness(): FitnessData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.goals && parsed.weightLog) return parsed
    }
  } catch {
    /* corrupted → reseed */
  }
  const seeded = seedData()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  } catch {
    /* unavailable */
  }
  return seeded
}

/* ------------------------------- chart bits ------------------------------- */

function Donut({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(100, Math.round((consumed / Math.max(goal, 1)) * 100))
  const size = 168
  const r = (size - 16) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECE8F7" strokeWidth="14" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#fitDonut)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="fitDonut" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C5BFF" />
            <stop offset="100%" stopColor="#4F7CFF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-extrabold leading-none tracking-tight text-[#111827]">
          {consumed.toLocaleString()}
        </span>
        <span className="mt-1 text-[12px] font-medium text-[#9CA3AF]">/ {goal.toLocaleString()} kcal</span>
        <span className="mt-0.5 text-[12px] font-semibold text-[#5B4DFF]">
          {Math.max(0, goal - consumed).toLocaleString()} kcal left
        </span>
      </div>
    </div>
  )
}

const MACRO_META = [
  { key: 'p', label: 'Protein', emoji: '🍗', bg: '#E4F6EC', color: '#10B981' },
  { key: 'c', label: 'Carbs', emoji: '🍞', bg: '#E7F0FF', color: '#2F6DF6' },
  { key: 'f', label: 'Fat', emoji: '💧', bg: '#FDE8F1', color: '#EC4899' },
] as const

function MacroBar({ label, emoji, bg, color, value, target }: { label: string; emoji: string; bg: string; color: string; value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(target, 1)) * 100))
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px]" style={{ background: bg }}>
          {emoji}
        </span>
        <span className="flex-1 text-[13px] font-semibold text-[#111827]">{label}</span>
        <span className="text-[12.5px] font-semibold text-[#374151]">
          {Math.round(value)} / {target} g
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2.5">
        <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#F0EEF9]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        <span className="w-9 text-right text-[11px] font-semibold text-[#9CA3AF]">{pct}%</span>
      </div>
    </div>
  )
}

function WeightChart({ points, goal }: { points: WeightPoint[]; goal: number }) {
  const W = 560
  const H = 230
  const padL = 34
  const padR = 16
  const padT = 14
  const padB = 26
  const vals = points.map((p) => p.kg)
  const yMin = Math.min(Math.floor(Math.min(...vals)) - 1, goal - 2)
  const yMax = Math.max(Math.ceil(Math.max(...vals)) + 1, goal + 2)
  const x = (i: number) => padL + (i / Math.max(points.length - 1, 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (H - padT - padB)

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)},${y(yMin)} L${x(0).toFixed(1)},${y(yMin)} Z`

  const yTicks: number[] = []
  for (let v = yMin; v <= yMax; v += 2) yTicks.push(v)

  // month ticks
  const monthTicks: { i: number; label: string }[] = []
  let lastMonth = -1
  points.forEach((p, i) => {
    const m = new Date(p.date + 'T00:00:00').getMonth()
    if (m !== lastMonth) {
      monthTicks.push({ i, label: new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }) })
      lastMonth = m
    }
  })

  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="wArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C5BFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7C5BFF" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#F0EEF9" strokeWidth="1" />
          <text x={padL - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#9CA3AF" fontWeight="600">
            {v}
          </text>
        </g>
      ))}
      {monthTicks.map((mt) => (
        <text key={mt.i + mt.label} x={x(mt.i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontWeight="600">
          {mt.label}
        </text>
      ))}
      <path d={area} fill="url(#wArea)" />
      <path d={line} fill="none" stroke="#6D4AFF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.kg)} r="4.5" fill="#6D4AFF" stroke="#fff" strokeWidth="2" />
      {/* tooltip bubble */}
      <g transform={`translate(${Math.min(x(points.length - 1) - 62, W - 128)}, ${Math.max(y(last.kg) - 52, 2)})`}>
        <rect width="118" height="42" rx="9" fill="#16182B" opacity="0.92" />
        <text x="12" y="18" fontSize="11.5" fontWeight="700" fill="#fff">
          {last.kg.toFixed(1)} kg
        </text>
        <text x="12" y="32" fontSize="9.5" fill="#B9B6C9">
          {fmtDateShort(last.date)}
        </text>
      </g>
    </svg>
  )
}

function WeeklyBars({ totals, goal }: { totals: { label: string; value: number; isToday: boolean }[]; goal: number }) {
  const W = 560
  const H = 210
  const padL = 34
  const padR = 12
  const padT = 12
  const padB = 26
  const max = 4000
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB)
  const bw = 34
  const step = (W - padL - padR) / totals.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 1000, 2000, 3000, 4000].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#F0EEF9" strokeWidth="1" />
          <text x={padL - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="#9CA3AF" fontWeight="600">
            {v === 0 ? '0' : `${v / 1000}K`}
          </text>
        </g>
      ))}
      {/* goal dashed line */}
      <line
        x1={padL}
        x2={W - padR}
        y1={y(Math.min(goal, max))}
        y2={y(Math.min(goal, max))}
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      {totals.map((t, i) => {
        const cx = padL + step * i + step / 2
        const total = Math.min(t.value, max)
        const over = Math.max(0, t.value - goal)
        const hMain = Math.max((total / max) * (H - padT - padB), 2)
        return (
          <g key={t.label}>
            <rect
              x={cx - bw / 2}
              y={y(total)}
              width={bw}
              height={hMain}
              rx="5"
              fill="#7C5BFF"
              opacity="0.85"
            />
            {over > 0 && (
              <rect
                x={cx - bw / 2}
                y={y(Math.min(t.value, max))}
                width={bw}
                height={Math.max((over / max) * (H - padT - padB), 2)}
                rx="5"
                fill="#C9C2F5"
              />
            )}
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="10.5" fontWeight={t.isToday ? '800' : '600'} fill={t.isToday ? '#5B4DFF' : '#9CA3AF'}>
              {t.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ================================ the page ================================ */

const QUICK_ADDS = [
  { name: 'Apple', emoji: '🍎', serving: '1 medium', kcal: 95, p: 0, c: 25, f: 0 },
  { name: 'Banana', emoji: '🍌', serving: '1 medium', kcal: 105, p: 1, c: 27, f: 0 },
  { name: 'Chicken', emoji: '🍗', serving: '100 g', kcal: 165, p: 31, c: 0, f: 4 },
  { name: 'Rice', emoji: '🍚', serving: '150 g', kcal: 195, p: 4, c: 42, f: 1 },
  { name: 'Egg', emoji: '🥚', serving: '1 large', kcal: 78, p: 6, c: 1, f: 5 },
  { name: 'Milk', emoji: '🥛', serving: '1 glass (250 ml)', kcal: 150, p: 8, c: 12, f: 8 },
  { name: 'Bread', emoji: '🍞', serving: '1 slice', kcal: 80, p: 3, c: 15, f: 1 },
]

const WORKOUT_TYPES = ['Strength Training', 'Running', 'Cycling', 'Yoga', 'Swimming', 'Sports']

export default function FitnessScreen() {
  const initial = useRef(loadFitness())
  const [data, setData] = useState<FitnessData>(initial.current)
  const [tab, setTab] = useState<'overview' | 'nutrition' | 'foodlog' | 'weight' | 'workouts' | 'goals'>('overview')
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO0)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addDraft, setAddDraft] = useState({ name: '', emoji: '🍽️', serving: '', kcal: '', p: '', c: '', f: '' })
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null)
  const [rowMenu, setRowMenu] = useState<number | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [goalDraft, setGoalDraft] = useState<Goals>(initial.current.goals)
  const [calorieEdit, setCalorieEdit] = useState('')
  const [workout, setWorkout] = useState({ type: WORKOUT_TYPES[0], mins: '45' })
  const [range, setRange] = useState<'3m' | '6m'>('3m')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* unavailable */
    }
  }, [data])

  const dateIso = selectedDate
  const dateObj = new Date(dateIso + 'T00:00:00')
  const isToday = dateIso === TODAY_ISO0

  const goals = data.goals
  const entries = data.foodLog[dateIso] ?? []
  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({ kcal: acc.kcal + e.kcal, p: acc.p + e.p, c: acc.c + e.c, f: acc.f + e.f }),
        { kcal: 0, p: 0, c: 0, f: 0 },
      ),
    [entries],
  )

  const weightPoints = useMemo(() => {
    const cutoff = Date.now() - (range === '3m' ? 90 : 180) * DAY
    return data.weightLog.filter((w) => new Date(w.date + 'T00:00:00').getTime() >= cutoff)
  }, [data.weightLog, range])

  const latestWeight = data.weightLog[data.weightLog.length - 1]?.kg ?? 0
  const weekAgoWeight =
    [...data.weightLog].reverse().find((w) => new Date(w.date + 'T00:00:00').getTime() <= Date.now() - 7 * DAY)?.kg ?? latestWeight
  const weightDelta = +(latestWeight - weekAgoWeight).toFixed(1)
  const bmi = bmiOf(latestWeight, goals.heightCm)
  const bmiMeta = bmiLabel(bmi)

  const weekTotals = useMemo(() => {
    const start = startOfWeek(dateObj)
    const arr: { label: string; value: number; isToday: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i)
      const k = iso(d)
      const sum = (data.foodLog[k] ?? []).reduce((s, e) => s + e.kcal, 0)
      arr.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: sum, isToday: k === TODAY_ISO0 })
    }
    return arr
  }, [data.foodLog, dateIso])

  const streak = useMemo(() => {
    let s = 0
    for (let back = 0; back < 400; back++) {
      const k = iso(new Date(TODAY0.getTime() - back * DAY))
      if ((data.foodLog[k]?.length ?? 0) > 0) s++
      else if (back > 0) break
    }
    return s
  }, [data.foodLog])

  const weekWorkouts = data.workouts.filter((w) => w.date >= iso(startOfWeek(dateObj))).length
  const workoutPct = Math.min(100, Math.round((weekWorkouts / Math.max(goals.weeklyWorkouts, 1)) * 100))

  /* ------------------------------- actions ------------------------------- */

  function addFood(entry: Omit<FoodEntry, 'id' | 'time'>, time?: string) {
    const e: FoodEntry = { ...entry, id: idSeq++, time: time ?? fmtClock(Date.now()) }
    setData((prev) => ({
      ...prev,
      foodLog: { ...prev.foodLog, [dateIso]: [...(prev.foodLog[dateIso] ?? []), e] },
    }))
    showToast(`${entry.name} added`)
  }

  function saveAdd() {
    const kcal = Number(addDraft.kcal) || 0
    if (!addDraft.name.trim() || !kcal) return
    addFood(
      {
        name: addDraft.name.trim(),
        emoji: addDraft.emoji || '🍽️',
        serving: addDraft.serving.trim() || '1 serving',
        kcal,
        p: Number(addDraft.p) || 0,
        c: Number(addDraft.c) || 0,
        f: Number(addDraft.f) || 0,
      },
      editEntry?.time,
    )
    if (editEntry) {
      setData((prev) => ({
        ...prev,
        foodLog: { ...prev.foodLog, [dateIso]: (prev.foodLog[dateIso] ?? []).filter((x) => x.id !== editEntry.id) },
      }))
      showToast('Entry updated')
    }
    setAddOpen(false)
    setEditEntry(null)
    setAddDraft({ name: '', emoji: '🍽️', serving: '', kcal: '', p: '', c: '', f: '' })
  }

  function openEdit(e: FoodEntry) {
    setEditEntry(e)
    setAddDraft({ name: e.name, emoji: e.emoji, serving: e.serving, kcal: String(e.kcal), p: String(e.p), c: String(e.c), f: String(e.f) })
    setAddOpen(true)
    setRowMenu(null)
  }

  function deleteEntry(id: number) {
    setData((prev) => ({
      ...prev,
      foodLog: { ...prev.foodLog, [dateIso]: (prev.foodLog[dateIso] ?? []).filter((x) => x.id !== id) },
    }))
    setRowMenu(null)
    showToast('Entry removed')
  }

  function addWeight() {
    const kg = Number(weightInput)
    if (!kg || kg <= 0) return
    setData((prev) => ({
      ...prev,
      weightLog: [...prev.weightLog.filter((w) => w.date !== dateIso), { date: dateIso, kg }].sort((a, b) =>
        a.date < b.date ? -1 : 1,
      ),
    }))
    setWeightInput('')
    showToast(`Weight logged: ${kg} kg`)
  }

  function saveGoals() {
    setData((prev) => ({ ...prev, goals: { ...goalDraft } }))
    showToast('Goals saved')
  }

  function addWorkout() {
    const mins = Number(workout.mins) || 0
    if (!mins) return
    setData((prev) => ({
      ...prev,
      workouts: [...prev.workouts, { id: idSeq++, date: dateIso, type: workout.type, mins }],
    }))
    showToast(`${workout.type} logged`)
  }

  function deleteWorkout(id: number) {
    setData((prev) => ({ ...prev, workouts: prev.workouts.filter((w) => w.id !== id) }))
    showToast('Workout removed')
  }

  const shownSearch = entries.filter((e) => (search ? e.name.toLowerCase().includes(search.toLowerCase()) : true))
  const latestWeightPoint = weightPoints[weightPoints.length - 1]
  const firstWeight = data.weightLog[0]?.kg ?? 0
  const monthAgoWeight =
    [...data.weightLog].reverse().find((w) => new Date(w.date + 'T00:00:00').getTime() <= Date.now() - 30 * DAY)?.kg ?? firstWeight

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutGrid },
    { key: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
    { key: 'foodlog', label: 'Food Log', icon: ListChecks },
    { key: 'weight', label: 'Weight', icon: Scale },
    { key: 'workouts', label: 'Workouts', icon: Dumbbell },
    { key: 'goals', label: 'Goals', icon: TrendingUp },
  ] as const

  const caloriesCard = (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="flex justify-center sm:justify-start">
        <Donut consumed={totals.kcal} goal={goals.dailyCalories} />
      </div>
      <div className="flex w-full flex-1 flex-col gap-4">
        <MacroBar label="Protein" emoji="🍗" bg="#E4F6EC" color="#10B981" value={totals.p} target={goals.protein} />
        <MacroBar label="Carbs" emoji="🍞" bg="#E7F0FF" color="#2F6DF6" value={totals.c} target={goals.carbs} />
        <MacroBar label="Fat" emoji="💧" bg="#FDE8F1" color="#EC4899" value={totals.f} target={goals.fat} />
      </div>
    </div>
  )

  return (
    <div className="flex h-full min-h-0">
      {/* ============================== main column ============================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="shrink-0 px-6 pt-5 xl:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">Fitness & Nutrition</h1>
              <p className="mt-0.5 text-[13.5px] text-[#6B7280]">Track your progress, stay consistent, and become a better you.</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex h-10 items-center gap-2 rounded-[10px] border border-[#ECECF4] bg-white px-3.5 text-[12.5px] font-semibold text-[#111827]">
                <CalendarDays className="h-4 w-4 text-[#5B4DFF]" strokeWidth={2} />
                {isToday ? 'Today, ' : ''}
                {fmtDayLong(dateObj)}
              </div>
              <button
                onClick={() => setSelectedDate(iso(addDays(dateObj, -1)))}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ECECF4] bg-white text-[#374151] transition-colors hover:bg-[#F6F5FB]"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedDate(iso(addDays(dateObj, 1)))}
                className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ECECF4] bg-white text-[#374151] transition-colors hover:bg-[#F6F5FB]"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(TODAY_ISO0)}
                  className="h-10 rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-3.5 text-[12px] font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
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
          </div>

          {/* stat cards */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#EEEDFC]">
                <Scale className="h-5 w-5 text-[#5B4DFF]" strokeWidth={2} />
              </span>
              <div>
                <div className="text-[11.5px] font-medium text-[#9CA3AF]">Weight</div>
                <div className="text-[19px] font-bold leading-tight text-[#111827]">{latestWeight.toFixed(1)} kg</div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold" style={{ color: weightDelta >= 0 ? '#10B981' : '#2F6DF6' }}>
                  {weightDelta >= 0 ? '↑' : '↓'} {Math.abs(weightDelta).toFixed(1)} kg
                  <span className="font-medium text-[#9CA3AF]">vs last week</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px]" style={{ background: bmiMeta.bg }}>
                <Check className="h-5 w-5" style={{ color: bmiMeta.fg }} strokeWidth={2.4} />
              </span>
              <div>
                <div className="text-[11.5px] font-medium text-[#9CA3AF]">BMI</div>
                <div className="text-[19px] font-bold leading-tight text-[#111827]">{bmi.toFixed(1)}</div>
                <span className="mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: bmiMeta.bg, color: bmiMeta.fg }}>
                  {bmiMeta.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF3E0]">
                <Flame className="h-5 w-5 text-[#D97706]" strokeWidth={2} />
              </span>
              <div>
                <div className="flex items-center gap-1 text-[11.5px] font-medium text-[#9CA3AF]">
                  Daily Calorie Goal
                  <button
                    onClick={() => {
                      setCalorieEdit(String(goals.dailyCalories))
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded-md text-[#8B8A9A] hover:bg-[#F3F2F9] hover:text-[#111827]"
                    title="Edit goal"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-[19px] font-bold leading-tight text-[#111827]">{goals.dailyCalories.toLocaleString()} kcal</div>
                <div className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">Bulk (Lean Gain)</div>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#ECECF4] bg-white p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#FDE8EC]">
                <Flame className="h-5 w-5 text-[#E11D48]" strokeWidth={2} />
              </span>
              <div>
                <div className="text-[11.5px] font-medium text-[#9CA3AF]">Streak</div>
                <div className="text-[19px] font-bold leading-tight text-[#111827]">{streak} days</div>
                <span className="mt-0.5 inline-flex rounded-full bg-[#E4F6EC] px-2 py-0.5 text-[10.5px] font-semibold text-[#10B981]">
                  Keep it going!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* body per tab */}
        <div className="min-h-0 flex-1 px-6 py-4 xl:px-8">
          {tab === 'overview' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Calories Today */}
                <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[16px] font-bold tracking-tight text-[#111827]">Calories Today</h2>
                    <button
                      onClick={() => setTab('nutrition')}
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
                    >
                      View Details <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
                    </button>
                  </div>
                  {caloriesCard}
                </div>

                {/* Weight Progress */}
                <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-[16px] font-bold tracking-tight text-[#111827]">Weight Progress</h2>
                    <div className="relative">
                      <button
                        onClick={() => setRange((r) => (r === '3m' ? '6m' : '3m'))}
                        className="flex items-center gap-1 rounded-full bg-[#F3F2F9] px-2.5 py-1 text-[11px] font-semibold text-[#374151] hover:bg-[#ECEAF7]"
                      >
                        Last {range === '3m' ? '3 Months' : '6 Months'}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <WeightChart points={weightPoints} goal={goals.weightGoal} />
                  <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                    {[
                      { v: `+${(latestWeight - firstWeight).toFixed(1)} kg`, l: 'Total Gain', c: '#10B981' },
                      { v: `+${(latestWeight - monthAgoWeight).toFixed(1)} kg`, l: 'Last 30 Days', c: '#10B981' },
                      { v: `${firstWeight.toFixed(1)} kg`, l: 'Starting', c: '#374151' },
                      { v: `${goals.weightGoal.toFixed(1)} kg`, l: 'Target', c: '#374151' },
                    ].map((s) => (
                      <div key={s.l}>
                        <div className="text-[13px] font-bold" style={{ color: s.c }}>
                          {s.v}
                        </div>
                        <div className="text-[10.5px] text-[#9CA3AF]">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Food Log */}
                <FoodLogCard
                  search={search}
                  setSearch={setSearch}
                  shownSearch={shownSearch}
                  onAdd={() => {
                    setEditEntry(null)
                    setAddDraft({ name: '', emoji: '🍽️', serving: '', kcal: '', p: '', c: '', f: '' })
                    setAddOpen(true)
                  }}
                  openEdit={openEdit}
                  deleteEntry={deleteEntry}
                  rowMenu={rowMenu}
                  setRowMenu={setRowMenu}
                  full={false}
                />

                {/* Weekly Summary */}
                <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-[16px] font-bold tracking-tight text-[#111827]">Weekly Summary</h2>
                    <button
                      onClick={() => setTab('foodlog')}
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
                    >
                      View All <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
                    </button>
                  </div>
                  <div className="mb-1 flex flex-wrap gap-1.5">
                    {(
                      [
                        { key: 'calories', label: 'Calories' },
                        { key: 'protein', label: 'Protein' },
                        { key: 'carbs', label: 'Carbs' },
                        { key: 'fat', label: 'Fat' },
                      ] as const
                    ).map((p) => (
                      <span
                        key={p.key}
                        className={`cursor-default rounded-full px-3 py-1 text-[11.5px] font-semibold ${
                          p.key === 'calories' ? 'bg-[#16182B] text-white' : 'border border-[#ECECF4] text-[#374151]'
                        }`}
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>
                  <WeeklyBars totals={weekTotals} goal={goals.dailyCalories} />
                  <div className="mt-1 flex items-center justify-center gap-5 text-[11px] font-medium text-[#6B7280]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-4 rounded-full bg-[#7C5BFF]" /> Consumed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-0 w-4 border-t-2 border-dashed border-[#9CA3AF]" /> Goal
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'nutrition' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                <h2 className="mb-4 text-[16px] font-bold tracking-tight text-[#111827]">Calories Today</h2>
                {caloriesCard}
              </div>
              <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                <h2 className="mb-4 text-[16px] font-bold tracking-tight text-[#111827]">Macro Targets</h2>
                <div className="flex flex-col gap-3">
                  {MACRO_META.map((m) => (
                    <div key={m.key} className="flex items-center gap-3 rounded-[12px] border border-[#ECECF4] bg-[#FBFAFE] px-3.5 py-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[14px]" style={{ background: m.bg }}>
                        {m.emoji}
                      </span>
                      <span className="flex-1 text-[13.5px] font-semibold text-[#111827]">{m.label} target</span>
                      <span className="text-[13.5px] font-bold text-[#111827]">
                        {m.key === 'p' ? goals.protein : m.key === 'c' ? goals.carbs : goals.fat} g
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => setTab('goals')}
                    className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02]"
                  >
                    Edit targets in Goals
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'foodlog' && (
            <div className="flex flex-col gap-4">
              <FoodLogCard
                search={search}
                setSearch={setSearch}
                shownSearch={shownSearch}
                onAdd={() => {
                  setEditEntry(null)
                  setAddDraft({ name: '', emoji: '🍽️', serving: '', kcal: '', p: '', c: '', f: '' })
                  setAddOpen(true)
                }}
                openEdit={openEdit}
                deleteEntry={deleteEntry}
                rowMenu={rowMenu}
                setRowMenu={setRowMenu}
                full
              />
              <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                <h2 className="mb-2 text-[16px] font-bold tracking-tight text-[#111827]">Weekly Summary</h2>
                <WeeklyBars totals={weekTotals} goal={goals.dailyCalories} />
                <div className="mt-1 flex items-center justify-center gap-5 text-[11px] font-medium text-[#6B7280]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full bg-[#7C5BFF]" /> Consumed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-0 w-4 border-t-2 border-dashed border-[#9CA3AF]" /> Goal
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === 'weight' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[16px] font-bold tracking-tight text-[#111827]">Weight Progress</h2>
                  <button
                    onClick={() => setRange((r) => (r === '3m' ? '6m' : '3m'))}
                    className="flex items-center gap-1 rounded-full bg-[#F3F2F9] px-2.5 py-1 text-[11px] font-semibold text-[#374151] hover:bg-[#ECEAF7]"
                  >
                    Last {range === '3m' ? '3 Months' : '6 Months'}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <WeightChart points={weightPoints} goal={goals.weightGoal} />
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  {[
                    { v: `+${(latestWeight - firstWeight).toFixed(1)} kg`, l: 'Total Gain', c: '#10B981' },
                    { v: `+${(latestWeight - monthAgoWeight).toFixed(1)} kg`, l: 'Last 30 Days', c: '#10B981' },
                    { v: `${firstWeight.toFixed(1)} kg`, l: 'Starting', c: '#374151' },
                    { v: `${goals.weightGoal.toFixed(1)} kg`, l: 'Target', c: '#374151' },
                  ].map((s) => (
                    <div key={s.l}>
                      <div className="text-[13px] font-bold" style={{ color: s.c }}>
                        {s.v}
                      </div>
                      <div className="text-[10.5px] text-[#9CA3AF]">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                  <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">Log Weight</h2>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWeight()}
                      placeholder={`Weight in kg for ${fmtDateShort(dateIso)}`}
                      className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
                    />
                    <button
                      onClick={addWeight}
                      className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02]"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.4} /> Add
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {[...data.weightLog].reverse().slice(0, 5).map((w) => (
                      <div key={w.date} className="flex items-center justify-between rounded-[10px] border border-[#ECECF4] px-3.5 py-2">
                        <span className="text-[12.5px] font-medium text-[#6B7280]">{fmtDateShort(w.date)}</span>
                        <span className="text-[13px] font-bold text-[#111827]">{w.kg.toFixed(1)} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                  <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">BMI</h2>
                  <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-[16px]" style={{ background: bmiMeta.bg }}>
                      <span className="text-[18px] font-extrabold" style={{ color: bmiMeta.fg }}>
                        {bmi.toFixed(1)}
                      </span>
                    </span>
                    <div>
                      <div className="text-[15px] font-bold text-[#111827]">{bmiMeta.label}</div>
                      <p className="mt-0.5 text-[12px] text-[#9CA3AF]">
                        Based on {latestWeight.toFixed(1)} kg at {goals.heightCm} cm height. Edit height in Goals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'workouts' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">This Week</h2>
                <div className="flex items-center justify-between rounded-[12px] bg-[#FBFAFE] px-4 py-3">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold text-[#111827]">
                    <Dumbbell className="h-4 w-4 text-[#5B4DFF]" strokeWidth={2} />
                    Weekly sessions
                  </span>
                  <span className="text-[13.5px] font-bold text-[#111827]">
                    {weekWorkouts} / {goals.weeklyWorkouts}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EFEDF8]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF]"
                    initial={{ width: 0 }}
                    animate={{ width: `${workoutPct}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {data.workouts.length === 0 && <p className="py-4 text-center text-[12.5px] text-[#9CA3AF]">No workouts logged yet.</p>}
                  {[...data.workouts].reverse().map((w) => (
                    <div key={w.id} className="group flex items-center gap-3 rounded-[12px] border border-[#ECECF4] bg-white px-3.5 py-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EEEDFC]">
                        <Dumbbell className="h-4 w-4 text-[#5B4DFF]" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-[#111827]">{w.type}</div>
                        <div className="text-[11px] text-[#9CA3AF]">{fmtDateShort(w.date)}</div>
                      </div>
                      <span className="text-[12px] font-semibold text-[#6B7280]">{w.mins} min</span>
                      <button
                        onClick={() => deleteWorkout(w.id)}
                        className="text-[#C4C4D4] opacity-0 transition-colors hover:text-[#DC2626] group-hover:opacity-100"
                        aria-label="Delete workout"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
                <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">Log Workout</h2>
                <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Type</label>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {WORKOUT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setWorkout((w) => ({ ...w, type: t }))}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        workout.type === t ? 'border-transparent bg-[#16182B] text-white' : 'border-[#E7E5F2] text-[#4B5563] hover:bg-[#F6F5FB]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Duration (minutes)</label>
                <input
                  type="number"
                  value={workout.mins}
                  onChange={(e) => setWorkout((w) => ({ ...w, mins: e.target.value }))}
                  className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
                />
                <button
                  onClick={addWorkout}
                  className="w-full rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02]"
                >
                  Log for {fmtDateShort(dateIso)}
                </button>
              </div>
            </div>
          )}

          {tab === 'goals' && (
            <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
              <h2 className="mb-4 text-[16px] font-bold tracking-tight text-[#111827]">My Goals</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    { key: 'weightGoal', label: 'Weight goal (kg)', step: 0.1 },
                    { key: 'heightCm', label: 'Height (cm)', step: 1 },
                    { key: 'dailyCalories', label: 'Daily calorie goal (kcal)', step: 10 },
                    { key: 'protein', label: 'Protein target (g)', step: 1 },
                    { key: 'carbs', label: 'Carbs target (g)', step: 1 },
                    { key: 'fat', label: 'Fat target (g)', step: 1 },
                    { key: 'weeklyWorkouts', label: 'Weekly workouts', step: 1 },
                  ] as const
                ).map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-[12px] font-semibold text-[#374151]">{f.label}</label>
                    <input
                      type="number"
                      step={f.step}
                      value={goalDraft[f.key]}
                      onChange={(e) => setGoalDraft({ ...goalDraft, [f.key]: Number(e.target.value) || 0 })}
                      className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={saveGoals}
                className="mt-4 rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02]"
              >
                Save goals
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================== right panel ============================== */}
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#ECECF4] bg-white p-4 xl:flex">
        {/* My Goals */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">My Goals</h3>
            <button
              onClick={() => setTab('goals')}
              className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
            >
              Manage
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3.5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EEEDFC]">
                  <Scale className="h-4 w-4 text-[#5B4DFF]" strokeWidth={2} />
                </span>
                <span className="text-[13px] font-bold text-[#111827]">Weight Goal</span>
              </div>
              <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-[#EFEDF8]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF]"
                  style={{ width: `${Math.min(100, Math.round((latestWeight / Math.max(goals.weightGoal, 1)) * 100))}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] font-medium text-[#9CA3AF]">
                <span>
                  {latestWeight.toFixed(1)} / {goals.weightGoal} kg
                </span>
                <span className="font-bold text-[#111827]">{Math.min(100, Math.round((latestWeight / Math.max(goals.weightGoal, 1)) * 100))}%</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FDE8EC]">
                  <Flame className="h-4 w-4 text-[#E11D48]" strokeWidth={2} />
                </span>
                <span className="text-[13px] font-bold text-[#111827]">Daily Calories</span>
                <ChevronRight className="ml-auto h-4 w-4 text-[#C4C4D4]" />
              </div>
              <div className="mt-2 text-[14px] font-bold text-[#111827]">{goals.dailyCalories.toLocaleString()} kcal</div>
              <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-[#EFEDF8]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF]"
                  style={{ width: `${Math.min(100, Math.round((totals.kcal / Math.max(goals.dailyCalories, 1)) * 100))}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] font-medium text-[#9CA3AF]">
                <span>
                  {totals.kcal.toLocaleString()} / {goals.dailyCalories.toLocaleString()} kcal
                </span>
                <span className="font-bold text-[#111827]">{Math.min(100, Math.round((totals.kcal / Math.max(goals.dailyCalories, 1)) * 100))}%</span>
              </div>
            </div>
            <button onClick={() => setTab('goals')} className="group flex items-center gap-2.5 rounded-[10px] px-0.5 py-1 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F0FF]">
                <PieChart className="h-4 w-4 text-[#2F6DF6]" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-bold leading-tight text-[#111827]">
                Macros
                <br />
                Target
              </span>
              <span className="whitespace-nowrap text-[11px] font-semibold text-[#6B7280]">
                P{goals.protein} C{goals.carbs} F{goals.fat}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#C4C4D4] transition-transform group-hover:translate-x-0.5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E4F6EC]">
                  <Dumbbell className="h-4 w-4 text-[#10B981]" strokeWidth={2} />
                </span>
                <span className="flex-1 text-[13px] font-bold text-[#111827]">Weekly Workouts</span>
              </div>
              <div className="mt-1.5 text-[14px] font-bold text-[#111827]">
                {weekWorkouts} / {goals.weeklyWorkouts} sessions
              </div>
              <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-[#EFEDF8]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF]"
                  style={{ width: `${workoutPct}%` }}
                />
              </div>
              <div className="mt-1 text-right text-[11px] font-bold text-[#111827]">{workoutPct}%</div>
            </div>
          </div>
        </div>

        {/* Quick Add */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Quick Add</h3>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {QUICK_ADDS.map((q) => (
              <button
                key={q.name}
                onClick={() => addFood({ ...q })}
                className="flex flex-col items-center gap-1 rounded-[12px] border border-[#ECECF4] bg-[#FBFAFE] py-2.5 transition-all hover:-translate-y-[2px] hover:border-[#C9BCFF] hover:bg-[#F6F3FF]"
                title={`Add ${q.name} (${q.kcal} kcal)`}
              >
                <span className="text-[18px]">{q.emoji}</span>
                <span className="text-[10px] font-semibold text-[#374151]">{q.name}</span>
              </button>
            ))}
            <button
              onClick={() => {
                setEditEntry(null)
                setAddDraft({ name: '', emoji: '🍽️', serving: '', kcal: '', p: '', c: '', f: '' })
                setAddOpen(true)
              }}
              className="flex flex-col items-center gap-1 rounded-[12px] border border-[#ECECF4] bg-[#FBFAFE] py-2.5 transition-all hover:-translate-y-[2px] hover:border-[#C9BCFF] hover:bg-[#F6F3FF]"
            >
              <Plus className="h-[18px] w-[18px] text-[#5B4DFF]" strokeWidth={2.2} />
              <span className="text-[10px] font-semibold text-[#374151]">Custom</span>
            </button>
          </div>
        </div>

        {/* quote */}
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#EFECFE] via-[#E7E4FD] to-[#DDD6FB] p-4">
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/30 blur-2xl" />
          <div className="flex items-start gap-2.5">
            <Dumbbell className="mt-0.5 h-4 w-4 shrink-0 text-[#5B4DFF]" strokeWidth={2.2} />
            <p className="text-[13.5px] font-medium italic leading-relaxed text-[#3D3564]">
              "Small consistent steps lead to big results."
            </p>
          </div>
        </div>
      </aside>

      {/* ================================ overlays =============================== */}
      {/* calorie goal quick edit */}
      <AnimatePresence>
        {calorieEdit !== '' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16182B]/40 p-4 backdrop-blur-[2px]"
            onClick={() => setCalorieEdit('')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_24px_60px_rgba(30,25,80,0.25)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[16px] font-bold tracking-tight text-[#111827]">Daily Calorie Goal</h3>
                <button onClick={() => setCalorieEdit('')} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F2F9]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                autoFocus
                type="number"
                value={calorieEdit}
                onChange={(e) => setCalorieEdit(e.target.value)}
                className="mb-4 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setCalorieEdit('')} className="rounded-[10px] border border-[#E7E5F2] px-4 py-2 text-[13px] font-semibold text-[#374151] hover:bg-[#F6F5FB]">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const v = Number(calorieEdit)
                    if (v > 0) {
                      setData((prev) => ({ ...prev, goals: { ...prev.goals, dailyCalories: v } }))
                      showToast('Calorie goal updated')
                    }
                    setCalorieEdit('')
                  }}
                  className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)]"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* add/edit food */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16182B]/40 p-4 backdrop-blur-[2px]"
            onClick={() => {
              setAddOpen(false)
              setEditEntry(null)
            }}
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
                  {editEntry ? 'Edit Food' : 'Add Food'}
                </h3>
                <button
                  onClick={() => {
                    setAddOpen(false)
                    setEditEntry(null)
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F2F9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-3 grid grid-cols-[64px_minmax(0,1fr)] gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Emoji</label>
                  <input
                    value={addDraft.emoji}
                    onChange={(e) => setAddDraft({ ...addDraft, emoji: e.target.value })}
                    className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-2 text-center text-[16px] outline-none focus:border-[#B9A7FF]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Food</label>
                  <input
                    autoFocus
                    value={addDraft.name}
                    onChange={(e) => setAddDraft({ ...addDraft, name: e.target.value })}
                    placeholder="e.g. Chicken Breast"
                    className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
                  />
                </div>
              </div>
              <label className="mb-1 block text-[12px] font-semibold text-[#374151]">Serving</label>
              <input
                value={addDraft.serving}
                onChange={(e) => setAddDraft({ ...addDraft, serving: e.target.value })}
                placeholder="e.g. 150 g or 1 medium"
                className="mb-3 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
              />
              <div className="mb-4 grid grid-cols-4 gap-2">
                {(
                  [
                    { key: 'kcal', label: 'Calories' },
                    { key: 'p', label: 'P (g)' },
                    { key: 'c', label: 'C (g)' },
                    { key: 'f', label: 'F (g)' },
                  ] as const
                ).map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-[11.5px] font-semibold text-[#374151]">{f.label}</label>
                    <input
                      type="number"
                      min={0}
                      value={addDraft[f.key]}
                      onChange={(e) => setAddDraft({ ...addDraft, [f.key]: e.target.value })}
                      className="h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-2 text-center text-[13px] text-[#111827] outline-none focus:border-[#B9A7FF]"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setAddOpen(false)
                    setEditEntry(null)
                  }}
                  className="rounded-[10px] border border-[#E7E5F2] px-4 py-2 text-[13px] font-semibold text-[#374151] hover:bg-[#F6F5FB]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAdd}
                  className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02]"
                >
                  {editEntry ? 'Save changes' : 'Add to log'}
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

  function FoodLogCard({
    search,
    setSearch,
    shownSearch,
    onAdd,
    openEdit,
    deleteEntry,
    rowMenu,
    setRowMenu,
    full,
  }: {
    search: string
    setSearch: (v: string) => void
    shownSearch: FoodEntry[]
    onAdd: () => void
    openEdit: (e: FoodEntry) => void
    deleteEntry: (id: number) => void
    rowMenu: number | null
    setRowMenu: (v: number | null) => void
    full: boolean
  }) {
    return (
      <div className="rounded-[16px] border border-[#ECECF4] bg-white p-5">
        <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">Food Log</h2>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex h-10 min-w-[180px] flex-1 items-center gap-2 rounded-[10px] border border-[#ECECF4] bg-white px-3 focus-within:border-[#B9A7FF]">
            <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a food (e.g. chicken, rice, banana)..."
              className="w-full bg-transparent text-[12.5px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search">
                <X className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </button>
            )}
          </div>
          <button
            onClick={() => showToast('Camera scan coming soon')}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#ECECF4] bg-white text-[#6B7280] transition-colors hover:bg-[#F6F5FB]"
            title="Scan food"
          >
            <ScanLine className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            onClick={onAdd}
            className="flex h-10 items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-4 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            Add Food
          </button>
        </div>

        {shownSearch.length === 0 ? (
          <p className="py-10 text-center text-[13px] font-medium text-[#9CA3AF]">
            {search ? 'No foods match your search.' : 'Nothing logged for this day yet.'}
          </p>
        ) : (
          <div className={full ? '' : 'max-h-[300px] overflow-y-auto'}>
            <div className="hidden grid-cols-[60px_minmax(0,1fr)_74px_60px_40px_40px_40px_30px] items-center border-b border-[#F0EFF7] px-3 py-2 md:grid">
              {['Time', 'Food', 'Serving', 'Calories', 'P', 'C', 'F'].map((h) => (
                <span key={h} className="text-[11px] font-semibold text-[#9CA3AF]">
                  {h}
                </span>
              ))}
              <span />
            </div>
            {shownSearch.map((e) => (
              <div
                key={e.id}
                className="group flex flex-col gap-2 border-b border-[#F0EFF7] px-3 py-2.5 last:border-b-0 hover:bg-[#FAF9FF] md:grid md:grid-cols-[60px_minmax(0,1fr)_74px_60px_40px_40px_40px_30px] md:items-center md:gap-0"
              >
                <span className="text-[12px] font-semibold text-[#6B7280]">{e.time}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-[15px]">{e.emoji}</span>
                  <span className="truncate text-[13px] font-semibold text-[#111827]">{e.name}</span>
                </span>
                <span className="text-[12px] text-[#6B7280]">{e.serving}</span>
                <span className="text-[12.5px] font-bold text-[#111827]">{e.kcal}</span>
                <span className="text-[12px] text-[#6B7280]">{e.p}</span>
                <span className="text-[12px] text-[#6B7280]">{e.c}</span>
                <span className="hidden items-center justify-end md:flex">
                  <span className="relative">
                    <button
                      onClick={() => setRowMenu(rowMenu === e.id ? null : e.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827] md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Entry options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {rowMenu === e.id && (
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
                              onClick={() => openEdit(e)}
                              className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                            >
                              <Pencil className="h-3.5 w-3.5 text-[#6B7280]" /> Edit
                            </button>
                            <button
                              onClick={() => deleteEntry(e.id)}
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
            ))}
          </div>
        )}
      </div>
    )
  }
}

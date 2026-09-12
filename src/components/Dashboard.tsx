import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutGrid,
  GraduationCap,
  Briefcase,
  User,
  Plus,
  Paperclip,
  Globe,
  Settings2,
  ChevronDown,
  Mic,
  ArrowUp,
  CalendarDays,
  FileText,
  Search,
  Mail,
  MoreHorizontal,
  ChevronRight,
  Target,
  Zap,
  CalendarCheck,
  Clock,
  ChevronLeft,
  Check,
} from 'lucide-react'
import { focusTasks, quickActions, suggestions, weekDays, schedule, activity } from '../data'

const suggestIcons: Record<string, React.ElementType> = {
  calendar: CalendarDays,
  filetext: FileText,
  search: Search,
  mail: Mail,
  grid: LayoutGrid,
}

const qaIcons: Record<string, React.ElementType> = {
  calendar: CalendarDays,
  filetext: FileText,
  search: Search,
  mail: Mail,
}

const fileStyles: Record<string, { icon: React.ElementType; color: string }> = {
  pdf: { icon: FileText, color: '#EF4444' },
  txt: { icon: FileText, color: '#6B7280' },
  md: { icon: FileText, color: '#6B7280' },
}

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 20)
    return () => clearInterval(t)
  }, [])
  return now
}

export default function Dashboard({ onMic }: { onMic: () => void }) {
  const now = useClock()
  const [tab, setTab] = useState('All')
  const [tasks, setTasks] = useState(focusTasks)
  const [draft, setDraft] = useState('')

  const tabs = [
    { label: 'All', icon: LayoutGrid },
    { label: 'Study', icon: GraduationCap },
    { label: 'Work', icon: Briefcase },
    { label: 'Personal', icon: User },
  ]

  const time = now
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s/g, ' ')

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex gap-6 px-7 pb-6 pt-1">
        {/* ============ Center column ============ */}
        <div className="min-w-0 flex-1">
          {/* Greeting row */}
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-[12.5px] font-medium text-[#9CA3AF]">
                {now.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <h1 className="mt-1 text-[38px] font-bold leading-[1.1] tracking-tight text-[#111827]">
                Good morning, <span className="text-[#5B4DFF]">Razik</span>
              </h1>
              <p className="mt-1.5 text-[14px] text-[#6B7280]">Let’s make today productive.</p>
            </div>
            <div className="pb-1 text-right">
              <div className="text-[30px] font-bold leading-none tracking-tight text-[#111827]">
                {time.split(' ')[0]}
                <span className="ml-1.5 text-[15px] font-semibold text-[#9CA3AF]">
                  {time.split(' ')[1]}
                </span>
              </div>
            </div>
          </div>

          {/* Filter pills */}
          <div className="mb-4 flex items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t.label}
                onClick={() => setTab(t.label)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  tab === t.label
                    ? 'bg-[#111827] text-white shadow-[0_3px_10px_rgba(17,24,39,0.22)]'
                    : 'border border-[#ECECF4] bg-white text-[#4B5563] hover:border-[#D6D3EA]'
                }`}
              >
                <t.icon className="h-[15px] w-[15px]" strokeWidth={2} />
                {t.label}
              </button>
            ))}
            <button className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#ECECF4] bg-white text-[#4B5563] transition-colors hover:border-[#D6D3EA]">
              <Plus className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>

          {/* AI input box */}
          <div className="mb-3 rounded-[20px] border border-[#ECECF4] bg-white p-4 shadow-[0_2px_12px_rgba(70,60,140,0.05)] transition-shadow focus-within:shadow-[0_4px_20px_rgba(91,77,255,0.10)]">
            <div className="flex items-start gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={1}
                placeholder="Ask Zikzik AI anything…"
                className="mt-[7px] h-7 max-h-32 w-full resize-none bg-transparent text-[15px] leading-7 text-[#111827] outline-none placeholder:text-[#B3B0C4]"
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 border-t-0">
              {[
                { icon: Paperclip, label: 'Attach' },
                { icon: Globe, label: 'Search web' },
              ].map((b) => (
                <button
                  key={b.label}
                  className="flex items-center gap-1.5 rounded-full bg-[#F5F4FB] px-3 py-1.5 text-[12px] font-medium text-[#4B5563] transition-colors hover:bg-[#EEEDFC] hover:text-[#5B4DFF]"
                >
                  <b.icon className="h-[14px] w-[14px]" strokeWidth={1.9} />
                  {b.label}
                </button>
              ))}
              <button className="flex items-center gap-1.5 rounded-full bg-[#F5F4FB] px-3 py-1.5 text-[12px] font-medium text-[#4B5563] transition-colors hover:bg-[#EEEDFC] hover:text-[#5B4DFF]">
                <Settings2 className="h-[14px] w-[14px]" strokeWidth={1.9} />
                Tools
                <ChevronDown className="h-3 w-3" strokeWidth={2.2} />
              </button>

              <div className="ml-auto flex items-center gap-2.5">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#B3B0C4]">
                  <span className="rounded-[5px] border border-[#E4E3EF] bg-[#F7F6FC] px-1.5 py-[1px]">
                    Ctrl
                  </span>
                  <span className="rounded-[5px] border border-[#E4E3EF] bg-[#F7F6FC] px-1.5 py-[1px]">
                    ↵
                  </span>
                </span>
                <button
                  onClick={onMic}
                  title="Open Voice Mode"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-white shadow-[0_3px_10px_rgba(17,24,39,0.28)] transition-transform hover:scale-105 active:scale-95"
                >
                  <Mic className="h-4 w-4" strokeWidth={2.1} />
                </button>
                <button
                  title="Send"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6A5BFF] via-[#5B4DFF] to-[#4F7CFF] text-white shadow-[0_3px_10px_rgba(91,77,255,0.32)] transition-transform hover:scale-105 active:scale-95"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="mb-7 flex flex-wrap gap-2.5">
            {suggestions.map((s) => {
              const Icon = suggestIcons[s.icon]
              return (
                <button
                  key={s.label}
                  className="flex items-center gap-2 rounded-full border border-[#ECECF4] bg-white py-[7px] pl-2.5 pr-4 shadow-[0_1px_6px_rgba(70,60,140,0.05)] transition-all hover:-translate-y-[1px] hover:border-[#CFC7FF]"
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ color: s.color, backgroundColor: `${s.color}14` }}
                  >
                    <Icon className="h-[13px] w-[13px]" strokeWidth={2.1} />
                  </span>
                  <span className="text-[12.5px] font-medium text-[#374151]">{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Focus + Quick actions row */}
          <div className="flex gap-5">
            {/* Today's Focus */}
            <section className="flex-1 rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_2px_12px_rgba(70,60,140,0.05)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-[#111827]">
                  <Target className="h-[17px] w-[17px] text-[#5B4DFF]" strokeWidth={2.2} />
                  Today’s Focus
                </h2>
                <button className="text-[12.5px] font-semibold text-[#5B4DFF] transition-opacity hover:opacity-75">
                  View all
                </button>
              </div>

              <div className="flex flex-col">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="group flex items-center gap-3 rounded-[10px] px-1.5 py-[9px] transition-colors hover:bg-[#F8F7FD]"
                  >
                    <button
                      onClick={() =>
                        setTasks((prev) => prev.map((p) => (p.id === t.id ? { ...p, done: !p.done } : p)))
                      }
                      className={`flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border-[1.6px] transition-all ${
                        t.done
                          ? 'border-transparent bg-[#5B4DFF]'
                          : 'border-[#D8D5EC] bg-white hover:border-[#5B4DFF]'
                      }`}
                    >
                      {t.done && <Check className="h-3 w-3 text-white" strokeWidth={3.2} />}
                    </button>
                    <span
                      className={`flex-1 text-[14px] ${
                        t.done ? 'text-[#B3B0C4] line-through' : 'font-semibold text-[#1F2937]'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[12px] font-medium text-[#9CA3AF]">{t.time}</span>
                    <button className="flex h-6 w-6 items-center justify-center rounded-md text-[#D1CFDF] opacity-0 transition-opacity hover:bg-[#EEEDFC] hover:text-[#5B4DFF] group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button className="mt-2 flex items-center gap-1.5 px-1.5 py-1.5 text-[13px] font-semibold text-[#5B4DFF] transition-opacity hover:opacity-75">
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                Add a task
              </button>
            </section>

            {/* Quick Actions */}
            <section className="flex-1 rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_2px_12px_rgba(70,60,140,0.05)]">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-[#111827]">
                  <Zap className="h-[17px] w-[17px] text-[#F59E0B]" strokeWidth={2.2} />
                  Quick Actions
                </h2>
              </div>
              <div className="flex flex-col">
                {quickActions.map((qa) => {
                  const Icon = qaIcons[qa.icon]
                  return (
                    <button
                      key={qa.label}
                      className="group flex items-center gap-3.5 rounded-[12px] px-1.5 py-[11px] text-left transition-colors hover:bg-[#F8F7FD]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F3F1FC] text-[#5B4DFF] transition-colors group-hover:bg-[#EEEDFC]">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block text-[13.5px] font-semibold text-[#1F2937]">
                          {qa.label}
                        </span>
                        <span className="mt-[3px] block truncate text-[11.5px] text-[#9CA3AF]">
                          {qa.desc}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#D1CFDF] transition-colors group-hover:text-[#5B4DFF]" />
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        </div>

        {/* ============ Right column ============ */}
        <div className="flex w-[318px] shrink-0 flex-col gap-5">
          {/* Calendar */}
          <section className="rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_2px_12px_rgba(70,60,140,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-[#111827]">
                <CalendarCheck className="h-[17px] w-[17px] text-[#5B4DFF]" strokeWidth={2.1} />
                Calendar
              </h2>
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-semibold text-[#374151]">Sep 2026</span>
                <button className="flex h-6 w-6 items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F3F1FC]">
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
                <button className="flex h-6 w-6 items-center justify-center rounded-md text-[#9CA3AF] hover:bg-[#F3F1FC]">
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="pb-1.5 text-[10.5px] font-semibold text-[#C4C4D4]">
                  {d}
                </span>
              ))}
              {weekDays.map((d) => (
                <div key={d.day} className="flex h-[38px] items-center justify-center">
                  <span
                    className={`flex h-[32px] w-[32px] items-center justify-center rounded-full text-[13px] ${
                      d.today
                        ? 'bg-[#5B4DFF] font-bold text-white shadow-[0_3px_10px_rgba(91,77,255,0.35)]'
                        : d.day === 6 || d.dim
                          ? 'font-semibold text-[#111827]'
                          : 'font-medium text-[#9CA3AF] hover:bg-[#F3F1FC]'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-col gap-1 border-t border-[#F0EFF7] pt-3">
              {schedule.map((s) => (
                <div key={s.title} className="flex items-center gap-3 rounded-lg px-1 py-[7px] transition-colors hover:bg-[#F8F7FD]">
                  <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: s.dot }} />
                  <span className="w-[62px] shrink-0 text-[11.5px] font-semibold text-[#6B7280]">
                    {s.time}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1F2937]">
                    {s.title}
                  </span>
                  <span className="shrink-0 text-[11px] font-medium text-[#B3B0C4]">{s.place}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Tasks Progress */}
          <section className="flex items-center gap-4 rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_2px_12px_rgba(70,60,140,0.05)]">
            <div className="relative h-[88px] w-[88px] shrink-0">
              <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
                <circle cx="44" cy="44" r="36" fill="none" stroke="#EEEDFC" strokeWidth="9" />
                <motion.circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="#5B4DFF"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36}
                  initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 36 * 0.75 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[17px] font-bold text-[#111827]">
                25%
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-[#111827]">12 tasks remaining</div>
              <div className="mt-0.5 text-[12.5px] text-[#9CA3AF]">Keep going!</div>
            </div>
            <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#D1CFDF] transition-colors hover:bg-[#F3F1FC] hover:text-[#5B4DFF]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </section>

          {/* Recent Activity */}
          <section className="rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_2px_12px_rgba(70,60,140,0.05)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-[#111827]">
                <Clock className="h-[17px] w-[17px] text-[#5B4DFF]" strokeWidth={2.1} />
                Recent Activity
              </h2>
              <button className="text-[12.5px] font-semibold text-[#5B4DFF] transition-opacity hover:opacity-75">
                View all
              </button>
            </div>
            <div className="flex flex-col">
              {activity.map((a) => {
                const F = fileStyles[a.type]
                const Icon = F.icon
                return (
                  <div
                    key={a.name}
                    className="group flex items-center gap-3 rounded-[10px] px-1 py-[9px] transition-colors hover:bg-[#F8F7FD]"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                      style={{ color: F.color, backgroundColor: `${F.color}12` }}
                    >
                      <Icon className="h-[16px] w-[16px]" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[13px] font-semibold text-[#1F2937]">
                        {a.name}
                      </span>
                      <span className="mt-[2px] block text-[11.5px] text-[#9CA3AF]">{a.time}</span>
                    </span>
                    <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#D1CFDF] opacity-0 transition-opacity hover:bg-[#EEEDFC] hover:text-[#5B4DFF] group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

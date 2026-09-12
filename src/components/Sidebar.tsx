import {
  Home,
  MessageCircle,
  ListChecks,
  Calendar,
  PenLine,
  FileText,
  Mail,
  User,
  LayoutGrid,
  Settings,
  ChevronsLeft,
  ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { navItems } from '../data'

export const navIcons: Record<string, React.ElementType> = {
  home: Home,
  chat: MessageCircle,
  tasks: ListChecks,
  calendar: Calendar,
  notes: PenLine,
  documents: FileText,
  emails: Mail,
  contacts: User,
  tools: LayoutGrid,
  settings: Settings,
}

export function Logo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="13.5" stroke="#16182B" strokeWidth="4.5" />
      <path
        d="M20 2.5 A17.5 17.5 0 0 1 37.5 20"
        stroke="url(#logoGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="logoGrad" x1="20" y1="2.5" x2="37.5" y2="20">
          <stop stopColor="#7C5BFF" />
          <stop offset="1" stopColor="#4F7CFF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function Sidebar({
  active,
  onSelect,
}: {
  active: string
  onSelect: (label: string) => void
}) {
  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-[#ECECF4] bg-white px-4 pb-4 pt-5">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-3 px-2">
        <Logo />
        <div className="leading-tight">
          <div className="text-[19px] font-bold tracking-tight text-[#111827]">Zikzik AI</div>
          <div className="text-[11.5px] font-medium text-[#9CA3AF]">Your AI Assistant</div>
        </div>
        <button className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2FA]">
          <ChevronsLeft className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-[3px]">
        {navItems.map((item) => {
          const Icon = navIcons[item.icon]
          const isActive = active === item.label
          return (
            <button
              key={item.label}
              onClick={() => onSelect(item.label)}
              className={`relative flex items-center gap-3 rounded-[11px] px-3 py-[9px] text-left text-[13.5px] font-medium transition-colors ${
                isActive ? 'text-[#5B4DFF]' : 'text-[#4B5563] hover:bg-[#F6F5FB]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-[11px] bg-[#EEEDFC]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative h-[17px] w-[17px]" strokeWidth={isActive ? 2.2 : 1.9} />
              <span className="relative">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Status card */}
      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-[14px] border border-[#ECECF4] bg-white px-3.5 py-3 shadow-[0_2px_10px_rgba(70,60,140,0.06)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34D399] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34D399]" />
            </span>
            <span className="text-[13px] font-semibold text-[#111827]">Zikzik AI Online</span>
          </div>
          <div className="mt-0.5 pl-4 text-[11.5px] text-[#9CA3AF]">Ready to assist</div>
        </div>

        <button className="flex items-center gap-2.5 rounded-[11px] px-2 py-2 transition-colors hover:bg-[#F6F5FB]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF] text-[13px] font-bold text-white">
            R
          </span>
          <span className="leading-tight">
            <span className="block text-[13.5px] font-semibold text-[#111827]">Razik</span>
            <span className="block text-[11px] text-[#9CA3AF]">Always Forward</span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 text-[#C4C4D4]" />
        </button>
      </div>
    </aside>
  )
}

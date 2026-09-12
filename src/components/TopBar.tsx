import { Search, Sun, Bell, ChevronDown } from 'lucide-react'

export default function TopBar({
  search,
  onSearch,
}: {
  search: string
  onSearch: (v: string) => void
}) {
  return (
    <header className="flex h-[68px] shrink-0 items-center gap-3 bg-[#F4F4FB] px-7">
      <div className="flex h-11 flex-1 items-center gap-2.5 rounded-full border border-[#ECECF4] bg-white px-4 shadow-[0_1px_6px_rgba(70,60,140,0.05)] focus-within:border-[#B9AEFF]">
        <Search className="h-[17px] w-[17px] shrink-0 text-[#9CA3AF]" strokeWidth={2} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Ask Zikzik AI anything…"
          className="h-full w-full bg-transparent text-[13.5px] text-[#111827] outline-none placeholder:text-[#B3B0C4]"
        />
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#9CA3AF]">
          <span className="rounded-[5px] border border-[#E4E3EF] bg-[#F7F6FC] px-1.5 py-[1px]">Ctrl</span>
          <span className="rounded-[5px] border border-[#E4E3EF] bg-[#F7F6FC] px-1.5 py-[1px]">K</span>
        </span>
      </div>

      <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#4B5563] shadow-[0_1px_6px_rgba(70,60,140,0.05)] transition-colors hover:bg-[#F6F5FB]">
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </button>

      <button className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#4B5563] shadow-[0_1px_6px_rgba(70,60,140,0.05)] transition-colors hover:bg-[#F6F5FB]">
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
        <span className="absolute right-[11px] top-[11px] h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
      </button>

      <button className="flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-[0_1px_6px_rgba(70,60,140,0.05)] transition-colors hover:bg-[#F6F5FB]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF] text-[12px] font-bold text-white">
          R
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[12.5px] font-semibold text-[#111827]">Razik</span>
          <span className="block text-[10.5px] text-[#9CA3AF]">Always Forward</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[#C4C4D4]" />
      </button>
    </header>
  )
}

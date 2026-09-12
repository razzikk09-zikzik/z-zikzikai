import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import ChatScreen from './components/ChatScreen'
import CalendarScreen from './components/CalendarScreen'
import TasksScreen from './components/TasksScreen'
import NotesScreen from './components/NotesScreen'
import DocumentsScreen from './components/DocumentsScreen'
import ContactsScreen from './components/ContactsScreen'
import VoiceMode from './components/VoiceMode'
import { navItems } from './data'
import { navIcons } from './components/Sidebar'

export default function App() {
  const [nav, setNav] = useState('Home')
  const [search, setSearch] = useState('')
  const [voice, setVoice] = useState(() => window.location.hash === '#voice')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVoice(false)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('header input')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const mobileNav = navItems.filter((n) =>
    ['Home', 'Chat', 'Tasks', 'Calendar', 'Notes', 'Documents', 'Contacts'].includes(n.label),
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F4FB]">
      <div className="hidden h-full lg:flex">
        <Sidebar active={nav} onSelect={setNav} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col pb-14 lg:pb-0">
        <TopBar search={search} onSearch={setSearch} />
        <main className="min-h-0 flex-1">
          <div
            className={`h-full ${
              nav === 'Chat' ||
              nav === 'Calendar' ||
              nav === 'Tasks' ||
              nav === 'Notes' ||
              nav === 'Documents' ||
              nav === 'Contacts'
                ? 'hidden'
                : 'block'
            }`}
          >
            <Dashboard onMic={() => setVoice(true)} />
          </div>
          {nav === 'Chat' && <ChatScreen onMic={() => setVoice(true)} />}
          {nav === 'Calendar' && <CalendarScreen />}
          {nav === 'Tasks' && <TasksScreen onNavigate={setNav} />}
          {nav === 'Notes' && <NotesScreen />}
          {nav === 'Documents' && <DocumentsScreen />}
          {nav === 'Contacts' && <ContactsScreen onNavigate={setNav} />}
        </main>
      </div>

      {/* mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch justify-around border-t border-[#ECECF4] bg-white/95 backdrop-blur lg:hidden">
        {mobileNav.map((item) => {
          const Icon = navIcons[item.icon]
          const isActive = nav === item.label
          return (
            <button
              key={item.label}
              onClick={() => setNav(item.label)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-[#5B4DFF]' : 'text-[#9CA3AF]'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.9} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <AnimatePresence>{voice && <VoiceMode onClose={() => setVoice(false)} />}</AnimatePresence>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import VoiceMode from './components/VoiceMode'

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F4FB]">
      <Sidebar active={nav} onSelect={setNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar search={search} onSearch={setSearch} />
        <main className="min-h-0 flex-1">
          <Dashboard onMic={() => setVoice(true)} />
        </main>
      </div>

      <AnimatePresence>{voice && <VoiceMode onClose={() => setVoice(false)} />}</AnimatePresence>
    </div>
  )
}

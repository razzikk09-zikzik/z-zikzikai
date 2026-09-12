import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Sun, ChevronDown, Minus, Square, X, AudioLines } from 'lucide-react'
import { Logo } from './Sidebar'

/* Bell-curve waveform — shorter at the edges, tallest at the center */
function Waveform({ active }: { active: boolean }) {
  const N = 64
  const bars = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const x = i / (N - 1)
        const bell = Math.pow(Math.sin(Math.PI * x), 1.4)
        return 0.12 + bell * 0.88
      }),
    [],
  )
  return (
    <div className="flex h-[46px] w-[min(52vw,720px)] items-center justify-center gap-[5px]">
      {bars.map((b, i) => {
        const centerness = b
        const color = `rgb(${Math.round(196 - 105 * centerness)}, ${Math.round(
          189 - 76 * centerness,
        )}, ${Math.round(252 - 25 * centerness)})`
        return (
          <motion.span
            key={i}
            className="h-[44px] w-[4px] rounded-full"
            style={{ background: color }}
            animate={
              active
                ? { scaleY: [0.3 + b * 0.35, 0.5 + b * 0.95, 0.3 + b * 0.35] }
                : { scaleY: 0.16 }
            }
            transition={{
              duration: 0.9 + (i % 6) * 0.07,
              repeat: active ? Infinity : 0,
              ease: 'easeInOut',
              delay: (i % 4) * 0.06,
            }}
            initial={false}
          />
        )
      })}
    </div>
  )
}

type Phase = 'listening' | 'thinking' | 'response'

export default function VoiceMode({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<Phase>('listening')

  useEffect(() => {
    const v = videoRef.current
    if (v) {
      v.currentTime = 0
      v.play().catch(() => {})
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (v) v.pause()
    }
  }, [onClose])

  const cycle = () => {
    if (phase === 'listening') {
      setPhase('thinking')
      setTimeout(() => setPhase('response'), 1800)
      setTimeout(() => setPhase('listening'), 5200)
    }
  }

  const headline =
    phase === 'listening' ? 'I’m listening…' : phase === 'thinking' ? 'Thinking…' : 'All set, Razik.'

  const sub =
    phase === 'listening'
      ? 'Speak naturally — I’ll handle the rest.'
      : phase === 'thinking'
        ? 'Processing what you said…'
        : 'I moved your 1 PM to 2:30 and notified Dana. Anything else?'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background:
          'linear-gradient(165deg, #F1EFFA 0%, #F4F3FB 40%, #F9F8FD 100%)',
      }}
    >
      {/* radial lightening behind orb */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[42%] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(252,251,254,0.95)_0%,rgba(252,251,254,0)_60%)]" />
        {/* corner blobs */}
        <div className="absolute -left-32 -top-24 h-[380px] w-[380px] rounded-full bg-[#E2DDF5] opacity-55 blur-[90px]" />
        <div className="absolute -right-28 top-1/3 h-[420px] w-[420px] rounded-full bg-[#E4DFF6] opacity-45 blur-[100px]" />
        <div className="absolute -bottom-28 left-1/4 h-[360px] w-[360px] rounded-full bg-[#E7E3F7] opacity-40 blur-[100px]" />
        {/* scattered particles */}
        {[
          [12, 30], [18, 58], [9, 72], [86, 26], [91, 48], [82, 70],
          [30, 14], [64, 10], [72, 86], [24, 84], [46, 22], [55, 78], [7, 44], [94, 62], [38, 90], [68, 34],
        ].map(([l, t], i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#A48FFF]"
            style={{
              left: `${l}%`,
              top: `${t}%`,
              width: 4 + (i % 3),
              height: 4 + (i % 3),
              opacity: 0.35 + (i % 3) * 0.15,
            }}
          />
        ))}
      </div>

      {/* ===== Top bar ===== */}
      <div className="relative z-10 flex h-[62px] shrink-0 items-center px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-[15.5px] font-bold tracking-tight text-[#16182B]">Zikzik AI</span>
        </div>

        <div className="mx-auto flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-[7px] shadow-[0_2px_10px_rgba(70,60,140,0.08)] backdrop-blur">
          <AudioLines className="h-[15px] w-[15px] text-[#5B4DFF]" strokeWidth={2.2} />
          <span className="text-[12.5px] font-semibold text-[#374151]">Voice mode</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-white/70">
            <Sun className="h-[17px] w-[17px]" strokeWidth={1.9} />
          </button>
          <span className="h-5 w-px bg-[#D8D4EA]" />
          <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1.5 transition-colors hover:bg-white/70">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF] text-[12px] font-bold text-white">
              R
            </span>
            <span className="hidden text-left leading-tight xl:block">
              <span className="block text-[12.5px] font-semibold text-[#16182B]">Razik</span>
              <span className="block text-[10px] text-[#9CA3AF]">Always Forward</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#C4C4D4]" />
          </button>
          <span className="h-5 w-px bg-[#D8D4EA]" />
          <div className="flex items-center gap-1 text-[#C4C4D4]">
            <button className="flex h-7 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/70 hover:text-[#6B7280]">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button className="flex h-7 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/70 hover:text-[#6B7280]">
              <Square className="h-3 w-3" />
            </button>
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="flex h-7 w-8 items-center justify-center rounded-md transition-colors hover:bg-[#FFE4E4] hover:text-[#EF4444]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Stage ===== */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-6">
        {/* Listening pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10 flex items-center gap-2 rounded-full bg-white px-4 py-[7px] shadow-[0_2px_12px_rgba(70,60,140,0.10)]"
        >
          <motion.span
            className="h-[7px] w-[7px] rounded-full bg-[#22C55E]"
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[12px] font-semibold text-[#374151]">
            {phase === 'listening' ? 'Listening' : phase === 'thinking' ? 'Processing' : 'Done'}
          </span>
        </motion.div>

        {/* Orb with orbit rings */}
        <motion.div
          initial={{ scale: 0.55, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.55, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 150, damping: 19 }}
          className="relative"
        >
          {/* halo glow */}
          <div className="absolute -inset-16 rounded-full bg-[radial-gradient(circle,rgba(124,91,255,0.34)_0%,rgba(124,91,255,0.12)_45%,transparent_68%)]" />
          {/* concentric rings */}
          <div className="absolute -inset-[50px] rounded-full border-[1.5px] border-[#5B4DFF]/[0.22]" />
          <div className="absolute -inset-[86px] rounded-full border border-[#5B4DFF]/[0.13]" />
          {/* orbit dots */}
          <motion.span
            className="absolute -inset-[50px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute left-1/2 top-0 h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5B4DFF] shadow-[0_0_10px_rgba(91,77,255,0.65)]" />
            <span className="absolute bottom-[12%] right-[8%] h-[5px] w-[5px] rounded-full bg-[#8B7BFF] shadow-[0_0_8px_rgba(139,123,255,0.6)]" />
          </motion.span>
          <motion.span
            className="absolute -inset-[86px]"
            animate={{ rotate: -360 }}
            transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          >
            <span className="absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8B7BFF] shadow-[0_0_8px_rgba(139,123,255,0.6)]" />
            <span className="absolute bottom-[18%] left-[14%] h-[4px] w-[4px] rounded-full bg-[#A48FFF] shadow-[0_0_6px_rgba(164,143,255,0.6)]" />
          </motion.span>

          {/* looping video orb, edge-faded into the background */}
          <div
            className="relative h-[300px] w-[300px] overflow-hidden rounded-full"
            style={{
              maskImage:
                'radial-gradient(circle, black 58%, rgba(0,0,0,0.85) 74%, transparent 98%)',
              WebkitMaskImage:
                'radial-gradient(circle, black 58%, rgba(0,0,0,0.85) 74%, transparent 98%)',
            }}
          >
            <video
              ref={videoRef}
              src="/BLOBANIMATION.mp4"
              className="h-full w-full scale-[1.32] object-cover"
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              controls={false}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_35px_rgba(122,95,255,0.28)]" />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <h1 className="text-[42px] font-bold tracking-tight text-[#16182B]">{headline}</h1>
          <p className="mt-2 text-[15px] font-medium text-[#8B87A0]">{sub}</p>
        </motion.div>

        {/* Mic button */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col items-center"
        >
          <motion.button
            onClick={cycle}
            whileTap={{ scale: 0.94 }}
            className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white text-[#5B4DFF] shadow-[0_6px_30px_rgba(91,77,255,0.28),0_2px_8px_rgba(70,60,140,0.10)] transition-shadow hover:shadow-[0_8px_38px_rgba(91,77,255,0.38),0_2px_8px_rgba(70,60,140,0.10)]"
            title={phase === 'listening' ? 'Click to stop' : 'Click to listen again'}
          >
            <motion.span
              className="absolute inset-0 rounded-full border-[1.5px] border-[#5B4DFF]/60"
              animate={{ scale: [1, 1.38], opacity: [0.7, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border-[1.5px] border-[#5B4DFF]/45"
              animate={{ scale: [1, 1.38], opacity: [0.7, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut', delay: 0.95 }}
            />
            <Mic className="h-[26px] w-[26px]" strokeWidth={2} />
          </motion.button>
          <span className="mt-3 text-[12px] font-medium text-[#8B87A0]">Click to stop</span>
        </motion.div>
      </div>

      {/* ===== Waveform ===== */}
      <div className="relative z-10 flex shrink-0 justify-center pb-2">
        <Waveform active={phase === 'listening'} />
      </div>

      {/* ===== Bottom row ===== */}
      <div className="relative z-10 flex shrink-0 items-center justify-between px-6 pb-5">
        <div className="flex items-center gap-2.5 rounded-[14px] bg-white/75 px-4 py-2.5 shadow-[0_2px_12px_rgba(70,60,140,0.08)] backdrop-blur">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEEDFC]">
            <AudioLines className="h-[14px] w-[14px] text-[#5B4DFF]" strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[12px] font-semibold text-[#16182B]">Voice mode active</span>
            <span className="block text-[10.5px] text-[#9CA3AF]">Powered by Zikzik AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[12px] font-medium text-[#6B7280]">
          <span className="rounded-[7px] border border-[#D8D4EA] bg-white/80 px-2.5 py-[3px] font-semibold text-[#374151] shadow-[0_1px_4px_rgba(70,60,140,0.08)]">
            Esc
          </span>
          to exit
        </div>
      </div>
    </motion.div>
  )
}

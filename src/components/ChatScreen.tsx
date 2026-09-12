import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  MessageCircle,
  Pin,
  MoreHorizontal,
  SquarePen,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Paperclip,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  Mic,
  ArrowUp,
  FileText,
  File,
  Mail,
  Calendar,
  Crosshair,
  RotateCw,
  X,
  Check,
  CornerDownLeft,
  Trash2,
  Eraser,
} from 'lucide-react'
import { Logo } from './Sidebar'

/* ---------------------------------- types --------------------------------- */

type AiBlock =
  | { type: 'text'; text: string }
  | { type: 'list'; items: { title: string; desc: string }[] }

type Message = {
  id: number
  role: 'user' | 'ai'
  time: string
  text?: string
  blocks?: AiBlock[]
  reaction?: 'up' | 'down' | null
}

type Convo = {
  id: number
  title: string
  preview: string
  time: string
  group: 'Today' | 'Yesterday' | 'Previous 7 days'
  pinned?: boolean
  messages: Message[]
}

/* ------------------------------- seed data -------------------------------- */

const hackathonReply: AiBlock[] = [
  {
    type: 'text',
    text: 'Of course! Here are some innovative project ideas for a college hackathon, tailored to your interests (tech, productivity, mobility and real-world impact):',
  },
  {
    type: 'list',
    items: [
      {
        title: 'EVTrack+',
        desc: 'An all-in-one EV tracking and analytics platform to log rides, calculate energy usage, estimate costs, and suggest optimal routes.',
      },
      {
        title: 'CampusConnect',
        desc: 'A smart campus assistant for timetables, resources, and peer collaboration using AI.',
      },
      {
        title: 'HealthLens',
        desc: 'An AI-powered symptom checker that predicts possible illnesses and gives basic guidance.',
      },
      {
        title: 'LocalEye',
        desc: 'A real-time public data visualization tool for your city (e.g., Chennai) using open data and live feeds.',
      },
      {
        title: 'StudyBuddy AI',
        desc: 'Personalized study planner, doubt solver, and note summarizer for engineering students.',
      },
    ],
  },
  {
    type: 'text',
    text: 'Would you like me to expand on any of these ideas with features, tech stack, and implementation steps?',
  },
]

const seedConvos: Convo[] = [
  {
    id: 1,
    title: 'Project ideas discussion',
    preview: 'Here are some innovative project...',
    time: '2:45 PM',
    group: 'Today',
    messages: [
      {
        id: 1,
        role: 'user',
        time: '2:42 PM',
        text: 'Can you give me some innovative project ideas for a college hackathon?',
      },
      { id: 2, role: 'ai', time: '2:42 PM', blocks: hackathonReply, reaction: null },
    ],
  },
  {
    id: 2,
    title: 'Engineering Graphics help',
    preview: 'Explain projection of solids...',
    time: '11:20 AM',
    group: 'Today',
    pinned: true,
    messages: [
      { id: 1, role: 'user', time: '11:14 AM', text: 'Explain projection of solids with a simple example.' },
      {
        id: 2,
        role: 'ai',
        time: '11:15 AM',
        blocks: [
          { type: 'text', text: 'Sure — here’s the intuition before the drawing:' },
          {
            type: 'list',
            items: [
              { title: 'Top view', desc: 'Project the solid downward onto the horizontal plane — you see its footprint.' },
              { title: 'Front view', desc: 'Project onto the vertical plane to capture height and width.' },
              { title: 'Side view', desc: 'Rotate 90° to reveal depth that the front view hides.' },
            ],
          },
          { type: 'text', text: 'Want a worked example with a hexagonal prism?' },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Study plan for this week',
    preview: 'Here’s your study plan...',
    time: '9:10 AM',
    group: 'Today',
    messages: [
      { id: 1, role: 'user', time: '9:05 AM', text: 'Make me a realistic study plan for this week.' },
      {
        id: 2,
        role: 'ai',
        time: '9:10 AM',
        blocks: [
          { type: 'text', text: 'Here’s a balanced 4-day plan with spaced revision:' },
          {
            type: 'list',
            items: [
              { title: 'Mon – Engineering Graphics', desc: 'Projection of solids practice set, 90 minutes.' },
              { title: 'Tue – Electron Devices', desc: 'Diode circuits + 20 problems from the tutorial sheet.' },
              { title: 'Thu – Revision', desc: 'Flashcards for both subjects, 45 minutes each.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'Summarize this PDF',
    preview: 'Key points from the document...',
    time: '7:30 PM',
    group: 'Yesterday',
    messages: [
      { id: 1, role: 'user', time: '7:28 PM', text: 'Summarize the PDF I just attached.' },
      {
        id: 2,
        role: 'ai',
        time: '7:30 PM',
        blocks: [
          { type: 'text', text: 'Key points from the document:' },
          {
            type: 'list',
            items: [
              { title: 'Core argument', desc: 'Renewable adoption is cost-driven, not policy-driven, since 2022.' },
              { title: 'Evidence', desc: 'Levelized cost of solar fell 34% while battery storage fell 41%.' },
              { title: 'Conclusion', desc: 'Grid-scale storage is the bottleneck to watch through 2030.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 5,
    title: 'Electron Devices doubt',
    preview: 'The working principle of a diode...',
    time: '4:12 PM',
    group: 'Yesterday',
    messages: [
      { id: 1, role: 'user', time: '4:10 PM', text: 'What is the working principle of a diode?' },
      {
        id: 2,
        role: 'ai',
        time: '4:12 PM',
        blocks: [
          { type: 'text', text: 'A diode is a one-way valve for current:' },
          {
            type: 'list',
            items: [
              { title: 'Forward bias', desc: 'P-side to +ve — the depletion layer shrinks and current flows freely.' },
              { title: 'Reverse bias', desc: 'Depletion layer widens, blocking all but a tiny leakage current.' },
              { title: 'Threshold', desc: 'Silicon conducts fully past ~0.7 V forward voltage.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 6,
    title: 'Gym workout plan',
    preview: 'Here’s a 4-day workout plan...',
    time: '1:05 PM',
    group: 'Yesterday',
    messages: [
      { id: 1, role: 'user', time: '1:02 PM', text: 'Give me a 4-day gym split for beginners.' },
      {
        id: 2,
        role: 'ai',
        time: '1:05 PM',
        blocks: [
          { type: 'text', text: 'Here’s a proven beginner split:' },
          {
            type: 'list',
            items: [
              { title: 'Day 1 – Push', desc: 'Bench press, shoulder press, triceps dips — 3×10 each.' },
              { title: 'Day 2 – Pull', desc: 'Lat pulldown, rows, biceps curls — 3×10 each.' },
              { title: 'Day 3 – Legs', desc: 'Squats, lunges, calf raises — 3×12 each.' },
              { title: 'Day 4 – Core + cardio', desc: 'Planks, hanging leg raises, 20 min moderate cardio.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 7,
    title: 'Write an email',
    preview: 'Subject: Leave Request...',
    time: 'Sep 5',
    group: 'Previous 7 days',
    messages: [
      { id: 1, role: 'user', time: 'Sep 5 · 6:40 PM', text: 'Write a leave request email to my HOD.' },
      {
        id: 2,
        role: 'ai',
        time: 'Sep 5 · 6:42 PM',
        blocks: [
          { type: 'text', text: 'Here’s a concise, respectful draft:' },
          {
            type: 'list',
            items: [
              { title: 'Subject', desc: 'Leave Request — [Your Name], [Department]' },
              { title: 'Body', desc: 'State the dates, the reason in one line, and your plan to cover pending work.' },
              { title: 'Sign-off', desc: 'Thank the HOD and attach any supporting documents if required.' },
            ],
          },
          { type: 'text', text: 'Want me to write the full email text with your details?' },
        ],
      },
    ],
  },
  {
    id: 8,
    title: 'Explain this code',
    preview: 'This Python code reads a file...',
    time: 'Sep 4',
    group: 'Previous 7 days',
    messages: [
      { id: 1, role: 'user', time: 'Sep 4 · 9:20 PM', text: 'Explain what this Python code does line by line.' },
      {
        id: 2,
        role: 'ai',
        time: 'Sep 4 · 9:22 PM',
        blocks: [
          { type: 'text', text: 'Walking through the snippet:' },
          {
            type: 'list',
            items: [
              { title: 'with open(...)', desc: 'Opens the file and guarantees it closes, even on errors.' },
              { title: 'readlines()', desc: 'Loads every line into a list, keeping the newline characters.' },
              { title: 'Loop + strip()', desc: 'Iterates the lines and trims whitespace before parsing.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 9,
    title: 'Interview preparation',
    preview: 'Here are some common questions...',
    time: 'Sep 3',
    group: 'Previous 7 days',
    messages: [
      { id: 1, role: 'user', time: 'Sep 3 · 5:00 PM', text: 'Common internship interview questions for ECE students?' },
      {
        id: 2,
        role: 'ai',
        time: 'Sep 3 · 5:03 PM',
        blocks: [
          { type: 'text', text: 'Expect a mix of fundamentals and projects:' },
          {
            type: 'list',
            items: [
              { title: 'Fundamentals', desc: 'Ohm’s law in context, op-amp basics, digital logic minimization.' },
              { title: 'Projects', desc: 'Explain one project end-to-end — problem, choices, result.' },
              { title: 'Behavioral', desc: 'A conflict you resolved in a team, using the STAR format.' },
            ],
          },
        ],
      },
    ],
  },
]

/* ------------------------------ reply builder ----------------------------- */

function nowTime() {
  return new Date()
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toUpperCase()
}

function makeReply(prompt: string, variant = 0): AiBlock[] {
  const p = prompt.toLowerCase()
  const short = prompt.length > 42 ? prompt.slice(0, 42).trimEnd() + '…' : prompt

  if (p.includes('email') || p.includes('mail')) {
    return [
      { type: 'text', text: 'Here’s a polished structure for your email:' },
      {
        type: 'list',
        items: [
          { title: 'Subject line', desc: 'Specific and under 60 characters so it never gets truncated.' },
          { title: 'Opening line', desc: 'One sentence of context — who you are and why you’re writing.' },
          { title: 'The ask', desc: 'A single, clear action with a deadline so it’s easy to say yes to.' },
        ],
      },
      { type: 'text', text: 'Want me to draft the full email with your details?' },
    ]
  }
  if (p.includes('summar')) {
    return [
      { type: 'text', text: 'Here’s the summary, condensed to what matters:' },
      {
        type: 'list',
        items: [
          { title: 'Main idea', desc: 'The central claim, stated in one sentence you could repeat from memory.' },
          { title: 'Supporting points', desc: 'Two or three facts or arguments that carry the main idea.' },
          { title: 'Takeaway', desc: 'What this changes for you, and the one action worth taking.' },
        ],
      },
      { type: 'text', text: 'I can also turn this into bullet notes or flashcards.' },
    ]
  }
  if (p.includes('study') || p.includes('plan') || p.includes('assignment') || p.includes('exam')) {
    return [
      { type: 'text', text: 'Here’s a plan that fits around your classes:' },
      {
        type: 'list',
        items: [
          { title: 'Block 1', desc: 'Hardest subject first, 90 minutes, phone in another room.' },
          { title: 'Block 2', desc: 'Practice problems over re-reading — active recall sticks better.' },
          { title: 'Block 3', desc: 'A short 30-minute evening review to close the loop.' },
        ],
      },
      { type: 'text', text: 'Want me to schedule these into your calendar?' },
    ]
  }
  if (variant === 1) {
    return [
      { type: 'text', text: `Another angle on “${short}”:` },
      {
        type: 'list',
        items: [
          { title: 'Prioritize', desc: 'Pick the single outcome that makes everything else easier.' },
          { title: 'Draft first, refine later', desc: 'A rough version now beats a perfect version never.' },
          { title: 'Review with fresh eyes', desc: 'Sleep on it, then edit once — not five times.' },
        ],
      },
      { type: 'text', text: 'Want a deeper dive on any of these?' },
    ]
  }
  return [
    { type: 'text', text: `Here’s a quick take on “${short}”:` },
    {
      type: 'list',
      items: [
        { title: 'Break it down', desc: 'Split it into 2–3 concrete steps and start with the highest-impact one.' },
        { title: 'Gather what you need', desc: 'List the files, links, or information required so nothing blocks you mid-task.' },
        { title: 'Set a checkpoint', desc: 'Decide what “done” looks like and when you’ll review progress.' },
      ],
    },
    { type: 'text', text: 'Would you like me to expand any of these into a step-by-step plan?' },
  ]
}

/* ------------------------------ right panel ------------------------------- */

const toolList = [
  { label: 'Summarize document', icon: FileText },
  { label: 'Write email', icon: Mail },
  { label: 'Plan my day', icon: Calendar },
  { label: 'Find new leads', icon: Search },
  { label: 'Search the web', icon: Crosshair },
]

const promptPool = [
  'Explain this concept simply',
  'Help me with my assignments',
  'Give me a study plan',
  'Summarize this document',
  'Search for latest tech news',
  'Draft a leave request email',
  'Create a revision timetable',
  'List hackathon project ideas',
  'Explain diode working principle',
  'Tips to stay focused while studying',
]

function RightPanel({
  activeTools,
  onToggleTool,
  webSearch,
  onToggleWeb,
  contextFiles,
  onAddFile,
  onRemoveFile,
  onPrompt,
}: {
  activeTools: string[]
  onToggleTool: (t: string) => void
  webSearch: boolean
  onToggleWeb: () => void
  contextFiles: string[]
  onAddFile: () => void
  onRemoveFile: (f: string) => void
  onPrompt: (p: string) => void
}) {
  const [prompts, setPrompts] = useState(promptPool.slice(0, 5))
  const [spin, setSpin] = useState(0)

  return (
    <div className="flex w-[280px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-[#ECECF4] bg-white p-5">
      {/* Tools */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Tools</h3>
          <button className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]">
            See all
          </button>
        </div>
        <div className="flex flex-col">
          {toolList.map((t) => {
            const isWeb = t.label === 'Search the web'
            const active = isWeb ? webSearch : activeTools.includes(t.label)
            return (
              <button
                key={t.label}
                onClick={() => (isWeb ? onToggleWeb() : onToggleTool(t.label))}
                className={`flex h-10 items-center gap-3 rounded-[10px] px-2 text-left text-[13.5px] font-medium transition-colors ${
                  active ? 'bg-[#EEEDFC] text-[#5B4DFF]' : 'text-[#1F2937] hover:bg-[#F6F5FB]'
                }`}
              >
                <t.icon
                  className={`h-[18px] w-[18px] shrink-0 ${isWeb || active ? 'text-[#5B4DFF]' : 'text-[#374151]'}`}
                  strokeWidth={1.9}
                />
                {t.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Current Context */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Current Context</h3>
          <button
            onClick={() => contextFiles.forEach(onRemoveFile)}
            className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
          >
            Clear
          </button>
        </div>
        {contextFiles.length === 0 ? (
          <div className="rounded-[14px] border-[1.5px] border-dashed border-[#D9D6EA] px-4 py-7 text-center">
            <File className="mx-auto h-5 w-5 text-[#6B7280]" strokeWidth={1.8} />
            <div className="mt-2 text-[13px] font-semibold text-[#374151]">No files or context yet</div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[#9CA3AF]">
              Attach files, links or add context
              <br />
              to get better responses.
            </p>
            <button
              onClick={onAddFile}
              className="mt-3 rounded-[8px] border border-[#ECECF4] px-3 py-1.5 text-[11.5px] font-semibold text-[#5B4DFF] transition-colors hover:bg-[#F6F5FB]"
            >
              Attach a file
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {contextFiles.map((f) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 rounded-[10px] border border-[#ECECF4] bg-white px-3 py-2.5"
              >
                <FileText className="h-4 w-4 shrink-0 text-[#5B4DFF]" strokeWidth={1.9} />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#111827]">{f}</span>
                <button
                  onClick={() => onRemoveFile(f)}
                  className="text-[#9CA3AF] transition-colors hover:text-[#111827]"
                  aria-label={`Remove ${f}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Suggested Prompts */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Suggested Prompts</h3>
          <motion.button
            animate={{ rotate: spin * 180 }}
            transition={{ duration: 0.4 }}
            onClick={() => {
              setSpin((s) => s + 1)
              const shuffled = [...promptPool].sort(() => Math.random() - 0.5)
              setPrompts(shuffled.slice(0, 5))
            }}
            className="text-[#6B7280] transition-colors hover:text-[#5B4DFF]"
            aria-label="Shuffle prompts"
          >
            <RotateCw className="h-4 w-4" strokeWidth={2} />
          </motion.button>
        </div>
        <div className="flex flex-col gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => onPrompt(p)}
              className="w-full rounded-[10px] border border-[#ECECF4] bg-white px-3.5 py-2.5 text-left text-[12.5px] font-medium text-[#374151] transition-all hover:border-[#C9C2F5] hover:bg-[#FBFAFF] hover:text-[#5B4DFF]"
            >
              {p}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ------------------------------ message view ------------------------------ */

function AiBlocks({ blocks }: { blocks: AiBlock[] }) {
  return (
    <div className="space-y-3.5">
      {blocks.map((b, i) =>
        b.type === 'text' ? (
          <p key={i} className="text-[14px] leading-[1.65] text-[#1F2937]">
            {b.text}
          </p>
        ) : (
          <ol key={i} className="space-y-3">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-3">
                <span className="w-4 shrink-0 pt-px text-[14px] font-medium leading-[1.65] text-[#1F2937]">
                  {j + 1}.
                </span>
                <div className="min-w-0">
                  <span className="text-[14px] font-semibold leading-[1.65] text-[#111827]">{it.title}</span>
                  <p className="text-[14px] leading-[1.65] text-[#1F2937]">{it.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  )
}

function MessageActions({
  msg,
  onCopy,
  onReact,
  onRegen,
  canRegen,
}: {
  msg: Message
  onCopy: () => void
  onReact: (r: 'up' | 'down') => void
  onRegen: () => void
  canRegen: boolean
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="ml-[40px] mt-2 flex items-center gap-1">
      <button
        onClick={() => {
          onCopy()
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B8A9A] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
        title="Copy response"
      >
        {copied ? <Check className="h-[15px] w-[15px] text-[#1F9D63]" /> : <Copy className="h-[15px] w-[15px]" strokeWidth={1.9} />}
      </button>
      <button
        onClick={() => onReact('up')}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#F3F2F9] ${
          msg.reaction === 'up' ? 'text-[#5B4DFF]' : 'text-[#8B8A9A] hover:text-[#111827]'
        }`}
        title="Good response"
      >
        <ThumbsUp className="h-[15px] w-[15px]" strokeWidth={1.9} fill={msg.reaction === 'up' ? 'currentColor' : 'none'} />
      </button>
      <button
        onClick={() => onReact('down')}
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#F3F2F9] ${
          msg.reaction === 'down' ? 'text-[#E1447A]' : 'text-[#8B8A9A] hover:text-[#111827]'
        }`}
        title="Bad response"
      >
        <ThumbsDown className="h-[15px] w-[15px]" strokeWidth={1.9} fill={msg.reaction === 'down' ? 'currentColor' : 'none'} />
      </button>
      {canRegen && (
        <button
          onClick={onRegen}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B8A9A] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
          title="Regenerate response"
        >
          <RefreshCw className="h-[15px] w-[15px]" strokeWidth={1.9} />
        </button>
      )}
      <button
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B8A9A] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
        title="More"
      >
        <MoreHorizontal className="h-[15px] w-[15px]" strokeWidth={1.9} />
      </button>
    </div>
  )
}

function TypingRow() {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ECECF4] bg-white shadow-[0_1px_4px_rgba(70,60,140,0.08)]">
        <Logo size={17} />
      </span>
      <div className="flex items-center gap-1.5 rounded-[14px] rounded-tl-[4px] border border-[#ECECF4] bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(70,60,140,0.06)]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#8B7CF6]"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}

/* --------------------------------- chat ----------------------------------- */

export default function ChatScreen({ onMic }: { onMic: () => void }) {
  const [convos, setConvos] = useState<Convo[]>(seedConvos)
  const [activeId, setActiveId] = useState(1)
  const [query, setQuery] = useState('')
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const [webSearch, setWebSearch] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [contextFiles, setContextFiles] = useState<string[]>([])
  const [fileCount, setFileCount] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(100)

  const active = convos.find((c) => c.id === activeId) ?? convos[0]

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [active?.messages.length, typing, activeId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return convos
    return convos.filter(
      (c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q),
    )
  }, [convos, query])

  const groups: { label: string; items: Convo[] }[] = [
    { label: 'Today', items: filtered.filter((c) => c.group === 'Today') },
    { label: 'Yesterday', items: filtered.filter((c) => c.group === 'Yesterday') },
    { label: 'Previous 7 days', items: filtered.filter((c) => c.group === 'Previous 7 days') },
  ]

  function updateActive(patch: Partial<Convo>) {
    setConvos((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...patch } : c)))
  }

  function newChat() {
    const id = nextId.current++
    const convo: Convo = {
      id,
      title: 'New conversation',
      preview: 'Ask anything to get started…',
      time: nowTime(),
      group: 'Today',
      messages: [],
    }
    setConvos((prev) => [convo, ...prev])
    setActiveId(id)
    setQuery('')
  }

  function send(text: string) {
    const body = text.trim()
    if (!body || typing) return
    const t = nowTime()
    const userMsg: Message = { id: nextId.current++, role: 'user', time: t, text: body }

    setConvos((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [...c.messages, userMsg],
              preview: body.length > 34 ? body.slice(0, 34).trimEnd() + '...' : body,
              time: t,
              group: 'Today',
              title: c.title === 'New conversation' ? (body.length > 30 ? body.slice(0, 30).trimEnd() + '…' : body) : c.title,
            }
          : c,
      ),
    )
    // newest conversation floats to the top of Today
    setConvos((prev) => {
      const me = prev.find((c) => c.id === activeId)
      if (!me) return prev
      return [me, ...prev.filter((c) => c.id !== activeId)]
    })
    setInput('')

    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      const aiMsg: Message = {
        id: nextId.current++,
        role: 'ai',
        time: nowTime(),
        blocks: makeReply(body),
        reaction: null,
      }
      setConvos((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c
          return {
            ...c,
            messages: [...c.messages, aiMsg],
            preview:
              aiMsg.blocks?.[0].type === 'text'
                ? aiMsg.blocks[0].text.slice(0, 34) + '...'
                : 'Here’s what I found...',
          }
        }),
      )
    }, 1400)
  }

  function regenerate() {
    if (!active || typing) return
    const lastAi = [...active.messages].reverse().find((m) => m.role === 'ai')
    if (!lastAi) return
    const lastUser = [...active.messages].reverse().find((m) => m.role === 'user')
    setConvos((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, messages: c.messages.filter((m) => m.id !== lastAi.id) } : c)),
    )
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      const aiMsg: Message = {
        id: nextId.current++,
        role: 'ai',
        time: nowTime(),
        blocks: makeReply(lastUser?.text ?? 'this topic', 1),
        reaction: null,
      }
      setConvos((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: [...c.messages, aiMsg] } : c)),
      )
    }, 1400)
  }

  function copyMessage(msg: Message) {
    let text = msg.text ?? ''
    if (msg.blocks) {
      text = msg.blocks
        .map((b) =>
          b.type === 'text' ? b.text : b.items.map((it, i) => `${i + 1}. ${it.title} — ${it.desc}`).join('\n'),
        )
        .join('\n\n')
    }
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  function attachFile() {
    const names = ['project-brief.pdf', 'lecture-notes.pdf', 'data-sheet.csv']
    const name = names[fileCount % names.length]
    setFileCount((n) => n + 1)
    setContextFiles((prev) => (prev.includes(name) ? prev : [...prev, name]))
  }

  const hasMessages = (active?.messages.length ?? 0) > 0

  return (
    <div className="flex h-full min-h-0">
      {/* ------------------------- conversation list ------------------------- */}
      <div className="flex w-[320px] shrink-0 flex-col border-r border-[#ECECF4] bg-white">
        <div className="flex items-center justify-between px-4 pb-3 pt-5">
          <h2 className="px-1 text-[21px] font-bold tracking-tight text-[#111827]">Chat</h2>
          <button
            onClick={newChat}
            title="New conversation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
        <div className="px-4 pb-2">
          <div className="flex h-10 items-center gap-2 rounded-[10px] bg-[#F3F2F9] px-3 focus-within:ring-2 focus-within:ring-[#DDD6FF]">
            <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1">
          {filtered.length === 0 && (
            <div className="mt-10 text-center">
              <MessageCircle className="mx-auto h-6 w-6 text-[#C4C4D4]" strokeWidth={1.8} />
              <p className="mt-2 text-[12.5px] font-medium text-[#9CA3AF]">
                No conversations match “{query.trim()}”
              </p>
            </div>
          )}
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <div key={g.label} className="mb-2">
                  <div className="px-2 pb-1.5 pt-3 text-[12.5px] font-semibold text-[#4B5563]">{g.label}</div>
                  <div className="flex flex-col gap-0.5">
                    {g.items.map((c) => {
                      const isActive = c.id === activeId
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveId(c.id)}
                          className={`flex w-full items-start gap-2.5 rounded-[12px] px-2.5 py-2.5 text-left transition-colors ${
                            isActive ? 'bg-[#EEEDFC]' : 'hover:bg-[#F6F5FB]'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${
                              isActive ? 'bg-white text-[#5B4DFF] shadow-[0_1px_3px_rgba(70,60,140,0.10)]' : 'text-[#6B7280]'
                            }`}
                          >
                            <MessageCircle className="h-[17px] w-[17px]" strokeWidth={1.9} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span
                                className={`truncate text-[13.5px] font-semibold ${
                                  isActive ? 'text-[#111827]' : 'text-[#1F2937]'
                                }`}
                              >
                                {c.title}
                              </span>
                              <span className="flex shrink-0 items-center gap-1">
                                {c.pinned && <Pin className="h-3 w-3 fill-[#374151] text-[#374151]" />}
                                <span className="text-[11px] font-medium text-[#9CA3AF]">{c.time}</span>
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-[#9CA3AF]">{c.preview}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ),
          )}
        </div>
      </div>

      {/* ----------------------------- main chat ----------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#FAFAFD]">
        {/* header */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#ECECF4] bg-white px-6">
          <div className="flex items-center gap-3.5">
            <Logo size={40} />
            <div className="leading-tight">
              <div className="text-[19px] font-bold tracking-tight text-[#111827]">Zikzik AI</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#9CA3AF]">
                <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                Online • Ready to assist
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={newChat}
              className="flex items-center gap-2 rounded-[10px] border border-[#ECECF4] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#111827] shadow-[0_1px_3px_rgba(70,60,140,0.06)] transition-colors hover:bg-[#F6F5FB]"
            >
              <SquarePen className="h-4 w-4" strokeWidth={2} />
              New chat
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6B7280] transition-colors hover:bg-[#F3F2F9]"
                title="Conversation options"
              >
                <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full z-40 mt-1.5 w-56 rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                    >
                      <button
                        onClick={() => {
                          updateActive({ pinned: !active?.pinned })
                          setMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                      >
                        <Pin className="h-4 w-4 text-[#6B7280]" strokeWidth={1.9} />
                        {active?.pinned ? 'Unpin conversation' : 'Pin conversation'}
                      </button>
                      <button
                        onClick={() => {
                          updateActive({ messages: [], preview: 'Ask anything to get started…' })
                          setMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                      >
                        <Eraser className="h-4 w-4 text-[#6B7280]" strokeWidth={1.9} />
                        Clear messages
                      </button>
                      <button
                        onClick={() => {
                          const remaining = convos.filter((c) => c.id !== activeId)
                          setConvos(remaining)
                          setActiveId(remaining[0]?.id ?? 0)
                          if (remaining.length === 0) newChat()
                          setMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#DC2626] transition-colors hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                        Delete conversation
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {!hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Logo size={56} />
              <h3 className="mt-5 text-[18px] font-bold tracking-tight text-[#111827]">
                How can I help you today?
              </h3>
              <p className="mt-1 text-[13px] text-[#9CA3AF]">
                Ask anything, attach files, or try a suggested prompt.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {promptPool.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => setInput(p)}
                    className="rounded-full border border-[#ECECF4] bg-white px-4 py-2 text-[12.5px] font-medium text-[#374151] shadow-[0_1px_3px_rgba(70,60,140,0.05)] transition-colors hover:border-[#C9C2F5] hover:text-[#5B4DFF]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-[760px] flex-col gap-5">
              {active.messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className="mb-1.5 px-1 text-[11.5px] font-medium text-[#9CA3AF]">{m.time}</span>
                  <div className={`flex max-w-[86%] items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {m.role === 'ai' && (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ECECF4] bg-white shadow-[0_1px_4px_rgba(70,60,140,0.08)]">
                        <Logo size={17} />
                      </span>
                    )}
                    {m.role === 'user' ? (
                      <div className="rounded-[14px] rounded-tr-[4px] bg-[#E9E2FD] px-4 py-3 text-[14px] leading-[1.6] text-[#1F2338]">
                        {m.text}
                      </div>
                    ) : (
                      <div className="rounded-[14px] rounded-tl-[4px] border border-[#ECECF4] bg-white px-5 py-4 shadow-[0_1px_4px_rgba(70,60,140,0.06)]">
                        <AiBlocks blocks={m.blocks ?? []} />
                      </div>
                    )}
                    {m.role === 'user' && (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF] text-[11px] font-bold text-white">
                        R
                      </span>
                    )}
                  </div>
                  {m.role === 'ai' && (
                    <MessageActions
                      msg={m}
                      onCopy={() => copyMessage(m)}
                      onReact={(r) =>
                        setConvos((prev) =>
                          prev.map((c) =>
                            c.id === activeId
                              ? {
                                  ...c,
                                  messages: c.messages.map((x) =>
                                    x.id === m.id ? { ...x, reaction: x.reaction === r ? null : r } : x,
                                  ),
                                }
                              : c,
                          ),
                        )
                      }
                      onRegen={regenerate}
                      canRegen={m.id === active.messages[active.messages.length - 1]?.id}
                    />
                  )}
                </motion.div>
              ))}
              {typing && <TypingRow />}
            </div>
          )}
        </div>

        {/* composer */}
        <div className="shrink-0 px-8 pb-5">
          <div className="mx-auto max-w-[760px] rounded-[16px] border border-[#ECECF4] bg-white p-4 shadow-[0_4px_16px_rgba(70,60,140,0.07)]">
            {(activeTools.length > 0 || webSearch) && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {webSearch && (
                  <span className="flex items-center gap-1.5 rounded-full bg-[#EEEDFC] px-3 py-1 text-[11.5px] font-semibold text-[#5B4DFF]">
                    <Crosshair className="h-3 w-3" strokeWidth={2.2} />
                    Search the web
                    <button onClick={() => setWebSearch(false)} aria-label="Disable web search">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {activeTools.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 rounded-full bg-[#EEEDFC] px-3 py-1 text-[11.5px] font-semibold text-[#5B4DFF]"
                  >
                    {t}
                    <button onClick={() => setActiveTools((prev) => prev.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              rows={1}
              placeholder="Ask Zikzik AI anything..."
              className="max-h-[120px] w-full resize-none bg-transparent text-[14px] leading-[1.6] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            />
            <div className="mt-2.5 flex items-center gap-1">
              <button
                onClick={attachFile}
                className="flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium text-[#4B5563] transition-colors hover:bg-[#F3F2F9]"
              >
                <Paperclip className="h-4 w-4" strokeWidth={1.9} />
                Attach
              </button>
              <button
                onClick={() => setWebSearch((w) => !w)}
                className={`flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  webSearch ? 'bg-[#EEEDFC] text-[#5B4DFF]' : 'text-[#4B5563] hover:bg-[#F3F2F9]'
                }`}
              >
                <Globe className="h-4 w-4" strokeWidth={1.9} />
                Search web
              </button>
              <div className="relative">
                <button
                  onClick={() => setToolsOpen((o) => !o)}
                  className={`flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                    toolsOpen ? 'bg-[#F3F2F9] text-[#111827]' : 'text-[#4B5563] hover:bg-[#F3F2F9]'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.9} />
                  Tools
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {toolsOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setToolsOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.14 }}
                        className="absolute bottom-full left-0 z-40 mb-2 w-60 rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                      >
                        {toolList.map((t) => {
                          const isWeb = t.label === 'Search the web'
                          const activeT = isWeb ? webSearch : activeTools.includes(t.label)
                          return (
                            <button
                              key={t.label}
                              onClick={() => {
                                if (isWeb) setWebSearch((w) => !w)
                                else
                                  setActiveTools((prev) =>
                                    prev.includes(t.label) ? prev.filter((x) => x !== t.label) : [...prev, t.label],
                                  )
                                setToolsOpen(false)
                              }}
                              className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                            >
                              <t.icon className="h-4 w-4 text-[#6B7280]" strokeWidth={1.9} />
                              <span className="flex-1">{t.label}</span>
                              {activeT && <Check className="h-4 w-4 text-[#5B4DFF]" strokeWidth={2.2} />}
                            </button>
                          )
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="ml-auto flex items-center gap-2.5">
                <span className="flex items-center gap-1">
                  <kbd className="rounded-[6px] border border-[#E7E5F2] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                    Ctrl
                  </kbd>
                  <kbd className="rounded-[6px] border border-[#E7E5F2] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                    <CornerDownLeft className="h-3 w-3" />
                  </kbd>
                </span>
                <button
                  onClick={onMic}
                  title="Open Voice Mode"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16182B] text-white shadow-[0_3px_10px_rgba(22,24,43,0.25)] transition-transform hover:scale-105 active:scale-95"
                >
                  <Mic className="h-[17px] w-[17px]" strokeWidth={2} />
                </button>
                <button
                  onClick={() => send(input)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF] text-white shadow-[0_4px_12px_rgba(106,79,255,0.35)] transition-all hover:scale-105 active:scale-95"
                  title="Send message"
                >
                  <ArrowUp className="h-[17px] w-[17px]" strokeWidth={2.4} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------- right panel ---------------------------- */}
      <RightPanel
        activeTools={activeTools}
        onToggleTool={(t) =>
          setActiveTools((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
        }
        webSearch={webSearch}
        onToggleWeb={() => setWebSearch((w) => !w)}
        contextFiles={contextFiles}
        onAddFile={attachFile}
        onRemoveFile={(f) => setContextFiles((prev) => prev.filter((x) => x !== f))}
        onPrompt={(p) => {
          setInput(p)
          document.querySelector<HTMLTextAreaElement>('textarea')?.focus()
        }}
      />
    </div>
  )
}

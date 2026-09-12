import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudUpload,
  Folder,
  FolderPlus,
  FilePlus,
  ScanLine,
  Share2,
  Star,
  Clock,
  Trash2,
  LayoutGrid,
  List,
  Image,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreVertical,
  Check,
  X,
  Pencil,
  Download,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-react'

/* --------------------------------- model ---------------------------------- */

type Folder = { id: number; name: string; tint: string; count: number; modified: number }

type DocFile = {
  id: number
  name: string
  folder: number | null
  ext: string
  size: number
  modified: number
  starred: boolean
  shared: boolean
  trashed: boolean
}

type Activity = { id: number; kind: 'upload' | 'edit' | 'share'; text: string; time: string }

const TINTS: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#E7F0FF', fg: '#2F6DF6' },
  purple: { bg: '#EFECFE', fg: '#6D4AFF' },
  green: { bg: '#E4F6EC', fg: '#10B981' },
  amber: { bg: '#FFF3E0', fg: '#D97706' },
  pink: { bg: '#FDE8F1', fg: '#EC4899' },
  red: { bg: '#FDE8EC', fg: '#E11D48' },
}

const TYPE_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  pdf: { label: 'PDF', bg: '#FDE8EC', fg: '#E11D48' },
  docx: { label: 'DOC', bg: '#E7F0FF', fg: '#2F6DF6' },
  doc: { label: 'DOC', bg: '#E7F0FF', fg: '#2F6DF6' },
  txt: { label: 'TXT', bg: '#E7F0FF', fg: '#2F6DF6' },
  xlsx: { label: 'XLS', bg: '#E4F6EC', fg: '#10B981' },
  csv: { label: 'CSV', bg: '#E4F6EC', fg: '#10B981' },
  pptx: { label: 'PPT', bg: '#FFF3E0', fg: '#D97706' },
  png: { label: '', bg: '#F3F4F6', fg: '#6B7280' },
  jpg: { label: '', bg: '#F3F4F6', fg: '#6B7280' },
  jpeg: { label: '', bg: '#F3F4F6', fg: '#6B7280' },
  webp: { label: '', bg: '#F3F4F6', fg: '#6B7280' },
}

const typeStyle = (ext: string) => TYPE_STYLE[ext.toLowerCase()] ?? { label: 'FILE', bg: '#F3F4F6', fg: '#6B7280' }
const isImageExt = (ext: string) => ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext.toLowerCase())

const GB = 1024 ** 3
const MB = 1024 ** 2
const KB = 1024

function fmtSize(bytes: number) {
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`
  if (bytes >= KB) return `${Math.round(bytes / KB)} KB`
  return `${bytes} B`
}

function fmtModified(ts: number) {
  return (
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

function fmtClock(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function extOf(name: string) {
  const i = name.lastIndexOf('.')
  return i === -1 ? 'file' : name.slice(i + 1).toLowerCase()
}

function FileTypeIcon({ ext, className = 'h-9 w-9' }: { ext: string; className?: string }) {
  const s = typeStyle(ext)
  if (isImageExt(ext)) {
    return (
      <span className={`flex items-center justify-center rounded-[10px] ${className}`} style={{ background: s.bg }}>
        <Image className="h-[18px] w-[18px]" style={{ color: s.fg }} strokeWidth={2} />
      </span>
    )
  }
  return (
    <span
      className={`flex items-center justify-center rounded-[10px] text-[9px] font-extrabold ${className}`}
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  )
}

/* --------------------------------- seeds ---------------------------------- */

let idSeq = 4000
const now = Date.now()
const H = 3600000
const D = 24 * H

const seedData = () => ({
  folders: [
    { id: idSeq++, name: 'Lecture Notes', tint: 'blue', count: 24, modified: now - 2 * H },
    { id: idSeq++, name: 'Assignments', tint: 'purple', count: 12, modified: now - 5 * H },
    { id: idSeq++, name: 'Projects', tint: 'green', count: 8, modified: now - 1 * D },
    { id: idSeq++, name: 'Resources', tint: 'amber', count: 16, modified: now - 2 * D },
    { id: idSeq++, name: 'Personal', tint: 'pink', count: 6, modified: now - 3 * D },
    { id: idSeq++, name: 'Lab Records', tint: 'blue', count: 14, modified: now - 4 * D },
    { id: idSeq++, name: 'Important', tint: 'red', count: 9, modified: now - 5 * D },
  ] as Folder[],
  files: [
    { id: idSeq++, name: 'Engineering Graphics Unit 1.pdf', folder: 4000, ext: 'pdf', size: 2.4 * MB, modified: now - 3 * H, starred: true, shared: false, trashed: false },
    { id: idSeq++, name: 'Lab Report - Experiment 3.docx', folder: 4005, ext: 'docx', size: 1.1 * MB, modified: now - 1 * D - 2 * H, starred: false, shared: true, trashed: false },
    { id: idSeq++, name: 'Project Plan.xlsx', folder: 4002, ext: 'xlsx', size: 856 * KB, modified: now - 2 * D - 3 * H, starred: false, shared: false, trashed: false },
    { id: idSeq++, name: 'Electron Devices Notes.pdf', folder: 4000, ext: 'pdf', size: 3.2 * MB, modified: now - 3 * D - 2 * H, starred: true, shared: false, trashed: false },
    { id: idSeq++, name: 'Circuit Diagram.png', folder: 4003, ext: 'png', size: 420 * KB, modified: now - 4 * D - 5 * H, starred: false, shared: false, trashed: false },
    { id: idSeq++, name: 'To Do List - Semester 3.docx', folder: 4004, ext: 'docx', size: 64 * KB, modified: now - 5 * D - 1 * H, starred: false, shared: false, trashed: false },
  ] as DocFile[],
  activity: [
    { id: idSeq++, kind: 'upload' as const, text: 'Uploaded Engineering Graphics Unit 1.pdf', time: fmtClock(now - 3 * H) },
    { id: idSeq++, kind: 'edit' as const, text: 'Edited Project Plan.xlsx', time: 'Yesterday, 1:02 PM' },
    { id: idSeq++, kind: 'share' as const, text: 'Shared Lab Report - Experiment 3.docx', time: 'Sep 11, 2026' },
  ] as Activity[],
})

/* -------------------------------- storage --------------------------------- */

const STORAGE_KEY = 'zikzik-docs-v1'

function loadDocs(): { folders: Folder[]; files: DocFile[]; activity: Activity[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.files)) return parsed
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

/* ------------------------------- file menu -------------------------------- */

function FileMenu({
  f,
  folders,
  close,
  onRename,
  onShare,
  onDownload,
  onTrash,
  onRestore,
  onDeleteForever,
  onMoveTo,
}: {
  f: DocFile
  folders: Folder[]
  close: () => void
  onRename: () => void
  onShare: () => void
  onDownload: () => void
  onTrash: () => void
  onRestore: () => void
  onDeleteForever: () => void
  onMoveTo: (folderId: number | null) => void
}) {
  const [moveOpen, setMoveOpen] = useState(false)
  const item = 'flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium'

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.13 }}
      className="absolute right-0 top-full z-40 mt-1 w-48 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
    >
      {f.trashed ? (
        <>
          <button
            onClick={() => {
              onRestore()
              close()
            }}
            className={`${item} text-[#1F2937] hover:bg-[#F6F5FB]`}
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#6B7280]" /> Restore
          </button>
          <button
            onClick={() => {
              onDeleteForever()
              close()
            }}
            className={`${item} text-[#DC2626] hover:bg-[#FEF2F2]`}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete forever
          </button>
        </>
      ) : (
        <>
          <button onClick={() => { onRename(); close() }} className={`${item} text-[#1F2937] hover:bg-[#F6F5FB]`}>
            <Pencil className="h-3.5 w-3.5 text-[#6B7280]" /> Rename
          </button>
          <button onClick={() => { onShare(); close() }} className={`${item} text-[#1F2937] hover:bg-[#F6F5FB]`}>
            <Share2 className="h-3.5 w-3.5 text-[#6B7280]" /> Share
          </button>
          <button onClick={() => { onDownload(); close() }} className={`${item} text-[#1F2937] hover:bg-[#F6F5FB]`}>
            <Download className="h-3.5 w-3.5 text-[#6B7280]" /> Download
          </button>
          <div className="relative">
            <button
              onClick={() => setMoveOpen((o) => !o)}
              className={`${item} justify-between text-[#1F2937] hover:bg-[#F6F5FB]`}
            >
              <span className="flex items-center gap-2">
                <Folder className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={2} /> Move to
              </span>
              <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />
            </button>
            {moveOpen && (
              <div className="absolute right-full top-0 z-50 mr-1 max-h-52 w-40 overflow-y-auto rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]">
                <button
                  onClick={() => {
                    onMoveTo(null)
                    close()
                  }}
                  className={`${item} text-[#1F2937] hover:bg-[#F6F5FB]`}
                >
                  Unsorted
                </button>
                {folders.map((fo) => (
                  <button
                    key={fo.id}
                    onClick={() => {
                      onMoveTo(fo.id)
                      close()
                    }}
                    className={`${item} text-[#1F2937] hover:bg-[#F6F5FB]`}
                  >
                    {fo.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { onTrash(); close() }} className={`${item} text-[#DC2626] hover:bg-[#FEF2F2]`}>
            <Trash2 className="h-3.5 w-3.5" /> Move to trash
          </button>
        </>
      )}
    </motion.div>
  )
}

/* ================================ the page ================================ */

export default function DocumentsScreen() {
  const initial = useRef(loadDocs())
  const [folders, setFolders] = useState<Folder[]>(initial.current.folders)
  const [files, setFiles] = useState<DocFile[]>(initial.current.files)
  const [activity, setActivity] = useState<Activity[]>(initial.current.activity)

  const [tab, setTab] = useState<'all' | 'recent' | 'shared' | 'starred' | 'trash'>('all')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useState<'modified' | 'name' | 'size'>('modified')
  const [sortOpen, setSortOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [folderFilter, setFolderFilter] = useState<number | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [modal, setModal] = useState<
    | { kind: 'folder'; name: string; tint: string }
    | { kind: 'doc'; name: string }
    | { kind: 'rename'; target: 'folder' | 'file'; id: number; name: string }
    | null
  >(null)
  const [fileMenu, setFileMenu] = useState<number | null>(null)
  const [folderMenu, setFolderMenu] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders, files, activity }))
    } catch {
      /* unavailable */
    }
  }, [folders, files, activity])

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }

  function logActivity(kind: Activity['kind'], text: string) {
    setActivity((prev) => [{ id: idSeq++, kind, text, time: fmtClock(Date.now()) }, ...prev].slice(0, 6))
  }

  /* ------------------------------- upload -------------------------------- */

  function addFiles(list: FileList | File[]) {
    const arr = Array.from(list)
    if (arr.length === 0) return
    const added: DocFile[] = arr.map((f) => ({
      id: idSeq++,
      name: f.name,
      folder: null,
      ext: extOf(f.name),
      size: f.size || 8 * KB,
      modified: Date.now(),
      starred: false,
      shared: false,
      trashed: false,
    }))
    setFiles((prev) => [...added, ...prev])
    showToast(`Uploaded ${arr.length} file${arr.length === 1 ? '' : 's'}`)
    logActivity('upload', `Uploaded ${added[0].name}${arr.length > 1 ? ` +${arr.length - 1} more` : ''}`)
  }

  function createDocument(name: string) {
    const clean = name.trim().replace(/\.(docx?|txt)$/i, '') || 'Untitled Document'
    const file: DocFile = {
      id: idSeq++,
      name: `${clean}.docx`,
      folder: null,
      ext: 'docx',
      size: 12 * KB,
      modified: Date.now(),
      starred: false,
      shared: false,
      trashed: false,
    }
    setFiles((prev) => [file, ...prev])
    logActivity('edit', `Created ${file.name}`)
    showToast('Document created')
  }

  function scanDocument() {
    const file: DocFile = {
      id: idSeq++,
      name: `Scanned_Doc_${new Date().toISOString().slice(0, 10)}.png`,
      folder: null,
      ext: 'png',
      size: 640 * KB,
      modified: Date.now(),
      starred: false,
      shared: false,
      trashed: false,
    }
    setFiles((prev) => [file, ...prev])
    showToast('Document scanned')
    logActivity('upload', `Uploaded ${file.name}`)
  }

  /* ----------------------------- file actions ----------------------------- */

  function toggleStar(id: number) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)))
  }

  function shareFile(f: DocFile) {
    setFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, shared: true } : x)))
    logActivity('share', `Shared ${f.name}`)
    showToast('Sharing link copied')
    setFileMenu(null)
  }

  function trashFiles(ids: number[]) {
    setFiles((prev) => prev.map((f) => (ids.includes(f.id) ? { ...f, trashed: true, starred: false } : f)))
    setSelected([])
    setFileMenu(null)
    showToast(ids.length === 1 ? 'Moved to trash' : `${ids.length} files moved to trash`)
  }

  function restoreFile(id: number) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, trashed: false } : f)))
    showToast('File restored')
  }

  function deleteForever(id: number) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    showToast('File deleted permanently')
  }

  function moveToFolder(id: number, folderId: number | null) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, folder: folderId } : f)))
    const f = folders.find((x) => x.id === folderId)
    showToast(f ? `Moved to ${f.name}` : 'Moved to Unsorted')
  }

  function renameTarget(kind: 'folder' | 'file', id: number, current: string) {
    setModal({ kind: 'rename', target: kind, id, name: current })
    setFileMenu(null)
    setFolderMenu(null)
  }

  function commitRename() {
    if (!modal || modal.kind !== 'rename') return
    const name = modal.name.trim()
    if (!name) return
    if (modal.target === 'folder') {
      setFolders((prev) => prev.map((f) => (f.id === modal.id ? { ...f, name } : f)))
    } else {
      setFiles((prev) => prev.map((f) => (f.id === modal.id ? { ...f, name, modified: Date.now() } : f)))
      logActivity('edit', `Renamed ${name}`)
    }
    setModal(null)
    showToast('Renamed')
  }

  function deleteFolder(id: number) {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setFiles((prev) => prev.map((f) => (f.folder === id ? { ...f, folder: null } : f)))
    if (folderFilter === id) setFolderFilter(null)
    setFolderMenu(null)
    showToast('Folder deleted — files kept in Unsorted')
  }

  /* ------------------------------ derived -------------------------------- */

  const folderName = (id: number | null) =>
    id == null ? 'Unsorted' : folders.find((f) => f.id === id)?.name ?? 'Unsorted'

  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase()
    const weekAgo = Date.now() - 7 * D
    return files
      .filter((f) => {
        if (tab === 'trash') return f.trashed
        if (f.trashed) return false
        if (tab === 'recent') return f.modified >= weekAgo
        if (tab === 'shared') return f.shared
        if (tab === 'starred') return f.starred
        return true
      })
      .filter((f) => (folderFilter != null ? f.folder === folderFilter : true))
      .filter((f) => (q ? f.name.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'size') return b.size - a.size
        return b.modified - a.modified
      })
  }, [files, tab, folderFilter, query, sortBy])

  const visibleFolders = useMemo(() => {
    const q = query.trim().toLowerCase()
    return folders
      .filter((f) => (q ? f.name.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'size') return b.count - a.count
        return b.modified - a.modified
      })
  }, [folders, query, sortBy])

  const stats = useMemo(() => {
    const baseDocs = 1.4 * GB
    const baseImages = 820 * MB
    const baseVideos = 600 * MB
    const baseOthers = 380 * MB
    const extra = files.filter((f) => !f.trashed).reduce((s, f) => s + f.size, 0)
    const used = baseDocs + baseImages + baseVideos + baseOthers + extra
    return {
      used,
      pct: Math.min(100, Math.round((used / (15 * GB)) * 100)),
      docs: baseDocs + extra,
      images: baseImages,
      videos: baseVideos,
      others: baseOthers,
    }
  }, [files])

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = { pdf: 24, docs: 18, sheets: 6, pres: 4, images: 12, others: 8 }
    files
      .filter((f) => !f.trashed)
      .forEach((f) => {
        const e = f.ext.toLowerCase()
        if (e === 'pdf') m.pdf++
        else if (['docx', 'doc', 'txt'].includes(e)) m.docs++
        else if (['xlsx', 'csv'].includes(e)) m.sheets++
        else if (e === 'pptx') m.pres++
        else if (isImageExt(e)) m.images++
        else m.others++
      })
    return m
  }, [files])

  const showFoldersSection = tab === 'all' && folderFilter == null
  const sortLabels = { modified: 'Last modified', name: 'Name A–Z', size: 'Size' }

  const fileMenuHandlers = (f: DocFile) => ({
    f,
    folders,
    close: () => setFileMenu(null),
    onRename: () => renameTarget('file', f.id, f.name),
    onShare: () => shareFile(f),
    onDownload: () => showToast('Preparing download…'),
    onTrash: () => trashFiles([f.id]),
    onRestore: () => restoreFile(f.id),
    onDeleteForever: () => deleteForever(f.id),
    onMoveTo: (folderId: number | null) => moveToFolder(f.id, folderId),
  })

  /* -------------------------------- render ------------------------------- */

  const tabs = [
    { key: 'all', label: 'All Files', icon: LayoutGrid },
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'shared', label: 'Shared', icon: Share2 },
    { key: 'starred', label: 'Starred', icon: Star },
    { key: 'trash', label: 'Trash', icon: Trash2 },
  ] as const

  const starBtn = (f: DocFile, className = 'h-8 w-8') => (
    <button
      onClick={() => toggleStar(f.id)}
      className={`flex ${className} items-center justify-center rounded-lg transition-colors hover:bg-[#FFF8E6] ${
        f.starred ? 'text-[#F5B50A]' : 'text-[#C4C4D4] hover:text-[#F5B50A]'
      }`}
      title={f.starred ? 'Remove star' : 'Add star'}
    >
      <Star className="h-[17px] w-[17px]" fill={f.starred ? 'currentColor' : 'none'} strokeWidth={1.8} />
    </button>
  )

  const menuBtn = (f: DocFile, always = false) => (
    <span className="relative">
      <button
        onClick={() => setFileMenu(fileMenu === f.id ? null : f.id)}
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827] ${
          always ? '' : 'md:opacity-0 md:group-hover:opacity-100'
        }`}
        aria-label="File options"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      <AnimatePresence>{fileMenu === f.id && <FileMenu {...fileMenuHandlers(f)} />}</AnimatePresence>
    </span>
  )

  return (
    <div
      className="flex h-full min-h-0"
      onDragEnter={(e) => {
        e.preventDefault()
        dragDepth.current++
        if (e.dataTransfer.types.includes('Files')) setDragOver(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        dragDepth.current--
        if (dragDepth.current <= 0) setDragOver(false)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        dragDepth.current = 0
        setDragOver(false)
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
      }}
    >
      {/* ============================== main column ============================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="shrink-0 px-6 pt-5 xl:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[#111827]">Documents</h1>
              <p className="mt-0.5 text-[13.5px] text-[#6B7280]">Store, organize and access all your files in one place.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-[10px] border border-[#ECECF4] bg-white">
                {(
                  [
                    { key: 'list', icon: List },
                    { key: 'grid', icon: LayoutGrid },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    className={`flex h-10 w-10 items-center justify-center transition-colors ${
                      view === v.key ? 'bg-[#EEEDFC] text-[#5B4DFF]' : 'text-[#6B7280] hover:bg-[#F6F5FB]'
                    }`}
                    title={v.key === 'list' ? 'List view' : 'Grid view'}
                  >
                    <v.icon className="h-4 w-4" strokeWidth={2} />
                  </button>
                ))}
              </div>
              <div className="relative">
                <div className="flex overflow-hidden rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] shadow-[0_4px_12px_rgba(106,79,255,0.3)]">
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="flex items-center gap-1.5 py-2.5 pl-4 pr-2.5 text-[13px] font-semibold text-white"
                  >
                    <Upload className="h-4 w-4" strokeWidth={2.4} />
                    Upload
                  </button>
                  <button
                    onClick={() => setUploadOpen((o) => !o)}
                    className="flex items-center border-l border-white/25 px-2 text-white"
                    aria-label="More upload options"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${uploadOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {uploadOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setUploadOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 top-full z-40 mt-1.5 w-52 rounded-[12px] border border-[#ECECF4] bg-white p-1.5 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                      >
                        {[
                          { label: 'Upload files…', icon: CloudUpload, action: () => fileInput.current?.click() },
                          { label: 'Scan Document', icon: ScanLine, action: scanDocument },
                          { label: 'Create Document', icon: FilePlus, action: () => setModal({ kind: 'doc', name: '' }) },
                        ].map((it) => (
                          <button
                            key={it.label}
                            onClick={() => {
                              it.action()
                              setUploadOpen(false)
                            }}
                            className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[13px] font-medium text-[#1F2937] transition-colors hover:bg-[#F6F5FB]"
                          >
                            <it.icon className="h-4 w-4 text-[#6B7280]" strokeWidth={2} />
                            {it.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
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
                {t.key === 'trash' && files.some((f) => f.trashed) && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      tab === t.key ? 'bg-white/20' : 'bg-[#FDE8EC] text-[#E11D48]'
                    }`}
                  >
                    {files.filter((f) => f.trashed).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* action cards */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Upload Files',
                desc: (
                  <>
                    Drag & drop or <span className="font-semibold text-[#5B4DFF]">browse</span>
                  </>
                ),
                icon: CloudUpload,
                action: () => fileInput.current?.click(),
              },
              { title: 'New Folder', desc: 'Organize your files', icon: FolderPlus, action: () => setModal({ kind: 'folder', name: '', tint: 'blue' }) },
              { title: 'Create Document', desc: 'Start writing', icon: FilePlus, action: () => setModal({ kind: 'doc', name: '' }) },
              { title: 'Scan Document', desc: 'Use your camera', icon: ScanLine, action: scanDocument },
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

        <div className="min-h-0 flex-1 px-6 py-4 xl:px-8">
          {/* folder filter chip */}
          {folderFilter != null && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEEDFC] px-3 py-1.5 text-[12px] font-semibold text-[#5B4DFF]">
                Folder: {folderName(folderFilter)}
                <button onClick={() => setFolderFilter(null)} aria-label="Clear folder filter" className="hover:text-[#111827]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}

          {/* Folders */}
          {showFoldersSection && (
            <div className="mb-5">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[16px] font-bold tracking-tight text-[#111827]">Folders</h2>
                <div className="relative">
                  <button
                    onClick={() => setSortOpen((o) => !o)}
                    className="flex items-center gap-1 text-[12px] font-semibold text-[#6B7280] transition-colors hover:text-[#111827]"
                  >
                    Sort: {sortLabels[sortBy]}
                    <ChevronDown className="h-3.5 w-3.5" />
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
                          className="absolute right-0 top-full z-40 mt-1 w-44 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                        >
                          {(
                            [
                              { key: 'modified', label: 'Last modified' },
                              { key: 'name', label: 'Name A–Z' },
                              { key: 'size', label: 'Item count' },
                            ] as const
                          ).map((s) => (
                            <button
                              key={s.key}
                              onClick={() => {
                                setSortBy(s.key)
                                setSortOpen(false)
                              }}
                              className="flex w-full items-center justify-between rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                            >
                              {s.label}
                              {sortBy === s.key && <Check className="h-3.5 w-3.5 text-[#5B4DFF]" strokeWidth={2.4} />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
                {visibleFolders.map((f) => {
                  const t = TINTS[f.tint] ?? TINTS.blue
                  return (
                    <div
                      key={f.id}
                      onClick={() => setFolderFilter(f.id)}
                      className="group cursor-pointer rounded-[14px] border border-[#ECECF4] bg-white p-4 transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(70,60,140,0.10)]"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="h-8 w-8 shrink-0" style={{ color: t.fg }} fill="currentColor" strokeWidth={0} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold text-[#111827]">{f.name}</div>
                          <div className="text-[12px] text-[#9CA3AF]">{f.count} files</div>
                        </div>
                        <span className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setFolderMenu(folderMenu === f.id ? null : f.id)
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#F3F2F9] hover:text-[#111827]"
                            aria-label="Folder options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <AnimatePresence>
                            {folderMenu === f.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setFolderMenu(null)
                                  }}
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.13 }}
                                  className="absolute right-0 top-full z-40 mt-1 w-36 rounded-[10px] border border-[#ECECF4] bg-white p-1 shadow-[0_10px_30px_rgba(40,35,90,0.14)]"
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      renameTarget('folder', f.id, f.name)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#1F2937] hover:bg-[#F6F5FB]"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-[#6B7280]" /> Rename
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteFolder(f.id)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[12.5px] font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </span>
                      </div>
                    </div>
                  )
                })}
                <button
                  onClick={() => setModal({ kind: 'folder', name: '', tint: 'blue' })}
                  className="flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-[#D9D6EA] bg-white/60 p-4 text-[13.5px] font-semibold text-[#5B4DFF] transition-colors hover:border-[#B9A7FF] hover:bg-[#F6F3FF]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.4} />
                  New Folder
                </button>
              </div>
            </div>
          )}

          {/* Files */}
          <div>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[16px] font-bold tracking-tight text-[#111827]">
                {tab === 'trash'
                  ? 'Trash'
                  : tab === 'starred'
                    ? 'Starred Files'
                    : tab === 'shared'
                      ? 'Shared Files'
                      : tab === 'recent'
                        ? 'Recent Files'
                        : 'Files'}
                <span className="ml-2 text-[12px] font-medium text-[#9CA3AF]">{visibleFiles.length} items</span>
              </h2>
              <div className="flex h-9 w-56 items-center gap-2 rounded-[10px] border border-[#ECECF4] bg-white px-3 focus-within:border-[#B9A7FF]">
                <Search className="h-4 w-4 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search files…"
                  className="w-full bg-transparent text-[12.5px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
                />
                {query && (
                  <button onClick={() => setQuery('')} aria-label="Clear search">
                    <X className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  </button>
                )}
              </div>
            </div>

            {/* bulk bar */}
            {selected.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-[12px] border border-[#ECECF4] bg-[#EEEDFC] px-3.5 py-2">
                <span className="text-[12.5px] font-semibold text-[#5B4DFF]">{selected.length} selected</span>
                <button
                  onClick={() => {
                    selected.forEach((id) => {
                      const f = files.find((x) => x.id === id)
                      if (f && !f.starred) toggleStar(id)
                    })
                    showToast('Files starred')
                  }}
                  className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#374151] shadow-sm hover:bg-[#F6F5FB]"
                >
                  Star
                </button>
                <button
                  onClick={() => trashFiles(selected)}
                  className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#DC2626] shadow-sm hover:bg-[#FEF2F2]"
                >
                  Move to trash
                </button>
                <button
                  onClick={() => setSelected([])}
                  className="ml-auto text-[12px] font-semibold text-[#6B7280] hover:text-[#111827]"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-[16px] border border-[#ECECF4] bg-white">
              {visibleFiles.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-center">
                  {tab === 'trash' ? (
                    <Trash2 className="h-7 w-7 text-[#C4C4D4]" strokeWidth={1.6} />
                  ) : (
                    <Search className="h-7 w-7 text-[#C4C4D4]" strokeWidth={1.6} />
                  )}
                  <p className="mt-2 text-[13.5px] font-medium text-[#9CA3AF]">
                    {tab === 'trash' ? 'Trash is empty.' : 'No files match your search.'}
                  </p>
                </div>
              ) : view === 'list' ? (
                <>
                  <div className="hidden grid-cols-[44px_minmax(0,1fr)_110px_100px_180px_44px_40px] items-center border-b border-[#F0EFF7] px-5 py-2.5 md:grid">
                    <span>
                      <button
                        onClick={() =>
                          setSelected((prev) => (prev.length === visibleFiles.length ? [] : visibleFiles.map((f) => f.id)))
                        }
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors ${
                          selected.length === visibleFiles.length && visibleFiles.length > 0
                            ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]'
                            : 'border-[#D5CFEE] bg-white hover:border-[#7C5BFF]'
                        }`}
                        aria-label="Select all"
                      >
                        {selected.length === visibleFiles.length && visibleFiles.length > 0 && (
                          <Check className="h-3 w-3 text-white" strokeWidth={3.2} />
                        )}
                      </button>
                    </span>
                    {['Name', 'Type', 'Size', 'Modified'].map((h) => (
                      <span key={h} className="text-[12px] font-semibold text-[#9CA3AF]">
                        {h}
                      </span>
                    ))}
                    <span />
                    <span />
                  </div>

                  {visibleFiles.map((f) => {
                    const s = typeStyle(f.ext)
                    return (
                      <div
                        key={f.id}
                        className="group flex flex-col gap-2 border-b border-[#F0EFF7] px-5 py-3 transition-colors last:border-b-0 hover:bg-[#FAF9FF] md:grid md:grid-cols-[44px_minmax(0,1fr)_110px_100px_180px_44px_40px] md:items-center md:gap-0"
                      >
                        <span className="flex items-center">
                          <button
                            onClick={() =>
                              setSelected((prev) => (prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id]))
                            }
                            className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors ${
                              selected.includes(f.id)
                                ? 'border-transparent bg-gradient-to-br from-[#7C5BFF] to-[#4F7CFF]'
                                : 'border-[#D5CFEE] bg-white hover:border-[#7C5BFF]'
                            }`}
                            aria-label="Select file"
                          >
                            {selected.includes(f.id) && <Check className="h-3 w-3 text-white" strokeWidth={3.2} />}
                          </button>
                        </span>

                        <span className="flex min-w-0 items-center gap-3">
                          <FileTypeIcon ext={f.ext} />
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-semibold text-[#111827]">{f.name}</span>
                            <span className="block truncate text-[11.5px] text-[#9CA3AF]">
                              {f.trashed ? 'In trash' : folderName(f.folder)}
                            </span>
                          </span>
                        </span>

                        <span className="hidden text-[12.5px] font-semibold text-[#374151] md:block">
                          {f.ext.toUpperCase()}
                        </span>
                        <span className="hidden text-[12.5px] text-[#6B7280] md:block">{fmtSize(f.size)}</span>
                        <span className="hidden text-[12.5px] text-[#6B7280] md:block">{fmtModified(f.modified)}</span>

                        <span className="hidden justify-start md:flex">{starBtn(f)}</span>

                        <span className="flex justify-end">{menuBtn(f)}</span>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 2xl:grid-cols-4">
                  {visibleFiles.map((f) => (
                    <div
                      key={f.id}
                      className="relative rounded-[14px] border border-[#ECECF4] bg-white p-4 transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(70,60,140,0.10)]"
                    >
                      <div className="flex items-start justify-between">
                        <FileTypeIcon ext={f.ext} />
                        {starBtn(f, 'h-7 w-7')}
                      </div>
                      <div className="mt-2.5 truncate text-[13.5px] font-semibold text-[#111827]" title={f.name}>
                        {f.name}
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-[#9CA3AF]">
                        {f.trashed ? 'In trash' : folderName(f.folder)} · {fmtSize(f.size)}
                      </div>
                      <div className="mt-1 text-[11px] text-[#B7B4C7]">{fmtModified(f.modified)}</div>
                      <span className="absolute bottom-3 right-3">{menuBtn(f, true)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================== right panel ============================== */}
      <aside className="hidden w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#ECECF4] bg-white p-4 xl:flex">
        {/* Storage */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Storage</h3>
            <button
              onClick={() => showToast('Storage manager coming soon')}
              className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
            >
              Manage
            </button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EFEDF8]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF]"
              initial={{ width: 0 }}
              animate={{ width: `${stats.pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11.5px]">
            <span className="font-medium text-[#6B7280]">{(stats.used / GB).toFixed(1)} GB of 15 GB used</span>
            <span className="font-bold text-[#111827]">{stats.pct}%</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {[
              { label: 'Documents', value: stats.docs, dot: '#2F6DF6' },
              { label: 'Images', value: stats.images, dot: '#EC4899' },
              { label: 'Videos', value: stats.videos, dot: '#16182B' },
              { label: 'Others', value: stats.others, dot: '#9CA3AF' },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2 text-[12px]">
                <span className="h-2 w-2 rounded-full" style={{ background: r.dot }} />
                <span className="flex-1 font-medium text-[#374151]">{r.label}</span>
                <span className="font-semibold text-[#6B7280]">{fmtSize(r.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <h3 className="mb-2 text-[16.5px] font-bold tracking-tight text-[#111827]">Quick Access</h3>
          <div className="flex flex-col">
            {[
              { label: 'Starred Files', tab: 'starred', icon: Star, tint: '#FFF8E6', fg: '#F5B50A' },
              { label: 'Shared with Me', tab: 'shared', icon: Share2, tint: '#EEEDFC', fg: '#5B4DFF' },
              { label: 'Recent Files', tab: 'recent', icon: Clock, tint: '#E7F0FF', fg: '#2F6DF6' },
              { label: 'Trash', tab: 'trash', icon: Trash2, tint: '#FDE8EC', fg: '#E11D48' },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => setTab(q.tab as typeof tab)}
                className="group flex items-center gap-3 rounded-[10px] px-1.5 py-2 text-left transition-colors hover:bg-[#F6F5FB]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px]" style={{ background: q.tint }}>
                  <q.icon className="h-4 w-4" style={{ color: q.fg }} strokeWidth={2} />
                </span>
                <span className="flex-1 text-[13.5px] font-semibold text-[#111827]">{q.label}</span>
                <ChevronRight className="h-4 w-4 text-[#C4C4D4] transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* File Types */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">File Types</h3>
            <button
              onClick={() => {
                setTab('all')
                setQuery('')
                setFolderFilter(null)
              }}
              className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
            >
              View all
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
            {[
              { label: 'PDF', count: typeCounts.pdf, bg: '#FDE8EC', fg: '#E11D48', text: 'PDF' },
              { label: 'Documents', count: typeCounts.docs, bg: '#E7F0FF', fg: '#2F6DF6', text: 'DOC' },
              { label: 'Spreadsheets', count: typeCounts.sheets, bg: '#E4F6EC', fg: '#10B981', text: 'XLS' },
              { label: 'Presentations', count: typeCounts.pres, bg: '#FFF3E0', fg: '#D97706', text: 'PPT' },
              { label: 'Images', count: typeCounts.images, bg: '#EFECFE', fg: '#6D4AFF', image: true },
              { label: 'Others', count: typeCounts.others, bg: '#F3F4F6', fg: '#6B7280', text: 'FILE' },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[8.5px] font-extrabold"
                  style={{ background: t.bg, color: t.fg }}
                >
                  {t.image ? <Image className="h-[18px] w-[18px]" style={{ color: t.fg }} strokeWidth={2} /> : t.text}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-[#111827]">{t.label}</span>
                  <span className="block text-[11px] text-[#9CA3AF]">{t.count} files</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-[16px] border border-[#ECECF4] bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16.5px] font-bold tracking-tight text-[#111827]">Recent Activity</h3>
            <button
              onClick={() => showToast("You're all caught up")}
              className="text-[12.5px] font-semibold text-[#5B4DFF] transition-colors hover:text-[#4437e0]"
            >
              View all
            </button>
          </div>
          <div className="mt-2 flex flex-col">
            {activity.map((a) => {
              const map = {
                upload: { icon: Upload, bg: '#EEEDFC', fg: '#5B4DFF' },
                edit: { icon: Pencil, bg: '#E4F6EC', fg: '#10B981' },
                share: { icon: Share2, bg: '#E7F0FF', fg: '#2F6DF6' },
              }
              const s = map[a.kind]
              return (
                <div key={a.id} className="flex items-start gap-3 py-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: s.bg }}>
                    <s.icon className="h-4 w-4" style={{ color: s.fg }} strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-[#111827]">{a.text}</span>
                    <span className="block text-[11px] text-[#9CA3AF]">{a.time}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      {/* ================================ overlays =============================== */}
      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center bg-[#7C5BFF]/10 backdrop-blur-[2px]"
          >
            <div className="rounded-[16px] border-2 border-dashed border-[#7C5BFF] bg-white/95 px-8 py-6 text-center shadow-[0_20px_50px_rgba(40,35,90,0.2)]">
              <CloudUpload className="mx-auto h-8 w-8 text-[#5B4DFF]" strokeWidth={1.8} />
              <p className="mt-2 text-[14px] font-bold text-[#111827]">Drop files to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#16182B]/40 p-4 backdrop-blur-[2px]"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[420px] rounded-[18px] border border-[#ECECF4] bg-white p-5 shadow-[0_24px_60px_rgba(30,25,80,0.25)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[17px] font-bold tracking-tight text-[#111827]">
                  {modal.kind === 'folder'
                    ? 'New Folder'
                    : modal.kind === 'doc'
                      ? 'Create Document'
                      : `Rename ${modal.target === 'folder' ? 'folder' : 'file'}`}
                </h3>
                <button
                  onClick={() => setModal(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F2F9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="mb-1 block text-[12px] font-semibold text-[#374151]">
                {modal.kind === 'folder' ? 'Folder name' : modal.kind === 'doc' ? 'Document name' : 'New name'}
              </label>
              <input
                autoFocus
                value={modal.name}
                onChange={(e) => setModal({ ...modal, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  if (modal.kind === 'folder') {
                    const name = modal.name.trim()
                    if (!name) return
                    setFolders((prev) => [...prev, { id: idSeq++, name, tint: modal.tint, count: 0, modified: Date.now() }])
                    setModal(null)
                    showToast('Folder created')
                  } else if (modal.kind === 'doc') {
                    createDocument(modal.name)
                    setModal(null)
                  } else {
                    commitRename()
                  }
                }}
                placeholder={
                  modal.kind === 'folder' ? 'e.g. Semester 4' : modal.kind === 'doc' ? 'e.g. Assignment Report' : 'New name'
                }
                className="mb-4 h-10 w-full rounded-[10px] border border-[#E7E5F2] bg-white px-3 text-[13.5px] text-[#111827] outline-none focus:border-[#B9A7FF]"
              />

              {modal.kind === 'folder' && (
                <>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#374151]">Color</label>
                  <div className="mb-5 flex gap-2">
                    {Object.entries(TINTS).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => setModal({ ...modal, tint: key })}
                        className={`flex h-9 w-9 items-center justify-center rounded-[10px] border-2 transition-all ${
                          modal.tint === key ? 'border-[#16182B]' : 'border-transparent hover:border-[#E7E5F2]'
                        }`}
                        style={{ background: t.bg }}
                      >
                        <Folder className="h-4 w-4" style={{ color: t.fg }} fill="currentColor" strokeWidth={0} />
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModal(null)}
                  className="rounded-[10px] border border-[#E7E5F2] px-4 py-2 text-[13px] font-semibold text-[#374151] transition-colors hover:bg-[#F6F5FB]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!modal) return
                    if (modal.kind === 'folder') {
                      const name = modal.name.trim()
                      if (!name) return
                      setFolders((prev) => [...prev, { id: idSeq++, name, tint: modal.tint, count: 0, modified: Date.now() }])
                      setModal(null)
                      showToast('Folder created')
                    } else if (modal.kind === 'doc') {
                      createDocument(modal.name)
                      setModal(null)
                    } else {
                      commitRename()
                    }
                  }}
                  className="rounded-[10px] bg-gradient-to-r from-[#7C5BFF] to-[#4F7CFF] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(106,79,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {modal.kind === 'folder' ? 'Create folder' : modal.kind === 'doc' ? 'Create' : 'Rename'}
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
}

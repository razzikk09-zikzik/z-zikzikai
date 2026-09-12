export const navItems = [
  { label: 'Home', icon: 'home' },
  { label: 'Chat', icon: 'chat' },
  { label: 'Tasks', icon: 'tasks' },
  { label: 'Calendar', icon: 'calendar' },
  { label: 'Notes', icon: 'notes' },
  { label: 'Documents', icon: 'documents' },
  { label: 'Emails', icon: 'emails' },
  { label: 'Contacts', icon: 'contacts' },
  { label: 'Tools', icon: 'tools' },
  { label: 'Settings', icon: 'settings' },
]

export const focusTasks = [
  { id: 1, title: '3 classes', time: '9:00 AM – 1:00 PM', done: true },
  { id: 2, title: '1 assignment due', time: 'Today', done: false },
  { id: 3, title: '2 important emails', time: 'Today', done: false },
  { id: 4, title: 'Project work (Zikzik AI)', time: 'Today', done: false },
]

export const quickActions = [
  { label: 'Plan my day', desc: 'Create a schedule based on your tasks', icon: 'calendar' },
  { label: 'Summarize documents', desc: 'Get key insights from your files', icon: 'filetext' },
  { label: 'Find new leads', desc: 'Search and organize potential contacts', icon: 'search' },
  { label: 'Write email', desc: 'Draft professional emails instantly', icon: 'mail' },
]

export const suggestions = [
  { label: 'Plan my day', icon: 'calendar', color: '#5B4DFF' },
  { label: 'Summarize', icon: 'filetext', color: '#F59E0B' },
  { label: 'Find leads', icon: 'search', color: '#10B981' },
  { label: 'Write email', icon: 'mail', color: '#5B4DFF' },
  { label: 'More', icon: 'grid', color: '#6B7280' },
]

// Week of Sat Sep 12, 2026 → Sun 6 … Sat 12
export const weekDays = [
  { day: 6, dim: false },
  { day: 7, dim: false },
  { day: 8, dim: false },
  { day: 9, dim: false },
  { day: 10, dim: false },
  { day: 11, dim: false },
  { day: 12, dim: false, today: true },
]

export const schedule = [
  { time: '9:00 AM', title: 'Engineering Graphics', place: 'LT-1', dot: '#7C3AED' },
  { time: '11:00 AM', title: 'Electron Devices', place: 'LT-3', dot: '#2F6DF6' },
  { time: '2:00 PM', title: 'Project Discussion', place: 'Lab-2', dot: '#10B981' },
  { time: '5:00 PM', title: 'Gym', place: 'Personal', dot: '#EF4444' },
]

export const activity = [
  { type: 'pdf', name: 'Lecture notes.pdf', time: 'Opened 10 mins ago' },
  { type: 'txt', name: 'Project_ideas.txt', time: 'Edited 1 hour ago' },
  { type: 'pdf', name: 'Research_paper.pdf', time: 'Summarized 2 hours ago' },
  { type: 'md', name: 'Meeting_notes.md', time: 'Created 3 hours ago' },
]

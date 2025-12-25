export interface LinkItem {
  id: string
  title: string
  url: string
  type: string
}

export interface TaskItem {
  id: string
  title: string
  status: string // 'todo' | 'doing' | 'done'
  category: string
}

export interface EventItem {
  id: string
  title: string
  time: string
}

export interface SnippetItem {
  id: string
  title: string
  code: string
  language: string
}
import { type Dict } from '@/utils'

export const ContentAuthor = {
  user: 'user',
  assistant: 'assistant',
} as const
export type ContentAuthor = keyof typeof ContentAuthor

export type EditorContent = {
  id: string
  content: string
  author: ContentAuthor
  timestamp: number
  metadata?: Dict
}

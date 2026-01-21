import type { Dict } from '@/utils'
import type React from 'react'

export const MessageRole = {
  user: 'user',
  assistant: 'assistant',
} as const
export type MessageRole = keyof typeof MessageRole

export const EventType = {
  progress: 'progress',
  done: 'done',
  error: 'error',
} as const
export type EventType = keyof typeof EventType

export interface ChatMessageContextItem {
  name: string
  icon: React.ReactElement
  description: string
  content: unknown
}

export type ChatMessageEvent = {
  type: EventType
  label?: string
  content?: Dict | string
  [key: string]: unknown
}

export interface ChatMessage {
  message: string
  role: MessageRole
  avatar?: React.ReactElement
  timestamp: number
  context: ChatMessageContextItem[]
  events: ChatMessageEvent[]
  [key: string]: unknown
}

export interface InputMessage {
  value: string
  context: ChatMessageContextItem[]
  placeholder?: string | React.ReactNode
}

import { useStore } from 'zustand/react'
import { createStore, type StoreApi } from 'zustand/vanilla'
import { produce } from 'immer'
import defaults from 'lodash/defaults'

import type {
  ChatMessage,
  ChatMessageContextItem,
  ChatMessageEvent,
  InputMessage,
} from '@components/Chat/types'

import { shortuuid } from '@/utils'

import type { EditorContent } from '@/app-components/Editor/types'

import { MainEditor } from '@/store/editorStore'

import type { Dict } from '@/utils'
import concat from 'lodash/concat'

export interface ConversationStoreProps {
  currentArtifact: EditorContent
  allArtifacts: { [id: string]: EditorContent }

  lastChatMessage: ChatMessage | null
  chatHistory: ChatMessage[]

  inputMessage: InputMessage
}

export interface ConversationStoreWithActions extends ConversationStoreProps {
  updateLastChatMessage: (
    value: Partial<ConversationStoreProps['lastChatMessage']>
  ) => void
  putNewChatMessage: (
    value: ConversationStoreProps['lastChatMessage'] | null
  ) => void
  updateEditorDoc: (
    value: Partial<ConversationStoreProps['currentArtifact']>
  ) => void
  putNewEditorDoc: (value: ConversationStoreProps['currentArtifact']) => void
  updateInputMessage: (value: Partial<InputMessage>) => void
}

// type ReservedStoreKeys = '_genericUpdate' | 'updateEditorContent'
// type AllowedKeys = keyof Omit<ConversationStoreProps, ReservedStoreKeys>

export function createEmptyDocument(
  id?: string,
  author: 'user' | 'assistant' = 'assistant'
): EditorContent {
  return {
    id: id || shortuuid(),
    author,
    content: '',
    timestamp: -1,
  }
}

const DEFALUT_PROPS: ConversationStoreProps = {
  currentArtifact: createEmptyDocument(),
  allArtifacts: {},

  lastChatMessage: null,
  chatHistory: [],

  inputMessage: {
    context: [],
    value: '',
    placeholder: 'Start here',
  },
} as const

const conversationStore = createStore<ConversationStoreWithActions>()(
  (set, get) => {
    return {
      ...DEFALUT_PROPS,

      putNewEditorDoc: (value) => {
        set(
          produce((state) => {
            const _prev = state.currentArtifact
            if (_prev.content != '') state.allArtifacts[_prev.id] = _prev

            MainEditor.commands.setContent(value.content)
            state.currentArtifact = value
            state.allArtifacts = {
              ...state.allArtifacts,
              [value.id]: value,
            }
          })
        )
      },

      putNewChatMessage: (value) => {
        set(
          produce((state) => {
            state.lastChatMessage = value
            state.chatHistory = concat(
              get().chatHistory,
              get().lastChatMessage || []
            )
          })
        )
      },

      updateInputMessage: (value) => {
        set(
          produce((state) => {
            state.inputMessage = defaults(value, state.inputMessage)
          })
        )
      },

      updateLastChatMessage: (value) => {
        set(
          produce((state) => {
            state.lastChatMessage = {
              ...state.lastChatMessage,
              ...value,
            }
          })
        )
      },

      updateEditorDoc: (value) => {
        console.log(value)
        set(
          produce((state) => {
            MainEditor.commands.setContent(value.content || '')
            state.currentArtifact = {
              ...state.currentArtifact,
              ...value,
            }
            state.allArtifacts = {
              ...state.allArtifacts,
              [state.currentArtifact.id]: state.currentArtifact,
            }
          })
        )
      },
    }
  }
)

const useConversationStore = <T>(
  selector: (state: ConversationStoreWithActions) => T
) =>
  useStore<StoreApi<ConversationStoreWithActions>, T>(
    conversationStore,
    selector
  )

export { conversationStore, useConversationStore }

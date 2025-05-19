import {
  create
} from 'zustand'

type ConversationStore = {
  currentEditorContent: string
  editorContentVersions: string[]
  lastChatMessage: string
  chatHistory: string[]

  updateEditorContent: (content: string) => void
}

const useConversationStore = create<ConversationStore>()((set) => ({
  currentEditorContent: 'This is your content',
  editorContentVersions: [],
  lastChatMessage: '',
  chatHistory: [],

  updateEditorContent: (content) =>
    set(
      (state): Partial<ConversationStore> => ({
        currentEditorContent: content,
        editorContentVersions: [...state.editorContentVersions, content],
      })
    ),
}))


export default useConversationStore

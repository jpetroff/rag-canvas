import { create } from "zustand";


type EditorStore = {
  currentEditorContent: string,
  editorContentVersions: string[],
  lastChatMessage: string,
  chatHistory: string[]
  
  updateEditorContent: (content: string) => void
}

const useEditorStore = create<EditorStore>()((set) => ({
  currentEditorContent: "This is your content",
  editorContentVersions: [],
  lastChatMessage: "",
  chatHistory: [],

  updateEditorContent: (content) =>
    set(
      (state) : Partial<EditorStore> => (
        { 
          currentEditorContent: content,
          editorContentVersions: [...state.editorContentVersions, content]
        }
      )
    ),
}));

export default useEditorStore
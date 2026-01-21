import React from 'react'
import {
  FloatingMenu,
  BubbleMenu,
  useEditor,
  EditorContext,
  EditorContent,
  EditorProvider,
  useEditorState,
  type EditorEvents,
} from '@tiptap/react'
import { useConversationStore } from '@/Model'
import ScrollArea from '@shared/ScrollArea'

import { MainEditor } from '@/Model'

import './editor-style.css'
import MenuBar from './MenuBar'

export type EditorProps = React.ComponentPropsWithoutRef<'div'>

const Editor: React.FC<EditorProps> = (props: EditorProps) => {
  const editorContent = useConversationStore(
    (state) => state.currentArtifact.content
  )
  const setEditorContent = useConversationStore(
    (state) => state.updateEditorDoc
  )

  function handleEditorUpdate({ editor }: EditorEvents['blur']) {
    if (!editor) {
      console.warn('Editor.onBlur: empty `editor` instance')
      return
    }

    let content
    if (editor?.storage?.markdown) {
      content = editor.storage.markdown.getMarkdown()
    } else {
      content = editor.getText()
    }
    setEditorContent({
      content,
    })
  }

  const editorState = useEditorState({
    editor: MainEditor,
    selector: ({ editor }) => ({
      isEditable: true,
    }),
  })

  return (
    <div
      data-block="layout"
      data-component="Editor"
      className={'flex flex-column w-full h-full'}
    >
      <ScrollArea className="relative flex-1" type="scroll">
        {/* <EditorContext.Provider value={{ editor }}> */}
        <MenuBar editor={MainEditor}></MenuBar>
        <EditorContent
          editor={MainEditor}
          role="presentation"
          className="px-12 h-[1024px]"
        />
        {/* </EditorContext.Provider> */}
      </ScrollArea>
      <FloatingMenu editor={MainEditor}>Floating menu</FloatingMenu>
      <BubbleMenu editor={MainEditor}>Bubble menu</BubbleMenu>
    </div>
  )
}

export default Editor

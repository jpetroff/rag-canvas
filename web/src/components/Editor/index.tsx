import React from 'react'
import {
  FloatingMenu,
  BubbleMenu,
  useEditor,
  EditorContext,
  EditorContent,
} from '@tiptap/react'
import { useEditorStore } from '@/Model'
import ScrollArea from '@shared/ScrollArea'

import Extensions from './extensions'
import './editor-style.css'
import MenuBar from './MenuBar'

export type EditorProps = object

const Editor: React.FC<EditorProps> = (props: EditorProps) => {
  const editorContent = useEditorStore((state) => state.currentEditorContent)

  const editor = useEditor({
    content: editorContent,
    extensions: Extensions,
    editorProps: {
      attributes: {
        'data-component': 'TipTapEditor',
        class: 'max-w-(--max-editor-width) mx-auto w-full',
      },
    },
  })

  return (
    <div
      data-block="layout"
      data-component="Editor"
      className={'flex flex-column w-full h-full'}
    >
      <ScrollArea className="relative flex-1" type="scroll">
        <EditorContext.Provider value={{ editor }}>
          <MenuBar></MenuBar>
          <EditorContent
            editor={editor}
            role="presentation"
            className="px-12 h-[1024px]"
          />
        </EditorContext.Provider>
      </ScrollArea>
      <FloatingMenu editor={editor}>Floating menu</FloatingMenu>
      {/* <BubbleMenu editor={editor}>Bubble menu</BubbleMenu> */}
    </div>
  )
}

export default Editor

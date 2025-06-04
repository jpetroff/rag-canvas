import { Editor } from '@tiptap/react'
import Extensions from './editorExtensions'

const MainEditor = new Editor({
  content: '',
  extensions: Extensions,
  editorProps: {
    attributes: {
      'data-component': 'TipTapEditor',
      class: 'max-w-(--max-editor-width) mx-auto w-full',
    },
  },
})

export { MainEditor }

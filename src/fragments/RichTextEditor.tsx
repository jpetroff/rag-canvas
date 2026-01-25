import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  editable?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className='flex flex-col h-full border border-zinc-200 rounded-lg overflow-hidden bg-white'>
      {editable && (
        <div className='flex items-center gap-1 p-2 border-b border-zinc-200 bg-zinc-50'>
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.commands.toggleBold()}
          >
            <Bold className='h-4 w-4' />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.commands.toggleItalic()}
          >
            <Italic className='h-4 w-4' />
          </Button>
          <div className='w-px h-6 bg-zinc-300 mx-1' />
          <Button
            variant={
              editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'
            }
            size='sm'
            onClick={() => editor.commands.toggleHeading({ level: 1 })}
          >
            <Heading1 className='h-4 w-4' />
          </Button>
          <Button
            variant={
              editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'
            }
            size='sm'
            onClick={() => editor.commands.toggleHeading({ level: 2 })}
          >
            <Heading2 className='h-4 w-4' />
          </Button>
          <div className='w-px h-6 bg-zinc-300 mx-1' />
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.commands.toggleBulletList()}
          >
            <List className='h-4 w-4' />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.commands.toggleOrderedList()}
          >
            <ListOrdered className='h-4 w-4' />
          </Button>
          <div className='w-px h-6 bg-zinc-300 mx-1' />
          <Button
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.commands.toggleBlockquote()}
          >
            <Quote className='h-4 w-4' />
          </Button>
          <Button
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            size='sm'
            onClick={() => editor.commands.toggleCodeBlock()}
          >
            <Code className='h-4 w-4' />
          </Button>
          <div className='flex-1' />
          <Button
            variant='ghost'
            size='sm'
            onClick={() => editor.commands.undo()}
            disabled={!editor.can().undo()}
          >
            <Undo className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => editor.commands.redo()}
            disabled={!editor.can().redo()}
          >
            <Redo className='h-4 w-4' />
          </Button>
        </div>
      )}
      <div className='flex-1 overflow-auto p-4'>
        <EditorContent
          editor={editor}
          className='prose prose-sm max-w-none focus:outline-none'
        />
      </div>
    </div>
  )
}

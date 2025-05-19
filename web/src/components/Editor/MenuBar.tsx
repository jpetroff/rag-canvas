import { useCurrentEditor } from '@tiptap/react'
import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'
import { Toolbar } from 'radix-ui'
import { type ToolbarProps } from '@radix-ui/react-toolbar'
import * as Icons from '@phosphor-icons/react'

type MenuBarProps = ToolbarProps

const MenuBar: React.FC<MenuBarProps> = (props) => {
  const {editor} = useCurrentEditor()

  if(!editor) return

  const ghostBtnClasses = 'bg-ghost-btn-b text-ghost-btn-f hover:bg-ghost-btn-b-hover hover:text-ghost-btn-f-hover transition-colors'
  const toggleBtnClasses =
    'data-[state=true]:text-pressed-btn-f data-[state=true]:hover:text-pressed-btn-f-hover data-[state=true]:bg-pressed-btn-b data-[state=true]:hover:bg-pressed-btn-b-hover'
  const btnShapeClasses =
    'cursor-pointer ml-0.5 inline-flex size-btn-md flex-shrink-0 flex-grow-0 basis-auto items-center justify-center rounded bg-white leading-none outline-none first:ml-0'

  return (
    <div
      data-block="MenuBarWrapper"
      className="sticky top-0 w-full px-6 py-4 z-[99]"
    >
      <Toolbar.Root
        data-component="MenuBar"
        className={clsx(
          'flex w-full min-w-max rounded-md bg-b0-alpha-neutral p-1 shadow-s0-neutral ring ring-r0-neutral',
          props.className
        )}
        {...omit(props, 'className')}
        aria-label="Editor toolbar"
      >
        <Toolbar.ToggleGroup
          type="multiple"
          aria-label="Text formatting"
          className="flex flex-row"
        >
          
          <Toolbar.ToggleItem
            className={clsx(ghostBtnClasses, btnShapeClasses, toggleBtnClasses)}
            value="bold"
            aria-label="Bold"
            data-state={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Icons.TextBolderIcon
              size={'auto'}
              weight={'regular'}
              className="size-icon-md"
            />
          </Toolbar.ToggleItem>

          <Toolbar.ToggleItem
            className={clsx(ghostBtnClasses, btnShapeClasses, toggleBtnClasses)}
            value="bold"
            aria-label="Bold"
            data-state={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Icons.TextItalicIcon
              size={'auto'}
              weight={'regular'}
              className="size-icon-md"
            />
          </Toolbar.ToggleItem>

          <Toolbar.ToggleItem
            className={clsx(ghostBtnClasses, btnShapeClasses, toggleBtnClasses)}
            value="bold"
            aria-label="Bold"
            data-state={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Icons.TextStrikethroughIcon
              size={'auto'}
              weight={'regular'}
              className="size-icon-md"
            />
          </Toolbar.ToggleItem>

        </Toolbar.ToggleGroup>
      </Toolbar.Root>
    </div>
  )
}

export default MenuBar
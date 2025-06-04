import { useCurrentEditor, Editor } from '@tiptap/react'
import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'
import { Toolbar } from 'radix-ui'
import { type ToolbarProps } from '@radix-ui/react-toolbar'
import * as Icons from '@phosphor-icons/react'
import { BtnClasses } from '@/shared/Button'

type MenuBarProps = ToolbarProps & {
  editor: Editor | null
}

const MenuBar: React.FC<MenuBarProps> = (props) => {
  const _editor = useCurrentEditor()
  const { editor } = props.editor != null ? props : _editor

  if (!editor) return null

  const menuBarBtnClasses = [
    BtnClasses._base,
    BtnClasses.iconNormal,
    BtnClasses.ghost,
    BtnClasses.toggle,
  ]

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
          className="flex flex-row gap-0.5"
        >
          <Toolbar.ToggleItem
            className={clsx(...menuBarBtnClasses)}
            value="bold"
            aria-label="Bold"
            data-state={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Icons.TextBolderIcon weight={'regular'} className="size-icon-md" />
          </Toolbar.ToggleItem>

          <Toolbar.ToggleItem
            className={clsx(...menuBarBtnClasses)}
            value="bold"
            aria-label="Bold"
            data-state={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Icons.TextItalicIcon weight={'regular'} className="size-icon-md" />
          </Toolbar.ToggleItem>

          <Toolbar.ToggleItem
            className={clsx(...menuBarBtnClasses)}
            value="bold"
            aria-label="Bold"
            data-state={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Icons.TextStrikethroughIcon
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

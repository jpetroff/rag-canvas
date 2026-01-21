import {
  Blockquote,
  type BlockquoteOptions,
} from '@tiptap/extension-blockquote'
import { Bold, type BoldOptions } from '@tiptap/extension-bold'
import {
  BulletList,
  type BulletListOptions,
} from '@tiptap/extension-bullet-list'
import { Code, type CodeOptions } from '@tiptap/extension-code'
import { CodeBlock, type CodeBlockOptions } from '@tiptap/extension-code-block'
import { Document } from '@tiptap/extension-document'
import {
  Dropcursor,
  type DropcursorOptions,
} from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { HardBreak, type HardBreakOptions } from '@tiptap/extension-hard-break'
import { Heading, type HeadingOptions } from '@tiptap/extension-heading'
import { History, type HistoryOptions } from '@tiptap/extension-history'
import {
  HorizontalRule,
  type HorizontalRuleOptions,
} from '@tiptap/extension-horizontal-rule'
import { Italic, type ItalicOptions } from '@tiptap/extension-italic'
import { ListItem, type ListItemOptions } from '@tiptap/extension-list-item'
import {
  OrderedList,
  type OrderedListOptions,
} from '@tiptap/extension-ordered-list'
import { Paragraph, type ParagraphOptions } from '@tiptap/extension-paragraph'
import { Strike, type StrikeOptions } from '@tiptap/extension-strike'
import { Text } from '@tiptap/extension-text'
import { Markdown } from 'tiptap-markdown'

export default [
  Blockquote,
  BulletList,
  Code,
  CodeBlock,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Heading,
  History,
  HorizontalRule,
  ListItem,
  OrderedList,
  Paragraph,

  Document,
  Text,
  Markdown,

  Bold,
  Italic,
  Strike,
]

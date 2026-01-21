import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'
import ChatContext from './context'
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from 'react-textarea-autosize'

type ChatSendFormProps = React.ComponentPropsWithoutRef<'div'>

const ChatSendForm: React.FC<ChatSendFormProps> = (props) => {
  const context = React.useContext(ChatContext)

  return (
    <div
      data-component="ChatSendForm"
      className={clsx('', props.className)}
      {...omit(props, 'className')}
    >
      {props.children}
    </div>
  )
}

type ChatSendInputProps = TextareaAutosizeProps

/* 
  Uses https://github.com/Andarist/react-textarea-autosize as autoresizable TextArea
  @maxRows:number	Maximum number of rows up to which the textarea can grow
  @minRows:number	Minimum number of rows to show for textarea
  @onHeightChange:func	Function invoked on textarea height change, with height as first argument. The second function argument is an object containing additional information that might be useful for custom behaviors. Current options include { rowHeight: number }.
  @cacheMeasurements:boolean	Reuse previously computed measurements when computing height of textarea. Default: false
 */
const ChatSendInput: React.FC<ChatSendInputProps> = (props) => {
  const context = React.useContext(ChatContext)
  const ref = React.useRef<HTMLTextAreaElement>(null)

  return (
    <TextareaAutosize
      ref={(node) => {
        ref.current = node
      }}
      data-component="ChatSendInput"
      className={clsx('', props.className)}
      {...omit(props, 'className', 'style', 'ref')}
      disabled={context.disableSend}
    ></TextareaAutosize>
  )
}

const Form = ChatSendForm
const Input = ChatSendInput
export { Form, Input }

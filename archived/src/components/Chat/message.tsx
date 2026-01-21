import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'
import { type ChatMessageEvent, EventType } from './types'

type ChatMessageProps = React.ComponentPropsWithoutRef<'div'> & {
  id: string
}

type MessageEventProps = React.ComponentPropsWithoutRef<'div'> & {
  events: ChatMessageEvent[]
  max_items?: number
}

type MessageContentProps = React.ComponentPropsWithoutRef<'div'> & {
  messageContent?: React.ReactNode
}

type _NestedComponent<T> = React.FC<T> & {
  Events: React.FC<MessageEventProps>
  Content: React.FC<MessageContentProps>
}

const ChatMessage: _NestedComponent<ChatMessageProps> = (props) => {
  return (
    <div
      key={props.id}
      data-message-id={props.id}
      data-component="ChatMessage"
      className={clsx('w-full', props.className)}
      {...omit(props, 'className', 'id')}
    >
      {props.children}
    </div>
  )
}

ChatMessage.Events = (props: MessageEventProps) => {
  const events = props.events
  const last_n = typeof props.max_items === 'number' ? props.max_items : 1
  const displayEvents = events.slice(-last_n)

  return (
    <div className="flex flex-col gap-2">
      {displayEvents.map((event, index) => (
        <div
          key={`${event.type}-${index}`}
          className={clsx('flex items-center gap-2 p-2 rounded', {
            'bg-blue-50': event.type == 'progress',
            'bg-green-50': event.type === 'done',
            'bg-red-50': event.type === 'error',
          })}
        >
          {event.label && (
            <span className="text-xs text-gray-600">{event.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

ChatMessage.Content = (props: MessageContentProps) => {
  const hasContent =
    props.messageContent !== undefined && props.messageContent !== ''
  return (
    <div
      data-component="ChatMessageContent"
      className={clsx('', props.className)}
      {...omit(props, 'className', 'messageContent')}
    >
      {hasContent && <>{props.messageContent}</>}
      {!hasContent && <>Loading...</>}
    </div>
  )
}

export default ChatMessage

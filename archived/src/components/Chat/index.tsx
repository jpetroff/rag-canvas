import React from 'react'
import * as types from './types'
import clsx from 'clsx'
import omit from 'lodash/omit'

import ChatContext, { type ChatContextValue } from './context'
import * as ChatSendFormBundle from './send-form'
import ChatMessage from './message'
import ChatList from './list'

type ChatElement = React.ComponentRef<'div'>
interface ChatElementProps extends React.ComponentPropsWithoutRef<'div'> {
  disableSend: boolean
}

const Chat = React.forwardRef<ChatElement, ChatElementProps>(
  (props: ChatElementProps, forwardRef) => {
    const contextValue: ChatContextValue = {
      disableSend: false,
    }
    return (
      <ChatContext.Provider value={contextValue}>
        <div
          ref={forwardRef}
          data-component="ChatWrapper"
          className={clsx('', props.className)}
          {...omit(props, 'className', ...Object.keys(contextValue))}
        >
          {props.children}
        </div>
      </ChatContext.Provider>
    )
  }
)

const Root = Chat

const Send = ChatSendFormBundle
const Message = ChatMessage
const List = ChatList

export { Root, Send, Message, List }

import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'
import * as Chat from '@components/Chat'
import { useAppState, useConversationStore } from '@/Model'
import Button, { BtnClasses } from '@/shared/Button'

import { chatController } from '@/Controller'
import ExtendedMessageContent from './customMessageContent'

type ChatProps = React.ComponentPropsWithoutRef<'div'>

const AIChat: React.FC<ChatProps> = (props) => {
  const chatHistory = useConversationStore((state) => state.chatHistory)
  const lastMessage = useConversationStore((state) => state.lastChatMessage)
  const inputMessage = useConversationStore((state) => state.inputMessage)
  const setInputMessage = useConversationStore(
    (state) => state.updateInputMessage
  )
  const isGeneratingResponse = useAppState((state) => state.generationActive)

  return (
    <Chat.Root
      disableSend={false}
      className={clsx('flex-col', props.className)}
      {...omit(props, 'className')}
    >
      <Chat.List>
        {chatHistory.map((chatMessage, index) => (
          <Chat.Message id={String(index)} className="text-sm text-text-2">
            <ExtendedMessageContent
              className="text-sm text-text-2"
              messageContent={chatMessage.message}
            />
          </Chat.Message>
        ))}
        {lastMessage && (
          <Chat.Message id={String(history.length)}>
            {isGeneratingResponse && (
              <Chat.Message.Events events={lastMessage.events} />
            )}
            <ExtendedMessageContent
              className="p-4 text-sm text-text-2"
              messageContent={lastMessage.message}
            />
          </Chat.Message>
        )}
      </Chat.List>
      <Chat.Send.Form className="flex flex-col flex-shrink w-auto h-auto shadow-s0-neutral ring-1 ring-r0-neutral mx-2 my-1.5 rounded-sm p-2 bg-b0-solid-neutral gap-2">
        <Chat.Send.Input
          maxRows={4}
          minRows={2}
          value={inputMessage.value}
          className="w-full outline-0 p-0.5"
          onInput={(event) =>
            setInputMessage({ value: event.currentTarget.value })
          }
        />
        <div className="flex flex-row justify-between w-full h-auto">
          <div className="">&nbsp;</div>
          <Button
            className={clsx(BtnClasses.sizeNormal, BtnClasses.ghost)}
            onClick={() => chatController.sendMessage()}
          >
            Send
          </Button>
        </div>
      </Chat.Send.Form>
    </Chat.Root>
  )
}

export default AIChat

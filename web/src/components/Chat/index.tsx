import React from 'react'

export type ChatProps = object

const Chat: React.FC<ChatProps> = (props: ChatProps) => {
  return (
    <div
      data-block="layout"
      data-component="Chat"
      className={
        'flex flex-column flex-shrink-0 flex-grow-0 h-full bg-b1-solid-neutral flex-1/4'
      }
    ></div>
  )
}

export default Chat

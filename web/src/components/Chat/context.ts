import React from 'react'

export type ChatContextValue = {
  disableSend: boolean
}

const ChatContext = React.createContext<ChatContextValue>({
  disableSend: false,
})

export default ChatContext

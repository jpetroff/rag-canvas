import ChatMessage from '@/components/Chat/message'
import useArtifactSnippet from './renderArtifactSnippet'

import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'
// import type { ChatMessage } from '@/components/Chat/types'

type ExtendedMessageContentProps = Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'content'
> & {
  messageContent: string
}

const ExtendedMessageContent: React.FC<ExtendedMessageContentProps> = (
  props
) => {
  const _content = useArtifactSnippet(props.messageContent)
  return (
    <ChatMessage.Content
      data-component="ExtendedMessageContent"
      className={clsx('', props.className)}
      messageContent={_content}
      {...omit(props, 'className', 'messageContent')}
    />
  )
}

export default ExtendedMessageContent

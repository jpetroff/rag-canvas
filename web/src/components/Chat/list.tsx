import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'
import * as ScrollArea from '@radix-ui/react-scroll-area'

type ChatListRef = React.ComponentRef<'div'>
type ChatListProps = ScrollArea.ScrollAreaProps & {
  viewportProps?: ScrollArea.ScrollAreaViewportProps
  thumbsProps?: ScrollArea.ScrollAreaThumbProps
  scrollbarAreaProps?: ScrollArea.ScrollAreaScrollbarProps
  cornerProps?: ScrollArea.ScrollAreaCornerProps
}

const ChatList = React.forwardRef<ChatListRef, ChatListProps>(
  (props: ChatListProps, forwardRef) => {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
    }, [props.children])
    return (
      <ScrollArea.Root
        data-component="ChatList"
        className={clsx('overflow-hidden size-full', props.className)}
        {...omit(props, 'className')}
      >
        <ScrollArea.Viewport
          ref={scrollRef}
          className="rounded size-full"
          dir="vertical"
        >
          {props.children}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className={clsx(
            'flex touch-none select-none data-[orientation=horizontal]:flex-col',
            props.scrollbarAreaProps?.className
          )}
          {...omit(props.scrollbarAreaProps, 'className')}
          orientation="vertical"
        >
          <ScrollArea.Thumb
            className={clsx(
              'relative flex-1 before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2',
              props.thumbsProps?.className
            )}
            {...omit(props.thumbsProps, 'className')}
          />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar
          className={clsx(
            'flex touch-none select-none data-[orientation=horizontal]:flex-col',
            props.scrollbarAreaProps?.className
          )}
          {...omit(props.scrollbarAreaProps, 'className')}
          orientation="horizontal"
        >
          <ScrollArea.Thumb
            className={clsx(
              'relative flex-1 before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2',
              props.thumbsProps?.className
            )}
            {...omit(props.thumbsProps, 'className')}
          />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner
          className={clsx('', props.cornerProps?.className)}
          {...omit(props.cornerProps, 'className')}
        />
      </ScrollArea.Root>
    )
  }
)
export default ChatList

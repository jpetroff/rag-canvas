import * as React from 'react'
import { ScrollArea as RScrollArea } from 'radix-ui'
import './ScrollAreaVariables.css'
import omit from 'lodash/omit'
import clsx from 'clsx'

export type ScrollAreaProps = RScrollArea.ScrollAreaProps & {
  viewportProps?: RScrollArea.ScrollAreaViewportProps,
  thumbsProps?: RScrollArea.ScrollAreaThumbProps
  scrollbarAreaProps?: RScrollArea.ScrollAreaScrollbarProps
  cornerProps?: RScrollArea.ScrollAreaCornerProps
}

const ScrollArea = (props: ScrollAreaProps) => (
  <RScrollArea.Root
    data-component="Scrollbar"
    className={clsx('overflow-hidden size-full', props.className)}
    {...omit(
      props,
      'className',
      'viewportProps',
      'thumbsProps',
      'scrollbarAreaProps',
      'cornerProps'
    )}
  >
    <RScrollArea.Viewport
      className={clsx('size-full', props.viewportProps?.className)}
      {...omit(props.viewportProps, 'className')}
    >
      {props.children}
    </RScrollArea.Viewport>
    <RScrollArea.Scrollbar
      className={clsx(
        'flex touch-none select-none bg-(--color-scrollbar) p-0.5 transition-colors duration-[160ms] ease-out hover:bg-(--color-scrollbar) data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col',
        props.scrollbarAreaProps?.className
      )}
      {...omit(props.scrollbarAreaProps, 'className')}
      orientation="vertical"
    >
      <RScrollArea.Thumb
        className={clsx(
          'relative flex-1 rounded-[10px] bg-(--color-scrollbar-thumb) before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2',
          props.thumbsProps?.className
        )}
        {...omit(props.thumbsProps, 'className')}
      />
    </RScrollArea.Scrollbar>
    <RScrollArea.Scrollbar
      className={clsx(
        'flex touch-none select-none bg-(--color-scrollbar) p-0.5 transition-colors duration-[160ms] ease-out hover:bg-(--color-scrollbar) data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col',
        props.scrollbarAreaProps?.className
      )}
      {...omit(props.scrollbarAreaProps, 'className')}
      orientation="horizontal"
    >
      <RScrollArea.Thumb
        className={clsx(
          'relative flex-1 rounded-[10px] bg-(--color-scrollbar-thumb) before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2',
          props.thumbsProps?.className
        )}
        {...omit(props.thumbsProps, 'className')}
      />
    </RScrollArea.Scrollbar>
    <RScrollArea.Corner
      className={clsx('bg-blackA5', props.cornerProps?.className)}
      {...omit(props.cornerProps, 'className')}
    />
  </RScrollArea.Root>
)

export default ScrollArea

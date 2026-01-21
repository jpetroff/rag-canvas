import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'

type ButtonProps = React.ComponentPropsWithoutRef<'button'>

const BtnClasses = {
  ghost:
    'bg-ghost-btn-b text-ghost-btn-f hover:bg-ghost-btn-b-hover hover:text-ghost-btn-f-hover transition-colors',
  toggle:
    'data-[state=true]:text-pressed-btn-f data-[state=true]:hover:text-pressed-btn-f-hover data-[state=true]:bg-pressed-btn-b data-[state=true]:hover:bg-pressed-btn-b-hover',
  _base:
    'cursor-pointer flex flex-shrink-0 flex-grow-0 basis-auto items-center justify-center rounded leading-none outline-none',
  sizeNormal: 'h-(--size-btn-md) min-w-(--size-btn-md) px-2',
  iconNormal: 'size-btn-md',
}

const Button: React.FC<ButtonProps> = (props) => {
  return (
    <button
      data-component="Button"
      className={clsx(BtnClasses._base, props.className)}
      {...omit(props, 'className')}
    >
      {props.children}
    </button>
  )
}

export default Button

export { BtnClasses }

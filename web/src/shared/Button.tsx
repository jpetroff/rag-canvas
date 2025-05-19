import clsx from 'clsx'
import { omit } from 'lodash'
import React from 'react'

type ButtonProps = React.ComponentPropsWithoutRef<'button'>

const Button: React.FC<ButtonProps> = (props) => {
  return (
    <button
      data-component="Button"
      className={clsx('', props.className)}
      {...omit(props, 'className')}
    >
      {props.children}
    </button>
  )
}

export default Button
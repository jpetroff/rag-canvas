import React from 'react'
import AIChat from '@/app-components/Chat'
import Editor from '@/app-components/Editor'

export type MainPageProps = object

const MainPage: React.FC<MainPageProps> = (props: MainPageProps) => {
  return (
    <div
      data-block="layout"
      data-component="MainPage"
      className={'flex flex-row flex-grow -flex-shrink w-full h-full'}
    >
      <AIChat className="grid grid-rows-[1fr_auto] bg-b1-solid-neutral flex-1/4" />
      <Editor />
    </div>
  )
}

export default MainPage

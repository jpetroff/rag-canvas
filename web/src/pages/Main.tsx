import React from 'react'
import Chat from '@/components/Chat';
import Editor from '@/components/Editor';

export type MainPageProps = object

const MainPage: React.FC<MainPageProps> = (
    props: MainPageProps
) => {
    return (
      <div
        data-block="layout"
        data-component="MainPage"
        className={"flex flex-row flex-grow -flex-shrink w-full h-full"}
      >
        <Chat />
        <Editor />
      </div>  
    );
}

export default MainPage
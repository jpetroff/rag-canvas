import React from "react";
import {
  FloatingMenu,
  BubbleMenu,
  EditorProvider,
} from "@tiptap/react";
import type { EditorProviderProps } from "@tiptap/react";
import useEditorStore from "@store/editorStore"

export type EditorProps = object;

const Editor: React.FC<EditorProps> = (props: EditorProps) => {
  const editorContent = useEditorStore((state) => state.currentEditorContent)

  const providerOptions: EditorProviderProps = {
    content: editorContent,
    extensions: []
  }
  return (
    <div
      data-block="layout"
      data-component="Editor"
      className={"flex flex-column w-full h-full flex-1 relative"}
    >
      <EditorProvider {...providerOptions}>
        <FloatingMenu editor={null}>Floating menu</FloatingMenu>
        <BubbleMenu editor={null}>Bubble menu</BubbleMenu>
      </EditorProvider>
    </div>
  );
};

export default Editor;

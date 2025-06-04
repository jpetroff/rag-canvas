import React from 'react'
import { useConversationStore, appState, useAppState } from '@/Model'
import remove from 'lodash/remove'

const useArtifactSnippet = (content: string) => {
  const snippetRegExp = /\[artifact\s*id="([A-Za-z0-9]*?)"\s*\]/i

  const isGeneratingResponse = useAppState((state) => state.generationActive)

  const snippetMatch = content.match(snippetRegExp)

  let artifactId = null
  let snippetText = ''

  if (snippetMatch != null) {
    artifactId = snippetMatch[1]
    snippetText = snippetMatch[0]
  }

  const snippetContent = useConversationStore((state) =>
    artifactId != null ? state.allArtifacts[artifactId] : null
  )

  const [_textBefore, _textAfter] = content.split(snippetText)

  const snippetLines = React.useMemo(() => {
    let _content: string[] = []
    if (snippetContent?.content) {
      _content = snippetContent.content.split('\n')
      remove(_content, (str) => str.trim() == '')
    }
    return _content.slice(
      isGeneratingResponse ? -3 : 0,
      isGeneratingResponse ? undefined : 3
    )
  }, [snippetContent, isGeneratingResponse])

  if (snippetContent?.content) {
    return (
      <>
        {_textBefore}
        {snippetContent && (
          <div className="w-full overflow-hidden bg-amber-100 overflow-ellipsis">
            {snippetLines.map((line) => {
              return (
                <p className="overflow-hidden text-sm line-clamp-1 overflow-ellipsis">
                  {line}
                </p>
              )
            })}
          </div>
        )}
        {_textAfter}
      </>
    )
  }

  return content
}

export default useArtifactSnippet

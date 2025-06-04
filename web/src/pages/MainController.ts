import { conversationStore, type ConversationStoreWithActions } from '@/Model'

import { appState, type AppStatePropsWithActions } from '@/Model'
import WebsocketRequest from '@/websocket-request'
import bindAll from 'lodash/bindAll'
import bind from 'lodash/bind'

import { splitContent, type Dict } from '@/utils'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface KnowledgeGraphOrStorage {
  type: 'VectorStore' | 'DocumentStore'
  id: string
  client: 'qdrant' | 'mongodb' | string
}

interface ChatCompletionRequest {
  message: string
  chatHistory: ChatMessage[]
  knowledge: KnowledgeGraphOrStorage[]
  modelId?: string
  embedModelId?: string
  workflowId?: string
  highlightedText?: {
    content: string
    type: 'code' | 'markdown' | 'plain'
  }
  artifact?: {
    id: string
    content: string
  }
  artifactLength?: 'short' | 'medium' | 'long'
  addComments?: boolean
  addLogs?: boolean
  fixBugs?: boolean
  webSearchEnabled?: boolean
  stream?: boolean
  temperature?: number
  maxTokens?: number
  similarityCutoff?: number
}

type DefaultResponse =
  | {
      type: 'completion.chunk'
      payload?: Dict
      content?: string
    }
  | {
      type: 'completion.response'
      payload?: Dict
      content?: string
    }
  | {
      type:
        | 'error'
        | 'completion.usage'
        | 'completion.sources'
        | 'completion.hitl.request'
        | 'event'
        | 'confirmation'
      payload?: Dict
      content?: string | number
    }

class ChatController {
  private bufferedResponse: string[] = []

  private generationActive: boolean = false

  private PARSING_THRESHOLD = 2

  private _timeout: number | null = null

  public requestTimeout: number | null = 5 * 60 * 1000 // 5 minutes

  private _streamToArtifactId: string | null = null

  public artifactMarkerStart = '|artifact|>'
  public artifactMarkerEnd = '<|artifact|'

  constructor(
    props?: Partial<{ requestTimeout: ChatController['requestTimeout'] }>
  ) {
    bindAll(this, 'processChatResponse', 'chatRequestCleanup')
    if (props) {
      this.requestTimeout = props.requestTimeout || this.requestTimeout
    }
  }

  private processChatResponse(
    response: MessageEvent['data'],
    _websocket: WebsocketRequest
  ) {
    const chatResponse: DefaultResponse = JSON.parse(response)
    console.log(chatResponse)
    if (chatResponse.type === 'event') {
      this.handleEvent(chatResponse)
    } else if (chatResponse.type === 'completion.usage') {
      _websocket.disconnect()
    } else if (chatResponse.type.startsWith('completion')) {
      this.handleCompletion(chatResponse)
    }
  }

  private chatRequestCleanup() {
    this.bufferedResponse = []
    this.generationActive = false
    if (this._timeout) {
      clearTimeout(this._timeout)
      this._timeout = null
    }
    appState.getState().setGenerationActive(this.generationActive)
  }

  public async sendMessage(): Promise<void> {
    const currentState = conversationStore.getState()
    const request = this.createRequestFromState(currentState)

    const websocket = new WebsocketRequest()

    if (this.requestTimeout)
      this._timeout = setTimeout(
        bind(() => {
          websocket.disconnect()
          console.warn('Request ended on timeout')
          this.chatRequestCleanup()
        }, this),
        this.requestTimeout
      )

    this.generationActive = true
    appState.getState().setGenerationActive(this.generationActive)

    try {
      this.initChatMessage()
      await websocket
        .onMessage(bind(this.processChatResponse, this))
        .onClose(bind(this.chatRequestCleanup, this))
        .send(request, 'ws://localhost:8080/api/canvas/completion')
    } catch (error) {
      console.log(error)
      websocket.disconnect()
      this.chatRequestCleanup()
    }
  }

  private handleEvent(event: DefaultResponse) {
    const currentState = conversationStore.getState()
    if (currentState.lastChatMessage === null) return

    if (event.payload?.payload?.artifactId) {
      this.initArtifact({
        id: String(event.payload.payload['artifactId']),
        content: '',
        author: 'assistant',
        timestamp: 0,
      })
    }
    if (
      !event.payload?.description ||
      typeof event.payload.description !== 'string'
    )
      return

    currentState.updateLastChatMessage({
      events: [
        ...currentState.lastChatMessage.events,
        {
          label: event.payload.description,
          type: 'progress',
        },
      ],
    })
  }

  private handleCompletion(event: DefaultResponse) {
    if (event.type == 'completion.chunk' && event.content !== undefined) {
      const currentState = conversationStore.getState()
      if (currentState.lastChatMessage === null) return

      this.bufferedResponse.push(event.content)
      const [messageStart, messageArtifact, messageEnd] = splitContent(
        this.bufferedResponse.join(''),
        this.artifactMarkerStart,
        this.artifactMarkerEnd
      )

      let updatedMessage = messageStart
      if (messageArtifact)
        updatedMessage += `[artifact id="${this._streamToArtifactId}"]`
      updatedMessage += messageEnd

      currentState.updateLastChatMessage({
        message: updatedMessage,
      })
      currentState.updateEditorDoc({
        content: messageArtifact,
      })
    }
  }

  private initChatMessage() {
    const state = conversationStore.getState()
    state.putNewChatMessage({
      role: 'user',
      events: [],
      message: state.inputMessage.value,
      timestamp: 0,
      context: state.inputMessage.context,
    })
    state.putNewChatMessage({
      role: 'assistant',
      events: [],
      message: '',
      timestamp: 0,
      context: [],
    })
    state.updateInputMessage({
      value: '',
    })
  }

  private initArtifact(
    artifact: ConversationStoreWithActions['currentArtifact']
  ) {
    const state = conversationStore.getState()
    this._streamToArtifactId = artifact.id
    if (state.currentArtifact.id != this._streamToArtifactId) {
      state.putNewEditorDoc(artifact)
    }
  }

  private createRequestFromState(
    state: ConversationStoreWithActions
  ): ChatCompletionRequest {
    const request: ChatCompletionRequest = {
      message: state.inputMessage.value,
      knowledge: [
        {
          type: 'VectorStore',
          id: 'design_library',
          client: 'qdrant',
        },
      ],
      chatHistory: [],
      webSearchEnabled: false,
    }
    if (state.currentArtifact.content != '') {
      request.artifact = {
        id: state.currentArtifact.id,
        content: state.currentArtifact.content,
      }
    }
    return request
  }
}

export default ChatController

import bind from 'lodash/bind'

class WebsocketRequest {
  private ws: WebSocket | null = null
  private messageHandlers: (<T>(
    response: T,
    socket: WebsocketRequest
  ) => void)[] = []
  private errorHandlers: ((error: Event, socket: WebsocketRequest) => void)[] =
    []
  private closeHandlers: ((
    event: CloseEvent,
    socket: WebsocketRequest
  ) => void)[] = []

  constructor() {}

  private async initializeWebSocket(url: string) {
    // Replace with your actual WebSocket server URL
    this.ws = new WebSocket(url)

    this.ws.onmessage = (event) => {
      const response = event.data
      this.messageHandlers.forEach((handler) => handler(response, this))
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.errorHandlers.forEach((handler) => handler(error, this))
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed')
      this.closeHandlers.forEach((handler) => handler(event, this))
    }

    return new Promise<void>(
      bind((resolve, reject) => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.onopen = () => {
            console.log('WebSocket open: ' + url)
            resolve()
          }
        } else {
          reject()
        }
      }, this)
    )
  }

  public async send(request: unknown, url: string): Promise<WebsocketRequest> {
    if (!this.ws) {
      await this.initializeWebSocket(url)
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    this.ws.send(JSON.stringify(request))
    return this
  }

  public onMessage(
    handler: <T>(response: T, socket: WebsocketRequest) => void
  ): WebsocketRequest {
    this.messageHandlers.push(handler)
    return this
  }

  public onError(
    handler: (error: Event, socket: WebsocketRequest) => void
  ): WebsocketRequest {
    this.errorHandlers.push(handler)
    return this
  }

  public onClose(
    handler: (event: CloseEvent, socket: WebsocketRequest) => void
  ): WebsocketRequest {
    this.closeHandlers.push(handler)
    return this
  }

  public removeMessageHandler(
    handler: <T>(response: T, socket: WebsocketRequest) => void
  ): WebsocketRequest {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    return this
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export default WebsocketRequest

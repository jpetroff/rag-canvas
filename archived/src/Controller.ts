import ChatController from '@pages/MainController'

class AppController {
  private _chatController: ChatController

  _currentLocation: string = '/chat'

  constructor() {
    this._chatController = new ChatController()
  }

  public navigate(location: string) {}

  public get chatController() {
    return this._chatController
  }
}

const appController = new AppController()

export default appController

const chatController = appController.chatController

export { chatController }

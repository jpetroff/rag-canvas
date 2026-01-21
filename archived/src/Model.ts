/* 
Zustand /tsuːʃtant/ stores represent model
*/

/* 
Editor and chat state
*/
import {
  conversationStore,
  useConversationStore,
  type ConversationStoreWithActions,
} from '@/store/conversationStore'

export {
  conversationStore,
  useConversationStore,
  type ConversationStoreWithActions,
}

/*
  Main Page App state
*/
import {
  appState,
  useAppState,
  type AppStatePropsWithActions,
} from '@/store/appStateStore'

export { appState, useAppState, type AppStatePropsWithActions }

/* 
Global Editor
*/

import { MainEditor } from './store/editorStore'
export { MainEditor }

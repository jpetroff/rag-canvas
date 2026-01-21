import { useStore } from 'zustand/react'
import { createStore, type StoreApi } from 'zustand/vanilla'
import { produce } from 'immer'

export interface AppStateProps {
  generationActive: boolean
}

export interface AppStatePropsWithActions extends AppStateProps {
  setGenerationActive: (value: boolean) => void
}

const appState = createStore<AppStatePropsWithActions>()((set, get) => {
  return {
    generationActive: false,
    setGenerationActive: (value) => {
      set({ generationActive: value })
    },
  }
})

const useAppState = <T>(selector: (state: AppStatePropsWithActions) => T) =>
  useStore<StoreApi<AppStatePropsWithActions>, T>(appState, selector)

export { appState, useAppState }

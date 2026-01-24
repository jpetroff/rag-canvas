import { create } from 'zustand'
import type { Id } from '@convex/_generated/dataModel'
import type { ConvexReactClient } from 'convex/react'
import { api } from '@convex/_generated/api'

export interface Message {
  _id: Id<'messages'>
  content: string
  has_artifact: Id<'artifacts'> | null
  metadata: { role: 'user' | 'assistant'; [key: string]: unknown }
  from_chat: Id<'chats'>
  _creationTime: number
}

export interface Artifact {
  _id: Id<'artifacts'>
  title: string
  content: string
  from_message: Id<'messages'>
  from_chat: Id<'chats'>
  _creationTime: number
}

export interface Chat {
  _id: Id<'chats'>
  title: string
  user: Id<'users'>
  _creationTime: number
}

export interface User {
  _id: Id<'users'>
  username: string
  name: string
  _creationTime: number
}

interface CanvasState {
  // Convex client instance
  convexClient: ConvexReactClient | null

  // User
  userId: Id<'users'> | null
  user: User | null

  // Current chat
  currentChatId: Id<'chats'> | null
  currentChat: Chat | null

  // Messages
  messages: Message[]

  // Current artifact being edited
  currentArtifactId: Id<'artifacts'> | null
  currentArtifact: Artifact | null

  // Chats list
  chats: Chat[]

  // Loading states
  isLoadingUser: boolean
  isLoadingChats: boolean
  isLoadingMessages: boolean
  isLoadingArtifact: boolean
  isSendingMessage: boolean

  // Error states
  error: string | null

  // Initialize store with Convex client
  initialize: (client: ConvexReactClient) => void

  // User actions
  initializeUser: (username: string) => Promise<void>

  // Chat actions
  loadChats: (userId: Id<'users'>) => Promise<void>
  createNewChat: (userId: Id<'users'>, title?: string) => Promise<Id<'chats'>>
  switchChat: (chatId: Id<'chats'>) => void
  updateChatTitle: (chatId: Id<'chats'>, title: string) => Promise<void>

  // Message actions
  loadMessages: (chatId: Id<'chats'>) => Promise<void>
  sendMessage: (chatId: Id<'chats'>, content: string) => Promise<void>

  // Artifact actions
  loadArtifact: (artifactId: Id<'artifacts'>) => Promise<void>
  loadLatestArtifactForChat: (chatId: Id<'chats'>) => Promise<void>
  updateArtifactContent: (
    artifactId: Id<'artifacts'>,
    content: string
  ) => Promise<void>

  // Internal state setters (for subscriptions)
  _setChats: (chats: Chat[]) => void
  _setMessages: (messages: Message[]) => void
  _setCurrentArtifact: (
    artifactId: Id<'artifacts'> | null,
    artifact: Artifact | null
  ) => void
  _updateLocalArtifactContent: (content: string) => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  convexClient: null,
  userId: null,
  user: null,
  currentChatId: null,
  currentChat: null,
  messages: [],
  currentArtifactId: null,
  currentArtifact: null,
  chats: [],
  isLoadingUser: false,
  isLoadingChats: false,
  isLoadingMessages: false,
  isLoadingArtifact: false,
  isSendingMessage: false,
  error: null,

  // Initialize with Convex client
  initialize: (client: ConvexReactClient) => {
    set({ convexClient: client })
  },

  // User initialization
  initializeUser: async (username: string) => {
    const { convexClient } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    set({ isLoadingUser: true, error: null })

    try {
      // Try to get existing user
      const existingUser = await convexClient.query(api.users.getByUsername, {
        username,
      })

      if (existingUser) {
        set({
          userId: existingUser._id,
          user: existingUser,
          isLoadingUser: false,
        })
      } else {
        // Create new user
        const newUserId = await convexClient.mutation(api.users.create, {
          username,
          name: username,
        })

        const newUser = await convexClient.query(api.users.getByUsername, {
          username,
        })
        set({ userId: newUserId, user: newUser || null, isLoadingUser: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoadingUser: false })
      throw error
    }
  },

  // Load chats for user
  loadChats: async (userId: Id<'users'>) => {
    const { convexClient } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    set({ isLoadingChats: true, error: null })

    try {
      const chats = await convexClient.query(api.chats.list, { userId })
      set({ chats, isLoadingChats: false })

      // Auto-select first chat if none selected
      const { currentChatId } = get()
      if (!currentChatId && chats.length > 0) {
        get().switchChat(chats[0]._id)
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoadingChats: false })
      throw error
    }
  },

  // Create new chat
  createNewChat: async (userId: Id<'users'>, title = 'New Chat') => {
    const { convexClient } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    set({ error: null })

    try {
      const chatId = await convexClient.mutation(api.chats.create, {
        title,
        userId,
      })

      // Reload chats to include the new one
      await get().loadChats(userId)

      // Switch to new chat
      get().switchChat(chatId)

      return chatId
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  // Switch to different chat
  switchChat: (chatId: Id<'chats'>) => {
    const { chats } = get()
    const chat = chats.find((c) => c._id === chatId)

    set({
      currentChatId: chatId,
      currentChat: chat || null,
      messages: [],
    })

    // Load messages for this chat
    get().loadMessages(chatId)

    // Load latest artifact for this chat
    get().loadLatestArtifactForChat(chatId)
  },

  // Update chat title
  updateChatTitle: async (chatId: Id<'chats'>, title: string) => {
    const { convexClient, userId } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    set({ error: null })

    try {
      await convexClient.mutation(api.chats.updateTitle, {
        chatId,
        title,
      })

      // Update local state
      set((state) => ({
        chats: state.chats.map((chat) =>
          chat._id === chatId ? { ...chat, title } : chat
        ),
        currentChat:
          state.currentChat && state.currentChat._id === chatId
            ? { ...state.currentChat, title }
            : state.currentChat,
      }))

      // Reload chats if userId is available
      if (userId) {
        await get().loadChats(userId)
      }
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  // Load messages for chat
  loadMessages: async (chatId: Id<'chats'>) => {
    const { convexClient } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    set({ isLoadingMessages: true, error: null })

    try {
      const messages = await convexClient.query(api.messages.listByChat, {
        chatId,
      })
      set({ messages, isLoadingMessages: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoadingMessages: false })
      throw error
    }
  },

  // Send message and generate artifact
  sendMessage: async (chatId: Id<'chats'>, content: string) => {
    const { convexClient } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    set({ isSendingMessage: true, error: null })

    try {
      // Create user message
      const userMessageId = await convexClient.mutation(api.messages.create, {
        content,
        chatId,
        metadata: { role: 'user' },
      })

      // Optimistically add user message
      const userMessage: Message = {
        _id: userMessageId,
        content,
        has_artifact: null,
        metadata: { role: 'user' },
        from_chat: chatId,
        _creationTime: Date.now(),
      }
      set((state) => ({ messages: [...state.messages, userMessage] }))

      // Generate artifact (includes assistant message)
      const result = await convexClient.mutation(api.ai.generateArtifact, {
        userMessage: content,
        chatId,
      })

      if (result) {
        // Add assistant message
        const assistantMessage: Message = {
          _id: result.messageId,
          content: result.content,
          has_artifact: result.artifactId,
          metadata: { role: 'assistant' },
          from_chat: chatId,
          _creationTime: Date.now(),
        }
        set((state) => ({ messages: [...state.messages, assistantMessage] }))

        // Set current artifact
        const artifact: Artifact = {
          _id: result.artifactId,
          title: result.artifact.title,
          content: result.artifact.content,
          from_message: result.messageId,
          from_chat: chatId,
          _creationTime: Date.now(),
        }
        set({
          currentArtifactId: result.artifactId,
          currentArtifact: artifact,
        })
      }

      set({ isSendingMessage: false })
    } catch (error) {
      set({ error: (error as Error).message, isSendingMessage: false })
      throw error
    }
  },

  // Load specific artifact
  loadArtifact: async (artifactId: Id<'artifacts'>) => {
    const { convexClient } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    set({ isLoadingArtifact: true, error: null })

    try {
      const artifact = await convexClient.query(api.artifacts.get, {
        artifactId,
      })
      set({
        currentArtifactId: artifactId,
        currentArtifact: artifact as Artifact,
        isLoadingArtifact: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, isLoadingArtifact: false })
      throw error
    }
  },

  // Load latest artifact for chat
  loadLatestArtifactForChat: async (chatId: Id<'chats'>) => {
    const { convexClient } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    set({ isLoadingArtifact: true, error: null })

    try {
      const artifacts = await convexClient.query(api.artifacts.listByChat, {
        chatId,
      })

      if (artifacts && artifacts.length > 0) {
        // Get most recent artifact
        const sortedArtifacts = [...artifacts].sort(
          (a, b) => b._creationTime - a._creationTime
        )
        const latestArtifact = sortedArtifacts[0]

        set({
          currentArtifactId: latestArtifact._id,
          currentArtifact: latestArtifact as Artifact,
          isLoadingArtifact: false,
        })
      } else {
        set({ isLoadingArtifact: false })
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoadingArtifact: false })
      throw error
    }
  },

  // Update artifact content
  updateArtifactContent: async (
    artifactId: Id<'artifacts'>,
    content: string
  ) => {
    const { convexClient } = get()
    if (!convexClient) throw new Error('Convex client not initialized')

    // Optimistically update local state
    set((state) => ({
      currentArtifact: state.currentArtifact
        ? { ...state.currentArtifact, content }
        : null,
    }))

    try {
      await convexClient.mutation(api.artifacts.update, {
        artifactId,
        content,
      })
    } catch (error) {
      set({ error: (error as Error).message })
      // Reload artifact to revert optimistic update
      await get().loadArtifact(artifactId)
      throw error
    }
  },

  // Internal setters for subscriptions
  _setChats: (chats: Chat[]) => set({ chats }),
  _setMessages: (messages: Message[]) => set({ messages }),
  _setCurrentArtifact: (
    artifactId: Id<'artifacts'> | null,
    artifact: Artifact | null
  ) => set({ currentArtifactId: artifactId, currentArtifact: artifact }),
  _updateLocalArtifactContent: (content: string) =>
    set((state) => ({
      currentArtifact: state.currentArtifact
        ? { ...state.currentArtifact, content }
        : null,
    })),
}))

import { create } from "zustand";
import type { Id } from "@convex/_generated/dataModel";

export interface Message {
  _id: Id<"messages">;
  content: string;
  has_artifact: Id<"artifacts"> | null;
  metadata: any;
  from_chat: Id<"chats">;
  _creationTime: number;
}

export interface Artifact {
  _id: Id<"artifacts">;
  title: string;
  content: string;
  from_message: Id<"messages">;
  from_chat: Id<"chats">;
  _creationTime: number;
}

export interface Chat {
  _id: Id<"chats">;
  title: string;
  user: Id<"users">;
  _creationTime: number;
}

interface CanvasState {
  // Current chat
  currentChatId: Id<"chats"> | null;
  currentChat: Chat | null;
  
  // Messages
  messages: Message[];
  
  // Current artifact being edited
  currentArtifactId: Id<"artifacts"> | null;
  currentArtifact: Artifact | null;
  
  // Chats list
  chats: Chat[];
  
  // Actions
  setCurrentChat: (chatId: Id<"chats"> | null) => void;
  setCurrentChatData: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setCurrentArtifact: (artifactId: Id<"artifacts"> | null, artifact: Artifact | null) => void;
  updateArtifactContent: (content: string) => void;
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  currentChatId: null,
  currentChat: null,
  messages: [],
  currentArtifactId: null,
  currentArtifact: null,
  chats: [],
  
  setCurrentChat: (chatId) => set({ currentChatId: chatId }),
  setCurrentChatData: (chat) => set({ currentChat: chat }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setCurrentArtifact: (artifactId, artifact) => set({ currentArtifactId: artifactId, currentArtifact: artifact }),
  updateArtifactContent: (content) => set((state) => ({
    currentArtifact: state.currentArtifact ? { ...state.currentArtifact, content } : null,
  })),
  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),
}));

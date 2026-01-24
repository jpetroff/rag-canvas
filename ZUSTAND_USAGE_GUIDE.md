# Zustand Store Usage Guide

## Quick Reference

### Importing the Store

```typescript
import { useCanvasStore } from '@/store/canvasStore'
```

### Using in Components

```typescript
function MyComponent() {
  // Select only the state you need (for optimal re-renders)
  const { currentChat, messages, sendMessage } = useCanvasStore()
  
  // Use the state and actions
  const handleClick = async () => {
    await sendMessage(chatId, content)
  }
  
  return <div>{currentChat?.title}</div>
}
```

## Available State

### User State
```typescript
userId: Id<"users"> | null
user: User | null
isLoadingUser: boolean
```

### Chat State
```typescript
currentChatId: Id<"chats"> | null
currentChat: Chat | null
chats: Chat[]
isLoadingChats: boolean
```

### Message State
```typescript
messages: Message[]
isLoadingMessages: boolean
isSendingMessage: boolean
```

### Artifact State
```typescript
currentArtifactId: Id<"artifacts"> | null
currentArtifact: Artifact | null
isLoadingArtifact: boolean
```

### Error State
```typescript
error: string | null
```

## Available Actions

### Initialization
```typescript
// Must be called once in Main.tsx
initialize(convexClient: ConvexReactClient): void
```

### User Actions
```typescript
// Initialize user (create if doesn't exist)
await initializeUser(username: string): Promise<void>
```

### Chat Actions
```typescript
// Load all chats for user
await loadChats(userId: Id<"users">): Promise<void>

// Create a new chat
const chatId = await createNewChat(userId: Id<"users">, title?: string): Promise<Id<"chats">>

// Switch to a different chat (automatically loads messages and artifact)
switchChat(chatId: Id<"chats">): void

// Update chat title
await updateChatTitle(chatId: Id<"chats">, title: string): Promise<void>
```

### Message Actions
```typescript
// Load messages for a chat
await loadMessages(chatId: Id<"chats">): Promise<void>

// Send message and generate artifact (handles optimistic updates)
await sendMessage(chatId: Id<"chats">, content: string): Promise<void>
```

### Artifact Actions
```typescript
// Load a specific artifact
await loadArtifact(artifactId: Id<"artifacts">): Promise<void>

// Load the most recent artifact for a chat
await loadLatestArtifactForChat(chatId: Id<"chats">): Promise<void>

// Update artifact content (with optimistic updates)
await updateArtifactContent(artifactId: Id<"artifacts">, content: string): Promise<void>
```

## Common Patterns

### 1. Loading Data on Component Mount

```typescript
function MyComponent() {
  const { userId, loadChats } = useCanvasStore()
  
  useEffect(() => {
    if (userId) {
      loadChats(userId).catch(console.error)
    }
  }, [userId, loadChats])
  
  return <div>...</div>
}
```

### 2. Handling User Actions

```typescript
function SendButton() {
  const { currentChatId, isSendingMessage, sendMessage } = useCanvasStore()
  const [input, setInput] = useState('')
  
  const handleSend = async () => {
    if (!input.trim() || !currentChatId) return
    
    try {
      await sendMessage(currentChatId, input)
      setInput('') // Clear input on success
    } catch (error) {
      console.error('Failed to send:', error)
      // Input remains for retry
    }
  }
  
  return (
    <button onClick={handleSend} disabled={isSendingMessage}>
      Send
    </button>
  )
}
```

### 3. Optimistic UI Updates

The store automatically handles optimistic updates for:
- Sending messages (message appears immediately)
- Updating artifacts (changes appear immediately)

If an error occurs, the store will:
- Log the error to `error` state
- Revert optimistic updates for artifacts
- Keep optimistic messages (they're already sent)

### 4. Showing Loading States

```typescript
function ChatList() {
  const { chats, isLoadingChats } = useCanvasStore()
  
  if (isLoadingChats) {
    return <LoadingSpinner />
  }
  
  return (
    <div>
      {chats.map(chat => (
        <ChatItem key={chat._id} chat={chat} />
      ))}
    </div>
  )
}
```

### 5. Error Handling

```typescript
function ErrorDisplay() {
  const { error } = useCanvasStore()
  
  if (!error) return null
  
  return (
    <div className="error">
      {error}
    </div>
  )
}
```

## Best Practices

### ✅ DO

1. **Select only what you need**
   ```typescript
   // Good: Only re-renders when messages change
   const { messages } = useCanvasStore()
   ```

2. **Use loading states for better UX**
   ```typescript
   const { isLoadingChats, chats } = useCanvasStore()
   ```

3. **Handle errors in async actions**
   ```typescript
   try {
     await sendMessage(chatId, content)
   } catch (error) {
     console.error('Error:', error)
     // Show user-friendly message
   }
   ```

4. **Keep UI-only state local**
   ```typescript
   // Good: Input field state stays in component
   const [input, setInput] = useState('')
   const { sendMessage } = useCanvasStore()
   ```

### ❌ DON'T

1. **Don't use useQuery/useMutation in components**
   ```typescript
   // ❌ Bad: Bypasses store
   const chats = useQuery(api.chats.list, { userId })
   
   // ✅ Good: Use store
   const { chats } = useCanvasStore()
   ```

2. **Don't mutate state directly**
   ```typescript
   // ❌ Bad: Direct mutation
   const { messages } = useCanvasStore()
   messages.push(newMessage)
   
   // ✅ Good: Use store actions
   const { sendMessage } = useCanvasStore()
   await sendMessage(chatId, content)
   ```

3. **Don't select entire store if you only need part**
   ```typescript
   // ❌ Bad: Re-renders on any state change
   const store = useCanvasStore()
   
   // ✅ Good: Re-renders only when messages change
   const { messages } = useCanvasStore()
   ```

## Debugging

### Check Current State

```typescript
// In browser console or component
const state = useCanvasStore.getState()
console.log('Current state:', state)
```

### Subscribe to Changes

```typescript
// Debug: Log all state changes
useCanvasStore.subscribe((state, prevState) => {
  console.log('State changed:', { state, prevState })
})
```

### Test Actions Directly

```typescript
// In browser console
const store = useCanvasStore.getState()
await store.sendMessage(chatId, 'Test message')
```

## Migration from Old Pattern

### Before (useQuery/useMutation)
```typescript
function OldComponent({ userId }) {
  const chats = useQuery(api.chats.list, { userId })
  const createChat = useMutation(api.chats.create)
  
  const handleCreate = async () => {
    await createChat({ title: 'New', userId })
  }
  
  return <div>{chats?.length}</div>
}
```

### After (Zustand)
```typescript
function NewComponent() {
  const { chats, userId, createNewChat } = useCanvasStore()
  
  const handleCreate = async () => {
    await createNewChat(userId!, 'New')
  }
  
  return <div>{chats.length}</div>
}
```

## Performance Tips

1. **Memoize expensive computations**
   ```typescript
   const { messages } = useCanvasStore()
   const sortedMessages = useMemo(
     () => messages.sort((a, b) => a._creationTime - b._creationTime),
     [messages]
   )
   ```

2. **Use selectors for derived state**
   ```typescript
   const userMessages = useCanvasStore(
     state => state.messages.filter(m => m.metadata.role === 'user')
   )
   ```

3. **Avoid unnecessary subscriptions**
   ```typescript
   // ❌ Bad: Subscribes to entire store
   const store = useCanvasStore()
   
   // ✅ Good: Only subscribes to needed state
   const messages = useCanvasStore(state => state.messages)
   ```

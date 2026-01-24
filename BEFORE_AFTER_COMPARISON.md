# Before & After Comparison

## Component: ChatSidebar

### BEFORE (Old Approach with Duplicate Hooks)

```typescript
export function ChatSidebar({ chatId, userId }: ChatSidebarProps) {
  // ❌ Local state for backend data
  const [artifactToLoad, setArtifactToLoad] = useState<Id<'artifacts'> | null>(null)
  
  // ❌ Multiple Convex hooks in component
  const generateArtifact = useMutation(api.ai.generateArtifact)
  const createMessage = useMutation(api.messages.create)
  const updateChatTitle = useMutation(api.chats.updateTitle)
  const chatsQuery = useQuery(api.chats.list, { userId })
  const messagesQuery = useQuery(api.messages.listByChat, chatId ? { chatId } : 'skip')
  const artifactQuery = useQuery(api.artifacts.get, artifactToLoad ? { artifactId: artifactToLoad } : 'skip')
  
  // ❌ Manual query-to-store synchronization
  useEffect(() => {
    if (messagesQuery) {
      setMessages(messagesQuery)
    }
  }, [messagesQuery, setMessages])
  
  // ❌ Manual query-to-store synchronization for artifacts
  useEffect(() => {
    if (artifactQuery && artifactToLoad) {
      setCurrentArtifact(artifactToLoad, artifactQuery as any)
    }
  }, [artifactQuery, artifactToLoad, setCurrentArtifact])
  
  // ❌ Manual optimistic updates
  const handleSend = async () => {
    const userMessageId = await createMessage({
      content: userMessageContent,
      chatId,
      metadata: { role: 'user' },
    })
    
    // Manual optimistic update
    addMessage({
      _id: userMessageId,
      content: userMessageContent,
      // ... manual construction
    } as any)
    
    const result = await generateArtifact({
      userMessage: userMessageContent,
      chatId,
    })
    
    // Another manual optimistic update
    if (result) {
      addMessage({
        _id: result.messageId,
        // ... manual construction
      } as any)
      
      setCurrentArtifact(result.artifactId, {
        // ... manual construction
      } as any)
    }
  }
  
  // ❌ Manual state management for chat switching
  const handleChatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedChatId = e.target.value as Id<'chats'>
    if (selectedChatId && chatsQuery) {
      const selectedChat = chatsQuery.find((chat) => chat._id === selectedChatId)
      if (selectedChat) {
        setCurrentChat(selectedChatId)
        setCurrentChatData(selectedChat)
      }
    }
  }
}
```

### AFTER (New Approach with Zustand Only)

```typescript
export function ChatSidebar() {
  // ✅ Only UI state (ephemeral, doesn't need global management)
  const [input, setInput] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  
  // ✅ All data from Zustand store
  const {
    currentChatId,
    currentChat,
    messages,
    chats,
    isSendingMessage,
    sendMessage,        // ✅ Store action
    switchChat,         // ✅ Store action
    updateChatTitle,    // ✅ Store action
    loadArtifact,       // ✅ Store action
  } = useCanvasStore()
  
  // ✅ No manual synchronization needed - store handles it
  // ✅ No query hooks
  // ✅ No mutation hooks
  
  // ✅ Simple handler - store does all the work
  const handleSend = async () => {
    if (!input.trim() || !currentChatId || isSendingMessage) return
    
    const userMessageContent = input.trim()
    setInput('')
    
    try {
      // ✅ Single store action handles everything:
      // - Creates user message
      // - Adds optimistically to store
      // - Generates artifact
      // - Adds assistant message
      // - Sets current artifact
      await sendMessage(currentChatId, userMessageContent)
    } catch (error) {
      console.error('Error sending message:', error)
      setInput(userMessageContent) // Restore on error
    }
  }
  
  // ✅ Simple handler - store handles chat switching and message loading
  const handleChatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedChatId = e.target.value as Id<'chats'>
    if (selectedChatId) {
      switchChat(selectedChatId) // ✅ Store action does it all
    }
  }
}
```

## Key Improvements

### 1. Removed Duplicate Hooks
**Before:** 6 hooks (3 useQuery, 3 useMutation)  
**After:** 0 hooks - only Zustand store

### 2. Eliminated Manual Synchronization
**Before:** 2 useEffect hooks to sync queries to store  
**After:** 0 - store manages all data automatically

### 3. Simplified Message Sending
**Before:** 50+ lines of manual optimistic updates  
**After:** 3 lines - single store action

### 4. No Props Needed
**Before:** Requires `chatId` and `userId` props  
**After:** Gets everything from store

### 5. Clearer Separation of Concerns
**Before:** Backend logic mixed with UI logic  
**After:** UI only, backend logic in store

### 6. Better Error Handling
**Before:** No centralized error handling  
**After:** Store handles errors, UI can restore state

## Line Count Comparison

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| ChatSidebar.tsx | 307 lines | 188 lines | 39% |
| CanvasPage.tsx | 144 lines | 77 lines | 47% |
| Main.tsx | 59 lines | 36 lines | 39% |
| canvasStore.ts | 74 lines | 314 lines | +324% |
| **Total** | 584 lines | 615 lines | +5% total, but much better organized |

## Store Benefits

The store grew significantly but gained:
- All backend logic centralized
- Reusable actions across components
- Built-in loading states
- Built-in error handling
- Optimistic updates with rollback
- Single source of truth for all data
- Easy to test independently

## Update Flow Comparison

### BEFORE (Multiple Update Sources)
```
User Action
    ↓
Component calls useMutation
    ↓
Backend updates
    ↓
useQuery refetches
    ↓
useEffect syncs to Zustand
    ↓
Component re-renders (2-3 times)
```

### AFTER (Single Update Source)
```
User Action
    ↓
Component calls Zustand action
    ↓
Zustand action:
  1. Optimistically updates state
  2. Calls backend
  3. Updates with result
    ↓
Component re-renders (1 time)
```

## Testing Benefits

### BEFORE
- Hard to test: Need to mock useQuery, useMutation
- Backend logic scattered across components
- Difficult to test error scenarios
- Complex setup with ConvexProvider

### AFTER
- Easy to test: Mock store actions
- Backend logic isolated in store
- Easy to test error scenarios
- Store can be tested independently

## Example: Testing Message Sending

### BEFORE
```typescript
// Complex test setup needed
test('sends message', async () => {
  const mockCreateMessage = jest.fn()
  const mockGenerateArtifact = jest.fn()
  // Need to mock useQuery, useMutation, etc.
  // Test is tightly coupled to implementation
})
```

### AFTER
```typescript
// Simple test
test('sends message', async () => {
  const store = useCanvasStore.getState()
  await store.sendMessage(chatId, 'Hello')
  expect(store.messages).toContain(/* expected message */)
})
```

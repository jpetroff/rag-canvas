# Architecture Diagram

## BEFORE: Scattered State Management

```
┌─────────────────────────────────────────────────────────────┐
│                        COMPONENTS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Main.tsx   │  │CanvasPage.tsx│  │ChatSidebar.tsx│     │
│  │              │  │              │  │              │     │
│  │ useQuery  ◄──┼──┼─useQuery  ◄──┼──┼─useQuery  ◄──┼──┐  │
│  │ useMutation  │  │ useMutation  │  │ useMutation  │  │  │
│  │ useState     │  │ useEffect    │  │ useEffect    │  │  │
│  │ useEffect    │  │ useRef       │  │ useState     │  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │  │
│         │                 │                 │          │  │
│         │ Manual Sync     │ Manual Sync     │          │  │
│         ▼                 ▼                 ▼          │  │
│  ┌──────────────────────────────────────────────────┐  │  │
│  │           Zustand Store (Sync Only)              │  │  │
│  │  • currentChatId, currentChat                    │  │  │
│  │  • messages, currentArtifact                     │  │  │
│  │  • chats                                         │  │  │
│  │  • NO backend logic                              │  │  │
│  └──────────────────────────────────────────────────┘  │  │
│                                                         │  │
└─────────────────────────────────────────────────────────┼──┘
                                                          │
                    ┌─────────────────────────────────────┘
                    │ DUPLICATE QUERIES
                    │ Multiple components query same data
                    │
                    ▼
            ┌───────────────┐
            │ Convex Backend│
            └───────────────┘

Problems:
❌ Backend logic in components
❌ Duplicate queries (chats.list, artifacts.get)
❌ Manual synchronization needed
❌ Complex useEffect chains
❌ Hard to test
❌ Optimistic updates scattered
❌ No centralized error handling
```

## AFTER: Centralized State Management

```
┌─────────────────────────────────────────────────────────────┐
│                        COMPONENTS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Main.tsx   │  │CanvasPage.tsx│  │ChatSidebar.tsx│     │
│  │              │  │              │  │              │     │
│  │ ✅ Zustand   │  │ ✅ Zustand   │  │ ✅ Zustand   │     │
│  │ (UI Only)    │  │ (UI Only)    │  │ (UI Only)    │     │
│  │              │  │              │  │ useState* ◄──┼──┐  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │  │
│         │                 │                 │          │  │
│         │ Select State    │ Select State    │          │  │
│         │ Call Actions    │ Call Actions    │          │  │
│         ▼                 ▼                 ▼          │  │
│  ┌──────────────────────────────────────────────────┐  │  │
│  │     Zustand Store (SINGLE SOURCE OF TRUTH)       │  │  │
│  │                                                   │  │  │
│  │  STATE:                                           │  │  │
│  │  • userId, user                                   │  │  │
│  │  • currentChatId, currentChat, chats             │  │  │
│  │  • messages, currentArtifact                     │  │  │
│  │  • isLoadingX, isSendingY (loading states)      │  │  │
│  │  • error (centralized error handling)            │  │  │
│  │                                                   │  │  │
│  │  ACTIONS (Backend Logic):                         │  │  │
│  │  ├─ initializeUser()                             │  │  │
│  │  ├─ loadChats()                                  │  │  │
│  │  ├─ createNewChat()                              │  │  │
│  │  ├─ switchChat()                                 │  │  │
│  │  ├─ updateChatTitle()                            │  │  │
│  │  ├─ loadMessages()                               │  │  │
│  │  ├─ sendMessage() ◄─ Optimistic updates          │  │  │
│  │  ├─ loadArtifact()                               │  │  │
│  │  └─ updateArtifactContent() ◄─ Optimistic        │  │  │
│  │                                                   │  │  │
│  └───────────────────────┬───────────────────────────┘  │  │
│                          │                              │  │
│                          │ SINGLE QUERY PATH            │  │
│                          │ No duplication               │  │
└──────────────────────────┼──────────────────────────────┼──┘
                           │                              │
                           ▼                              │
                   ┌───────────────┐                      │
                   │ Convex Backend│                      │
                   └───────────────┘                      │
                                                          │
  * useState only for ephemeral UI state ◄────────────────┘
    (input fields, edit mode, etc.)

Benefits:
✅ All backend logic in store
✅ Single query per resource (no duplication)
✅ Automatic state synchronization
✅ Clean, simple components
✅ Easy to test
✅ Centralized optimistic updates
✅ Centralized error handling
✅ Loading states everywhere
✅ Single source of truth
```

## Data Flow Comparison

### BEFORE: Complex Flow
```
User clicks "Send Message"
        │
        ▼
Component handler
        │
        ├─► Call useMutation(createMessage)
        │           │
        │           ▼
        │   Convex creates message
        │           │
        ├─► Add to store optimistically (manual)
        │
        ├─► Call useMutation(generateArtifact)
        │           │
        │           ▼
        │   Convex generates artifact
        │           │
        ├─► Add message to store (manual)
        │
        └─► Set artifact in store (manual)
                │
                ▼
        useQuery refetches (maybe)
                │
                ▼
        useEffect syncs to store
                │
                ▼
        Component re-renders (3-4 times)
```

### AFTER: Simple Flow
```
User clicks "Send Message"
        │
        ▼
Component calls store.sendMessage()
        │
        ▼
Store action:
  1. Optimistically add user message ───┐
  2. Call Convex mutations           │
  3. Add assistant message           │
  4. Set current artifact            │
  5. Update all state automatically  │
        │                               │
        ▼                               │
Store updates (SINGLE SOURCE)          │
        │                               │
        ▼                               │
Component re-renders (1 time) ◄────────┘
```

## Component Responsibility

### BEFORE
```
Component = UI + Backend Logic + State Sync + Error Handling
```

### AFTER
```
Component = UI Only
Store = Backend Logic + State Management + Error Handling
```

## Testing Architecture

### BEFORE
```
Component Tests
  ├─ Need to mock: useQuery, useMutation
  ├─ Need to mock: ConvexProvider
  ├─ Need to mock: Zustand store
  ├─ Complex setup
  └─ Tightly coupled to implementation

Integration Tests
  └─ Hard to test: Logic is scattered
```

### AFTER
```
Store Tests (Isolated)
  ├─ Test: All actions independently
  ├─ Test: Optimistic updates
  ├─ Test: Error scenarios
  ├─ Test: Loading states
  └─ No UI concerns

Component Tests (Simple)
  ├─ Mock: Only store
  ├─ Test: UI interactions
  └─ No backend concerns

Integration Tests (Clear)
  └─ Test: User workflows end-to-end
```

## Performance Improvement

### BEFORE
```
Component Renders per User Action:

Send Message:
  1. User types → Component re-renders (input change)
  2. Click send → Component re-renders (mutation pending)
  3. Message created → useQuery refetches
  4. Messages arrive → useEffect syncs
  5. Store updates → Component re-renders
  6. Artifact created → useQuery refetches
  7. Artifact arrives → useEffect syncs
  8. Store updates → Component re-renders

Total: 5-6 re-renders per message
Multiple network requests for duplicate queries
```

### AFTER
```
Component Renders per User Action:

Send Message:
  1. User types → Component re-renders (input change)
  2. Click send → Store updates optimistically
  3. Store action completes → Component re-renders

Total: 2 re-renders per message
No duplicate queries
Optimistic updates for instant UI feedback
```

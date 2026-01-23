# AI Canvas

A single-page web application that allows users to create and edit text documents with the help of an AI assistant. Similar to OpenAI Canvas and Open Canvas.

## Features

- **Rich Text Editor**: TipTap-based editor with formatting tools (bold, italic, headings, lists, blockquotes, code blocks)
- **AI Chat Sidebar**: Interactive chat interface for communicating with the AI assistant
- **Artifact Generation**: AI assistant generates text documents (artifacts) based on user requests
- **Real-time Updates**: Zustand for state management and Convex for backend persistence
- **Mock AI**: Currently uses mock AI responses (actual AI integration to be implemented separately)

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Tailwind CSS, custom components (shadcn-style)
- **State Management**: Zustand
- **Backend**: Convex (database and serverless functions)
- **Rich Text Editor**: TipTap with StarterKit
- **Routing**: React Router DOM

## Setup

### Prerequisites

- Bun (package manager)
- Convex account and project

### Installation

1. Install dependencies:
```bash
bun install
```

2. Set up Convex:
   - Create a Convex project at [convex.dev](https://convex.dev)
   - Get your Convex deployment URL
   - Create a `.env.local` file in the root directory:
   ```
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   ```

3. Start the Convex dev server (in a separate terminal):
```bash
bunx convex dev
```

4. Start the development server:
```bash
bun run dev
```

The app will be available at `http://localhost:8081`

## Project Structure

```
src/
  components/     # Basic UI components (Button, Input, Card, etc.)
  fragments/      # Higher-level components (ChatSidebar, RichTextEditor)
  pages/          # React Router pages (CanvasPage)
  store/          # Zustand stores (canvasStore)
  utils/          # Utility functions (Convex client setup)
convex/
  chats.ts        # Chat CRUD operations
  messages.ts     # Message CRUD operations
  artifacts.ts    # Artifact CRUD operations
  ai.ts           # Mock AI artifact generation
  users.ts        # User management
  schema.ts       # Database schema
```

## Usage

1. **Create a Chat**: Click "New Chat" to start a new conversation
2. **Send a Message**: Type your request in the chat input and press Enter
3. **View Artifact**: When the AI responds with an artifact, click "View artifact" to see it in the editor
4. **Edit Document**: Use the rich text editor to edit the generated document
5. **Auto-save**: Changes are automatically saved to the backend

## Mock AI

The current implementation uses a mock AI function (`convex/ai.ts`) that generates placeholder artifacts. To implement actual AI functionality:

1. Replace the `generateArtifact` function in `convex/ai.ts`
2. Integrate with your preferred AI service (OpenAI, Anthropic, etc.)
3. Update the artifact generation logic to use real AI responses

## Development

- Type checking: `bunx tsc --noEmit --project tsconfig.app.json`
- Linting: `bunx eslint .`
- Formatting: `bunx prettier --write .`

## Notes

- The Convex API types are auto-generated. Run `bunx convex dev` to regenerate them after adding new functions.
- The app uses a default user for now. User authentication can be added later.

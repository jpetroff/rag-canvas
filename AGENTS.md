# AGENTS.md

### Do
- use shadcn with baseUI for React UI components and frontend
- use Zustand package for global app state management
- use Tailwind for styling
- default to small components
- always use bun package manager to check or install dependencies
- always check Context7 MCP for up-to-date knowledge about libraries and packages used in this project
- always check Convex MCP for any backend logic

### Don't
- do not hard code colors
- do not use divs if we have a component already
- do not add new heavy dependencies without approval

### Commands
# file scoped checks preferred
bunx tsc --noEmit path/to/file.tsx
bunx prettier --write path/to/file.tsx
bunx eslint --fix path/to/file.tsx
# full build when explicitly requested
bun run build
# to run a dev server with vite and bun
bun run dev

### Safety and permissions

Allowed without prompt:
- read files, list files
- tsc single file, prettier, eslint,
- vitest single test
- creating a folder for components, pages, fragments inside ./src 

Ask first: 
- package installs,
- git push
- deleting files, chmod
- running full build or end to end suites

### Project structure
- ./src contains all source code of the project
- ./convex contains Convex server functions
- ./convex/schema.ts contains backend information about database tables and it's schema to store user data
- ./src/components should contain all shadcn + baseUI components
- ./src/fragments should contain higher level components, widgets or mini-apps that are composed of basic components from shadcn + baseUI
- ./src/pages should contain React router pages for this single-page application
- ./src/utils should contain any reusable helper functions

### Good and bad examples
- avoid class based components like `Admin.tsx`
- use functional components with hooks like `Projects.tsx`

### When stuck
- ask a clarifying question, propose a short plan, or open a draft PR with notes

### Design system
- use shadcn with baseUI for any frontend component
- use tailwind to change component styles only if required styles are not provided by default
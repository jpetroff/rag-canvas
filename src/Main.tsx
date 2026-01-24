import '@/index.css'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { convex } from '@/utils/convex'
import { CanvasPage } from '@/pages/CanvasPage'
import { useCanvasStore } from '@/store/canvasStore'

function App() {
  const { userId, isLoadingUser, initialize, initializeUser } = useCanvasStore()

  useEffect(() => {
    // Initialize store with Convex client
    initialize(convex)

    // Initialize user
    initializeUser('default').catch(console.error)
  }, [initialize, initializeUser])

  if (isLoadingUser || !userId) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-zinc-500'>Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path='/' element={<CanvasPage />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>
)

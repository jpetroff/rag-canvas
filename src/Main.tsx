import '@/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { convex } from '@/utils/convex'
import { CanvasPage } from '@/pages/CanvasPage'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

function App() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const createUser = useMutation(api.users.create);
  const getUser = useQuery(api.users.getByUsername, { username: "default" });

  useEffect(() => {
    // Initialize user - create if doesn't exist
    const initUser = async () => {
      if (getUser) {
        setUserId(getUser._id);
      } else {
        // Create default user
        const newUserId = await createUser({
          username: "default",
          name: "Default User",
        });
        setUserId(newUserId);
      }
    };

    initUser();
  }, [getUser, createUser]);

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<CanvasPage userId={userId} />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>,
)

import { useEffect } from 'react'
import { ChatSidebar } from '@/fragments/ChatSidebar'
import { RichTextEditor } from '@/fragments/RichTextEditor'
import { useCanvasStore } from '@/store/canvasStore'
import { Button } from '@/components/Button'
import { Plus } from 'lucide-react'

export function CanvasPage() {
  const {
    userId,
    currentArtifact,
    currentChatId,
    chats,
    loadChats,
    createNewChat,
    updateArtifactContent,
  } = useCanvasStore()

  // Load chats when component mounts
  useEffect(() => {
    if (userId) {
      loadChats(userId).catch(console.error)
    }
  }, [userId, loadChats])

  // Create initial chat if none exist
  useEffect(() => {
    if (userId && chats.length === 0 && !currentChatId) {
      createNewChat(userId, 'New Chat').catch(console.error)
    }
  }, [userId, chats.length, currentChatId, createNewChat])

  const handleNewChat = async () => {
    if (!userId) return
    try {
      await createNewChat(userId, 'New Chat')
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const handleEditorChange = async (content: string) => {
    if (currentArtifact) {
      try {
        await updateArtifactContent(currentArtifact._id, content)
      } catch (error) {
        console.error('Error updating artifact:', error)
      }
    }
  }

  return (
    <div className='flex h-screen w-screen overflow-hidden'>
      <ChatSidebar />
      <div className='flex-1 flex flex-col'>
        <div className='h-12 border-b border-zinc-200 bg-white flex items-center justify-between px-4'>
          <h1 className='text-lg font-semibold'>
            {currentArtifact?.title || 'AI Canvas'}
          </h1>
          <Button variant='ghost' size='sm' onClick={handleNewChat}>
            <Plus className='h-4 w-4 mr-2' />
            New Chat
          </Button>
        </div>
        <div className='flex-1 p-4 overflow-hidden'>
          {currentArtifact ? (
            <RichTextEditor
              content={currentArtifact.content}
              onChange={handleEditorChange}
              editable={true}
            />
          ) : (
            <div className='h-full flex items-center justify-center text-zinc-500'>
              <div className='text-center'>
                <p className='text-lg mb-2'>No document selected</p>
                <p className='text-sm'>
                  Start a conversation in the chat to create a document
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

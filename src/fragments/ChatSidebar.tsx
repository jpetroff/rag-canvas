import { useState, useRef, useEffect } from 'react'
import type { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Card, CardContent } from '@/components/Card'
import { useCanvasStore } from '@/store/canvasStore'
import { Send, Pencil, Check, X } from 'lucide-react'

export function ChatSidebar() {
  const [input, setInput] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    currentChatId,
    currentChat,
    messages,
    chats,
    isSendingMessage,
    sendMessage,
    switchChat,
    updateChatTitle,
    loadArtifact,
  } = useCanvasStore()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleLoadArtifact = async (artifactId: Id<'artifacts'>) => {
    try {
      await loadArtifact(artifactId)
    } catch (error) {
      console.error('Error loading artifact:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !currentChatId || isSendingMessage) return

    const userMessageContent = input.trim()
    setInput('')

    try {
      await sendMessage(currentChatId, userMessageContent)
    } catch (error) {
      console.error('Error sending message:', error)
      // Restore input on error
      setInput(userMessageContent)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedChatId = e.target.value as Id<'chats'>
    if (selectedChatId) {
      switchChat(selectedChatId)
    }
  }

  const handleStartEditTitle = () => {
    if (currentChat) {
      setEditedTitle(currentChat.title)
      setIsEditingTitle(true)
    }
  }

  const handleSaveTitle = async () => {
    if (!currentChatId || !editedTitle.trim()) return

    try {
      await updateChatTitle(currentChatId, editedTitle.trim())
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Error updating chat title:', error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingTitle(false)
    setEditedTitle('')
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  return (
    <div className='flex flex-col h-full w-80 border-r border-zinc-200 bg-zinc-50'>
      <div className='p-4 border-b border-zinc-200 bg-white'>
        {isEditingTitle ? (
          <div className='flex gap-2 items-center'>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder='Chat title...'
              className='flex-1'
              autoFocus
            />
            <Button
              onClick={handleSaveTitle}
              disabled={!editedTitle.trim()}
              size='sm'
              className='px-2'
            >
              <Check className='h-4 w-4' />
            </Button>
            <Button
              onClick={handleCancelEdit}
              size='sm'
              variant='outline'
              className='px-2'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        ) : (
          <div className='flex gap-2 items-center'>
            <Select
              value={currentChatId || ''}
              onChange={handleChatChange}
              disabled={chats.length === 0}
              className='flex-1'
            >
              {!currentChatId && <option value=''>Select a chat</option>}
              {chats.map((chat) => (
                <option key={chat._id} value={chat._id}>
                  {chat.title}
                </option>
              ))}
            </Select>
            <Button
              onClick={handleStartEditTitle}
              disabled={!currentChatId}
              size='sm'
              variant='outline'
              className='px-2'
            >
              <Pencil className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.length === 0 ? (
          <div className='text-center text-zinc-500 mt-8'>
            <p>Start a conversation to create documents with AI</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.metadata?.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`max-w-[80%] ${message.metadata?.role === 'user' ? 'bg-indigo-50' : ''}`}
              >
                <CardContent className='p-3'>
                  <p className='text-sm whitespace-pre-wrap'>
                    {message.content}
                  </p>
                  {message.has_artifact && (
                    <button
                      onClick={() => handleLoadArtifact(message.has_artifact!)}
                      className='mt-2 text-xs text-indigo-600 hover:text-indigo-800 underline'
                    >
                      ✓ View artifact
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className='p-4 border-t border-zinc-200 bg-white'>
        <div className='flex gap-2'>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type your message...'
            disabled={!currentChatId || isSendingMessage}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !currentChatId || isSendingMessage}
            size='sm'
          >
            <Send className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}

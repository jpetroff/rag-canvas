import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card, CardContent } from "@/components/Card";
import { useCanvasStore } from "@/store/canvasStore";
import { Send } from "lucide-react";

interface ChatSidebarProps {
  chatId: Id<"chats"> | null;
  userId: Id<"users">;
}

export function ChatSidebar({ chatId, userId }: ChatSidebarProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, setMessages, addMessage, setCurrentArtifact } = useCanvasStore();
  
  const generateArtifact = useMutation(api.ai.generateArtifact);
  const createMessage = useMutation(api.messages.create);
  const messagesQuery = useQuery(
    api.messages.listByChat,
    chatId ? { chatId } : "skip"
  );
  
  const handleLoadArtifact = (artifactId: Id<"artifacts">) => {
    // Load artifact using query - we'll use a separate query hook
    // For now, we'll trigger a store action that CanvasPage will handle
    setCurrentArtifact(artifactId, null);
  };

  // Sync messages from query
  useEffect(() => {
    if (messagesQuery) {
      setMessages(messagesQuery);
    }
  }, [messagesQuery, setMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatId) return;

    const userMessageContent = input.trim();
    setInput("");

    // Create user message
    const userMessageId = await createMessage({
      content: userMessageContent,
      chatId,
      metadata: { role: "user" },
    });

    // Add user message to store (optimistic update)
    addMessage({
      _id: userMessageId,
      content: userMessageContent,
      has_artifact: null,
      metadata: { role: "user" },
      from_chat: chatId,
      _creationTime: Date.now(),
    } as any);

    // Generate artifact (mock AI response)
    try {
      const result = await generateArtifact({
        userMessage: userMessageContent,
        chatId,
      });

      // The generateArtifact function creates the assistant message and artifact
      // We need to refetch messages to get the updated list
      // For now, we'll add the assistant message optimistically
      if (result) {
        addMessage({
          _id: result.messageId,
          content: result.content,
          has_artifact: result.artifactId,
          metadata: { role: "assistant" },
          from_chat: chatId,
          _creationTime: Date.now(),
        } as any);

        // Set the artifact as current
        setCurrentArtifact(result.artifactId, {
          _id: result.artifactId,
          title: result.artifact.title,
          content: result.artifact.content,
          from_message: result.messageId,
          from_chat: chatId,
          _creationTime: Date.now(),
        } as any);
      }
    } catch (error) {
      console.error("Error generating artifact:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-80 border-r border-zinc-200 bg-zinc-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 mt-8">
            <p>Start a conversation to create documents with AI</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.metadata?.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card className={`max-w-[80%] ${message.metadata?.role === "user" ? "bg-indigo-50" : ""}`}>
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.has_artifact && (
                    <button
                      onClick={() => handleLoadArtifact(message.has_artifact!)}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 underline"
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
      <div className="p-4 border-t border-zinc-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={!chatId}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !chatId}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

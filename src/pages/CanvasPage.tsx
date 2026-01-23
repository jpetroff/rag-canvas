import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ChatSidebar } from "@/fragments/ChatSidebar";
import { RichTextEditor } from "@/fragments/RichTextEditor";
import { useCanvasStore } from "@/store/canvasStore";
import { Button } from "@/components/Button";
import { Plus } from "lucide-react";

interface CanvasPageProps {
  userId: Id<"users">;
}

export function CanvasPage({ userId }: CanvasPageProps) {
  const {
    currentChatId,
    currentArtifactId,
    currentArtifact,
    updateArtifactContent,
    setCurrentChat,
    setCurrentChatData,
    setCurrentArtifact,
  } = useCanvasStore();

  const createChat = useMutation(api.chats.create);
  const chatsQuery = useQuery(api.chats.list, { userId });
  const updateArtifact = useMutation(api.artifacts.update);
  const artifactQuery = useQuery(
    api.artifacts.get,
    currentArtifactId ? { artifactId: currentArtifactId } : "skip"
  );

  // Load artifact when artifactId changes
  useEffect(() => {
    if (artifactQuery && currentArtifactId) {
      setCurrentArtifact(currentArtifactId, artifactQuery as any);
    }
  }, [artifactQuery, currentArtifactId, setCurrentArtifact]);

  // Initialize with first chat or create one
  useEffect(() => {
    if (chatsQuery && chatsQuery.length > 0 && !currentChatId) {
      const firstChat = chatsQuery[0];
      setCurrentChat(firstChat._id);
      setCurrentChatData(firstChat);
    } else if (chatsQuery && chatsQuery.length === 0 && !currentChatId) {
      // Create a new chat if none exist
      handleNewChat();
    }
  }, [chatsQuery, currentChatId, setCurrentChat, setCurrentChatData]);

  const handleNewChat = async () => {
    const chatId = await createChat({
      title: "New Chat",
      userId,
    });
    setCurrentChat(chatId);
    // The chat will be added to the list via the query
  };

  const handleEditorChange = async (content: string) => {
    if (currentArtifact) {
      updateArtifactContent(content);
      // Save to backend
      await updateArtifact({
        artifactId: currentArtifact._id,
        content,
      });
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <ChatSidebar chatId={currentChatId} userId={userId} />
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-zinc-200 bg-white flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">
            {currentArtifact?.title || "AI Canvas"}
          </h1>
          <Button variant="ghost" size="sm" onClick={handleNewChat}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 p-4 overflow-hidden">
          {currentArtifact ? (
            <RichTextEditor
              content={currentArtifact.content}
              onChange={handleEditorChange}
              editable={true}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <p className="text-lg mb-2">No document selected</p>
                <p className="text-sm">
                  Start a conversation in the chat to create a document
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

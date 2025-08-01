import Chat from "../components/Chat";
import ChatSidebar from "../components/ChatSidebar";
import ChatHeader from "../components/ChatHeader";
import { useState } from "react";

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  return (
    <div className="flex flex-col h-screen w-screen">
      <ChatHeader toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className="flex flex-1 bg-black min-h-0">
        <ChatSidebar isSidebarOpen={isSidebarOpen} chats={chats} setChats={setChats} />
        <Chat setChats={setChats} />
      </main>
    </div>
  );
}

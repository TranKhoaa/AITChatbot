import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NewChatNameModal = ({ chat, onClose, onRename }) => {
const [newName, setNewName] = useState(chat.name || "");

  const fetchChats = async () => {
    try {
      const res = await axiosInstance.get("/user/chat/");
      const sortedChats = [...res.data].sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      );
      setChats(sortedChats); // Chat mới nhất nằm trên đầu
    } catch (err) {
      console.error("Error when getting chat list:", err);
    }
  };

  const handleRenameChat = async (chat_id, newName) => {
    try {
      const res = await axiosInstance.put(`/user/chat/`, { id: chat_id, new_name: newName });
      if (res.request.status === 200) {
        toast.success("Chat renamed successfully!");
        // fetchChats();
      } else {
        toast.error("Cannot rename chat!");
      }
    } catch (error) {
      console.error("Rename failed", error);
    }
  };
  return (
    <div className="bg-gray-800 top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed z-50 flex flex-col p-6 rounded-lg shadow-lg w-96 h-50 justify-center">
      <h2 className="text-xl font-semibold mb-4 top-4">Rename Chat</h2>
      <form>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Chat name..."
          className="w-full p-2 mb-4 rounded bg-gray-700 text-white outline-none autoFocus"
        />
        <div className="flex justify-end mt-4 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
            onClick={() => handleRenameChat(chat.id, newName)}
          >
            Rename
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewChatNameModal;

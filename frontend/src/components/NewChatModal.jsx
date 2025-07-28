import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from "react-router-dom";
import { useEffect } from 'react';


const NewChatModal = ({ onClose, setChats }) => {
  const [chatName, setChatName] = useState('');
  const navigate = useNavigate()
  const createNewChat = async (name) => {
    try {
      const res = await axiosInstance.post("user/chat/create", { name });
      if (res.status === 200 || res.status === 201) {
        const newChat = res.data;
        setChats((prev) => [{ id: newChat.chat_id, name: newChat.name }, ...prev]);
        navigate(`/chat/${newChat.chat_id}`);
        onClose();
      }
    } catch (err) {
      console.error("Error creating chat:", err);
      alert("Cannot create new chat.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatName.trim()) return;
    createNewChat(chatName.trim());
  };

  return (

    <div className="bg-gray-800 top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed z-50 flex flex-col p-6 rounded-lg shadow-lg w-96 h-50 justify-center">
      <h2 className="text-xl font-semibold mb-4 top-4">Create New Chat</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={chatName}
          onChange={(e) => setChatName(e.target.value)}
          placeholder="Chat name..."
          className="w-full p-2 mb-4 rounded bg-gray-700 text-white outline-none autoFocus"
        />
        <div className="flex justify-end mt-4 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
          >
            Create
          </button>
        </div>
      </form>
    </div>

  );
};

export default NewChatModal;

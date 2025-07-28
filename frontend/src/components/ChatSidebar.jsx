import { FaPlus } from 'react-icons/fa6';
import { IoMdSettings } from 'react-icons/io';
import { FiLogOut, FiMoreHorizontal } from 'react-icons/fi';
import { AiOutlineHistory, AiOutlineSearch } from 'react-icons/ai';
import { HiOutlineDocumentText } from 'react-icons/hi';
import "../App.css"
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import axiosInstance from "../api/axiosInstance";
import React, { useState, useEffect } from "react";
import NewChatModal from './NewChatModal';
import SettingsModal from './Settings';


const ChatSidebar = ({ isSidebarOpen }) => {
    const [chats, setChats] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeMenuChatId, setActiveMenuChatId] = useState(null);

    const handleRenameChat = async (chat_id, newName) => {
        try {
            await axiosInstance.put(`/user/chat/${chat_id}`, { name: newName });
            setChats((prev) =>
                prev.map((chat) => (chat.chat_id === chat_id ? { ...chat, name: newName } : chat))
            );
        } catch (error) {
            console.error("Rename failed", error);
        }
    };

    const handleDeleteChat = async (chat_id) => {
        const confirm = window.confirm("Are you sure you want to delete this chat?");
        if (!confirm) return;

        try {
            await axiosInstance.delete(`/user/chat/${chat_id}`);
            setChats((prev) => prev.filter((chat) => chat.chat_id !== chat_id));
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    useEffect(() => {
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

        fetchChats();
    }, []);

    const dispatch = useDispatch();
    const handleSignOut = () => {
        dispatch(logout());
        navigate("/login");
    };
    const navigate = useNavigate()
    return (
        <div className={`flex flex-col transition-transform ease-in-out duration-400 ${isSidebarOpen ? "w-fit" : "w-0"}`}>
            <div className="mx-auto w-fit min-w-64">
                {isModalOpen && (
                    <NewChatModal
                        onClose={() => setIsModalOpen(false)}
                        setChats={setChats}
                    />
                )}
                {isSettingsOpen && (
                    <SettingsModal onClose={() => setIsSettingsOpen(false)} />
                )}
                {/* Sidebar */}
                <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-black text-white sm:translate-x-0">
                    {/* Search Bar */}
                    <div className="p-3 mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-gray-800 text-white rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="Search..."
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <AiOutlineSearch className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <nav className="mt-3 px-3">
                        {/* Main Navigation */}
                        <div className="space-y-4">
                            {/* New chat */}
                            <button
                                className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-white text-black group transition-all duration-200 hover:bg-gray-400 w-full"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <FaPlus className="h-4 w-4 mr-3" />New chat
                            </button>
                            {/* History */}
                            <div className="space-y-1">
                                <a
                                    className="flex items-center px-4 text-sm font-medium rounded-l text-white group transition-all duration-200 w-full"
                                >
                                    <AiOutlineHistory className="h-5 w-5 mr-3" />
                                    History
                                </a>
                                <div>
                                    <a
                                        className="flex mt-4 items-center px-4 text-sm font-medium rounded-l text-white group transition-all duration-200 w-full"
                                    >
                                        Today
                                    </a>
                                    <div className="flex-1 h-150 overflow-x-hidden overflow-y-auto custom-scrollbar pb-24 justify-center">
                                        {/* Chat History */}
                                        {chats.map((chat) => (
                                            <div key={chat.chat_id} className="group relative flex items-center justify-between px-4 top-3 py-2 hover:bg-gray-800 rounded">
                                                <button
                                                    className="text-sm font-medium text-left text-gray-400 hover:text-white w-full pr-8 custom-scrollbar"
                                                    onClick={() => navigate(`/chat/${chat.id}`)}
                                                >
                                                    {chat.name || "Unnamed Chat"}
                                                </button>

                                                <div className="relative">
                                                    <button
                                                        onClick={() =>
                                                            setActiveMenuChatId((prev) => (prev === chat.id ? null : chat.id))
                                                        }
                                                        className="text-gray-400 mt-1 hover:text-white focus:outline-none"
                                                    >
                                                        <FiMoreHorizontal />
                                                    </button>

                                                    {activeMenuChatId === chat.id && (
                                                        <div className="absolute right-0 mt-1 w-32 bg-gray-800 text-white rounded shadow z-10">
                                                            <button
                                                                className="block w-full text-left px-4 py-2 hover:bg-gray-900"
                                                                onClick={() => {
                                                                    const newName = prompt("Enter new chat name:", chat.name);
                                                                    if (newName) handleRenameChat(chat.chat_id, newName);
                                                                    setActiveMenuChatId(null);
                                                                }}
                                                            >
                                                                Rename
                                                            </button>
                                                            <button
                                                                className="block w-full text-left px-4 py-2 hover:bg-gray-900"
                                                                onClick={() => {
                                                                    handleDeleteChat(chat.id);
                                                                    setActiveMenuChatId(null);
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </nav>
                    {/* User Profile */}
                    <div className="fixed bottom-0 flex flex-col gap-y-2 mb-4">
                        <div className="w-64 h-10">
                            <div className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white group transition-all duration-200 bottom-2">
                                <button className="flex items-center px-4 py-2.5 text-sm font-medium text-white duration-200"
                                    onClick={handleSignOut}>
                                    <FiLogOut className="h-5 w-5 mr-3" />Sign out
                                </button>
                            </div>
                        </div>

                        <div className="w-64 h-10">
                            <div className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white group transition-all duration-200 bottom-2">
                                <button
                                    className="flex items-center px-4 py-2.5 text-sm font-medium text-white duration-200"
                                    onClick={() => setIsSettingsOpen(true)}
                                >
                                    <IoMdSettings className="h-5 w-5 mr-3"></IoMdSettings>Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );

};
export default ChatSidebar;

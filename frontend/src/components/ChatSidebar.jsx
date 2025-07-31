import { FaPlus } from "react-icons/fa6";
import { IoMdSettings } from "react-icons/io";
import { FiLogOut, FiMoreHorizontal } from "react-icons/fi";
import { AiOutlineHistory, AiOutlineSearch } from "react-icons/ai";
import { HiOutlineDocumentText } from "react-icons/hi";
import "../App.css";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { logoutUser } from "../features/auth/authAPI";
import axiosInstance from "../api/axiosInstance";
import React, { useState, useEffect } from "react";
import NewChatModal from "./NewChatModal";
import NewChatNameModal from "./NewChaTNameModal";
import SettingsModal from "./Settings";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";

const ChatSidebar = ({ isSidebarOpen }) => {
    const [chats, setChats] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeMenuChatId, setActiveMenuChatId] = useState(null);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [chatToRename, setChatToRename] = useState(null); // lưu thông tin chat đang rename
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    useEffect(() => {
        fetchChats();
    }, []);

    const handleDeleteChat = async (chat_id) => {
        const confirm = window.confirm(
            "Are you sure you want to delete this chat?"
        );
        if (!confirm) return;

        try {
            const res = await axiosInstance.delete(`/user/chat/${chat_id}`);
            console.log(res);
            if (res.request.status === 200 || res.request.status === 204) {
                setChats((prev) => prev.filter((chat) => chat.chat_id !== chat_id));
                toast.success("Chat deleted successfully!");
                fetchChats();
            } else {
                toast.error("Cannot delete chat!");
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        if (isLoggingOut) return; // Prevent multiple clicks
        
        setIsLoggingOut(true);
        try {
            // Call backend logout API to blacklist tokens
            await logoutUser();
            // console.log("Successfully logged out from backend");
            
            // Clear local state
            dispatch(logout());
            
            // Navigate to login page
            navigate("/login");
            
            // toast.success("Logged out successfully");
        } catch (error) {
            console.error("Logout error:", error);
            // Even if backend call fails, still clear local state for security
            dispatch(logout());
            navigate("/login");
            toast.warning("Logged out locally (server logout may have failed)");
        } finally {
            setIsLoggingOut(false);
        }
    };
    const navigate = useNavigate();

    return (
        <div
            className={`h-full transition-transform ease-in-out duration-400 ${isSidebarOpen ? "w-fit" : "w-0"
                }`}
        >
            <div className="mx-auto flex h-full w-fit min-w-64">
                {isModalOpen && (
                    <NewChatModal
                        onClose={() => setIsModalOpen(false)}
                        setChats={setChats}
                    />
                )}
                {isSettingsOpen && (
                    <SettingsModal onClose={() => setIsSettingsOpen(false)} />
                )}
                {isRenameModalOpen && chatToRename && (
                    <NewChatNameModal
                        chat={chatToRename}
                        onClose={() => setIsRenameModalOpen(false)}
                        onRename={(chat_id, newName) => {
                            handleRenameChat(chat_id, newName);
                            setIsRenameModalOpen(false);
                        }}
                    />
                )}
                {/* Sidebar */}
                <aside className="flex flex-col h-full space-y-4 w-64 bg-black text-white sm:translate-x-0">
                    {/* Search Bar */}
                    <div className="px-3 pt-3">
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
                    {/* New chat */}
                    <div className="px-3">
                        <button
                            className="cursor-pointer flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-white text-black group transition-all duration-200 hover:bg-gray-400 w-full"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <FaPlus className="h-4 w-4 mr-3" />
                            New chat
                        </button>
                    </div>

                    {/* History */}
                    <div className="flex items-center px-5 text-sm font-medium rounded-l text-white group transition-all duration-200 w-full">
                        <AiOutlineHistory className="h-5 w-5 mr-3" />
                        History
                    </div>
                    {/* Today */}
                    <p className="px-5 text-sm font-medium rounded-l text-white group transition-all duration-200 w-full">
                        Today
                    </p>
                    {/* Chat list */}
                    <div className="flex-1 flex flex-col px-3 overflow-x-hidden overflow-y-auto custom-scrollbar">
                        {chats.map((chat) => (
                            <div
                                key={chat.chat_id}
                                className="cursor-pointer flex items-center justify-between px-4 top-3 py-2 hover:bg-gray-800 rounded group hover:bg-gray-400 w-full"
                            >
                                <button
                                    className="cursor-pointer truncate max-w-[250px] whitespace-nowrap overflow-hidden text-sm group-hover:text-white font-medium text-left text-gray-400 w-full pr-8 custom-scrollbar"
                                    onClick={() => navigate(`/chat/${chat.id}`)}
                                    title={chat.name || "Unnamed Chat"}
                                >
                                    {chat.name || "Unnamed Chat"}
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setActiveMenuChatId((prev) =>
                                                prev === chat.id ? null : chat.id
                                            )
                                        }
                                        className="cursor-pointer hover:text-white text-gray-400 mt-1 focus:outline-none"
                                    >
                                        <FiMoreHorizontal />
                                    </button>

                                    {activeMenuChatId === chat.id && (
                                        <div className="absolute right-0 mt-1 w-32 bg-gray-800 text-white rounded shadow z-10">
                                            <button
                                                className="border-b border-slate-700 block w-full text-left px-4 py-2 hover:bg-gray-900"
                                                onClick={() => {
                                                    setIsRenameModalOpen(true);
                                                    setChatToRename(chat);
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
                    {/* Sign out, Settings */}
                    <div className="flex flex-col gap-y-4 mb-4">
                        <div className="w-64 h-10">
                            <div className="flex items-center px-4 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white group transition-all duration-200 bottom-2">

                                <button
                                    className="cursor-pointer flex items-center px-4 py-4 w-full text-sm font-medium text-white duration-200"
                                    onClick={handleSignOut}
                                >
                                    <FiLogOut className="h-5 w-5 mr-3" />
                                    Sign out
                                </button>
                            </div>
                        </div>

                        <div className="w-64 h-10">
                            <div className="flex items-center px-4 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white group transition-all duration-200 bottom-2">
                                <button
                                    className="cursor-pointer flex items-center px-4 py-4 w-full text-sm font-medium text-white duration-200"
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

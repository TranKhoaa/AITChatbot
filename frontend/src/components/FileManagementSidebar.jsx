import { FaPlus } from 'react-icons/fa6';
import { IoMdSettings } from 'react-icons/io';
import { FiLogOut } from 'react-icons/fi';
import { AiOutlineHistory, AiOutlineSearch } from 'react-icons/ai';
import { HiOutlineDocumentText } from 'react-icons/hi';
import "../App.css"
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { logoutUser } from "../features/auth/authAPI";
import { useState } from "react";

const FileManagementSidebar = ({ isSidebarOpen, onOpenSettings, onOpenUpload }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleSignOut = async () => {
        if (isLoggingOut) return; // Prevent multiple clicks
        
        setIsLoggingOut(true);
        try {
            // Call backend logout API to blacklist tokens
            await logoutUser();
            console.log("Successfully logged out from backend");
            
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
            // toast.warning("Logged out locally (server logout may have failed)");
        } finally {
            setIsLoggingOut(false);
        }
    };
    return (
        <div className={`flex transition-transform ease-in-out duration-400 ${isSidebarOpen ? "w-fit" : "w-0"}`}>
            <div className="mx-auto w-fit min-w-64">
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
                                onClick={onOpenUpload}
                                className="cursor-pointer flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-white text-black group transition-all duration-200 hover:bg-gray-400 w-full"
                            >
                                <FaPlus className="h-4 w-4 mr-3" />Upload files
                            </button>
                        </div>
                    </nav>
                    {/* Sign out, Settings */}
                    <div className="fixed bottom-0 flex flex-col gap-y-4 mb-4">
                        <div className="w-64 h-10">
                            <div className="flex items-center px-4 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white group transition-all duration-200 bottom-2">
                                <button 
                                    className={`cursor-pointer flex items-center px-4 py-4 text-sm font-medium text-white duration-200 ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleSignOut}
                                    disabled={isLoggingOut}
                                >
                                    <FiLogOut className="h-5 w-5 mr-3" />
                                    {"Sign out"}
                                </button>
                            </div>
                        </div>

                        <div className="w-64 h-10">
                            <div className="flex items-center px-4 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white group transition-all duration-200 bottom-2">
                                <button
                                    className="cursor-pointer flex items-center px-4 py-4 text-sm font-medium text-white duration-200"
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
export default FileManagementSidebar;

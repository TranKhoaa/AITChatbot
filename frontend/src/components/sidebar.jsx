import { FaPlus } from 'react-icons/fa6';
import { IoMdSettings } from 'react-icons/io';
import { FiLogOut } from 'react-icons/fi';
import { AiOutlineHistory, AiOutlineSearch } from 'react-icons/ai';
import { HiOutlineDocumentText } from 'react-icons/hi';
const Sidebar = ({ isSidebarOpen }) => {
  return (
    <div className={`flex transition-transform ease-in-out duration-400 ${isSidebarOpen ? "w-90" : "w-0"}`}>
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
            <a
            href="#"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg bg-white text-black group transition-all duration-200 hover:bg-gray-400 w-full"
            >
                <FaPlus className="h-4 w-4 mr-3" />New chat
            </a>
            {/* Documents */}
            <a
            href="#"
            className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-white hover:bg-gray-700 hover:text-white group transition-all duration-200"
            >
            <HiOutlineDocumentText className="h-5 w-5 mr-3" />
            File Management
            </a>
            {/* History */}
            <div className="space-y-1">
                <a
                    className="flex items-center px-4 text-sm font-medium rounded-l text-white group transition-all duration-200 w-full"
                >
                    <AiOutlineHistory className="h-5 w-5 mr-3"/>
                    History
                </a>
                <div>
                    <a
                        className="flex mt-4 items-center px-4 text-sm font-medium rounded-l text-white group transition-all duration-200 w-full"
                    >
                        Today
                    </a>
                    <button
                        className="flex mt-4 items-center px-4 text-sm font-medium rounded-l text-gray-400 transition-all duration-200 w-full hover:text-white"
                    >
                        chat 1 grrrr
                    </button>
                    <button
                        className="flex mt-4 items-center px-4 text-sm font-medium rounded-l text-gray-400 transition-all duration-200 w-full hover:text-white"
                    >
                        chat 1 grrrr
                    </button>
                </div>
            </div>
        </div>
        </nav>
        {/* User Profile */}
        <div className="fixed bottom-0 flex flex-col gap-y-2 mb-4">
            <div className="w-64 h-10">
                <div className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white group transition-all duration-200 bottom-2">
                    <a className="flex items-center px-4 py-2.5 text-sm font-medium text-white duration-200">
                    <FiLogOut className="h-5 w-5 mr-3"/>Sign out
                    </a>
                </div>
            </div>

            <div className="w-64 h-10">
                <div className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white group transition-all duration-200 bottom-2">
                    <a className="flex items-center px-4 py-2.5 text-sm font-medium text-white duration-200">
                    <IoMdSettings className="h-5 w-5 mr-3"></IoMdSettings>Settings
                    </a>
                </div>
            </div>
        </div>
    </aside>
    </div>
    );
};
export default Sidebar;

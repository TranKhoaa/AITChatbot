import { FiMenu } from 'react-icons/fi';
import { useSelector } from 'react-redux';

const ChatHeader = ({ toggleSidebar }) => {
  const user = useSelector((state) => state.auth.user);
  return (
    <header className="bg-black text-white w-screen justify-between">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex fixed p-4 left-3 items-center justify-start space-x-1">
            <button
              className="cursor-w-resize text-2xl font-bold hover:text-gray-400"
              onClick={toggleSidebar}
            >
              <FiMenu />
            </button>
            <span className="ml-4 text-xl font-semibold">AITChatbot</span>
          </div>
          <div className="p-4 hidden md:flex md:items-center md:space-x-4 fixed right-3">
            <a href="#" className=" hover:text-gray-400">{user.name}</a>
          </div>
        </div>
      </div>
    </header>
  );
};
export default ChatHeader;
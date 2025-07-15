import { FiMenu } from 'react-icons/fi';
const Header = ({toggleSidebar})=> {
  return (
    <header className="bg-black text-white w-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center justify-start space-x-1">
            <button 
            className="text-2xl font-bold hover:text-gray-400" 
            onClick={toggleSidebar}
            >
            <FiMenu />
            </button>
            <span className="ml-4 text-xl font-semibold">AITChatbot</span>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-4">
            <a href="#" className=" hover:text-gray-400">About</a>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;
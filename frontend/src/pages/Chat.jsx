import { BsFillSendFill} from 'react-icons/bs';
import { MdContentCopy } from 'react-icons/md';
import { LuRefreshCcw, LuSquarePen } from 'react-icons/lu';

const Chat = () => {
  return (
    <div className="isolate bg-black top-16 w-full h-full">
  {/* Main Container */}
  <div className="flex relative z-10">
    {/* Chat Area */}
    <div className="flex-1 h-[calc(100vh-4rem)] flex flex-col perspective-card justify-center mx-auto max-w-4xl">
      <div className="card-3d flex flex-col h-full">
        {/* Messages Area */}
        <div
          className="flex-1 overflow-x-auto overflow-y-auto p-4 space-y-4 custom-scrollbar pb-24 justify-center"
          id="messagesArea"
        >
          {/* Received Message */}
          <div className="flex items-start space-x-2 message-bubble">
            <div className="max-w-200 md:max-w-100">
              <div className="rounded-2xl rounded-tl-sm p-3 shadow-lg">
                <p className="text-white">
                  Hey Nicole! How's the WhatsApp ssssssddddddddddddddddddddddd fffffffffffffffclone coming along?
                </p>
              </div>
              <p className="flex space-x-2 text-xs mt-1 ml-2"> 
                <button className='hover:text-gray-400  text-white'><MdContentCopy className='h-4 w-4'/>
                </button>
                 <button className='hover:text-gray-400  text-white'>
                 <LuRefreshCcw className='h-4 w-4'/>
                 </button>
              </p>
            </div>
          </div>
          {/* Sent Message */}
          <div className="flex items-end justify-end space-x-2 message-bubble">
            <div className="max-w-xs">
              <div className="chat-gradient bg-gray-700 rounded-2xl rounded-tr-sm p-3 shadow-lg">
                <p className="text-white px-2">
                  It's going great! Just added some cool 3D effects and
                  animations 🚀
                </p>
              </div>
              <p className="flex space-x-2 text-xs mt-1 ml-2 justify-end"> 
                <button className='hover:text-gray-400  text-white'><MdContentCopy className='h-4 w-4'/>
                </button>
                 <button className='hover:text-gray-400  text-white'>
                 <LuSquarePen className='h-4 w-4'/>
                 </button>
              </p>
            </div>
          </div> 
        </div>
        {/* Message Input */}
        <div className="p-4 glass-effect fixed bottom-0 w-120 self-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              id="messageInput"
            />
            <button className="text-white absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-600 rounded-full transition-colors">
              <BsFillSendFill />
            </button>
            <button className="colspan-2 text-white absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-600 rounded-full transition-colors">
              <BsFillSendFill />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    );
};
export default Chat;

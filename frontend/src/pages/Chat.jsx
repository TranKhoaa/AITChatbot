import React, { useState } from 'react';
import { BsFillSendFill} from 'react-icons/bs';
import { MdContentCopy } from 'react-icons/md';
import { LuRefreshCcw, LuSquarePen } from 'react-icons/lu';
import { FaChevronDown } from "react-icons/fa";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "user",
      content: "Hi, how are you?"
    },
    {
      id: 2,
      type: "ai",
      content: "Hello! I understand you're working on a chatbot RAG application for internal company use, split into three modules: frontend, backend, and LLMs, with specific requirements for each. Below, I'll provide detailed requirements and backlogs for each module based on your specifications: a frontend with user and admin interfaces, a backend handling the RAG workflow with PostgreSQL, and an LLM module supporting English and Japanese document processing with Vietnamese responses."
    },
  ]);
      const AI_MODELS = [
    { id: "qwen3", name: "Qwen3" },
    { id: "gpt4", name: "GPT-4"},
    { id: "claude3", name: "Claude 3"},
    { id: "llama2", name: "Llama 2"},
    { id: "mistral", name: "Mistral 7B"}
  ];
  const [selectedModel, setSelectedModel] = useState("qwen3");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const currentModelData = AI_MODELS.find(model => model.id === selectedModel) || AI_MODELS[0];

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);
  };
  const handleCopyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Message copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy message");
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: "user",
        content: message
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          type: "ai",
          content: "Thank you for your message. I'm here to help you with your questions!"
        };
        setMessages(prevMessages => [...prevMessages, aiResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="isolate bg-black top-16 w-full h-full">
      {/* Main Container */}
      <div className="flex relative z-10">
        {/* Chat Area */}
        <div className="flex-1 h-[calc(100vh-4rem)] flex flex-col perspective-card justify-center mx-auto max-w-4xl">
          <div className="card-3d flex flex-col h-full">
            {/* Messages Area */}
            <div
              className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pb-24 justify-center"
              id="messagesArea"
            >
              {/* Chat Messages */}
              <div className="flex-1 p-4 md:p-6">
                <div className="space-y-6 max-w-4xl">
                  {messages.map((msg) => (
                    <div key={msg.id} className={msg.type === "user" ? "flex justify-end" : "space-y-4"}>
                      {msg.type === "user" ? (
                      <div className="flex items-end justify-end space-x-2 message-bubble">
                        {/* User Messages */}
                        <div className="max-w-xs">
                          <div className="chat-gradient bg-gray-700 rounded-2xl rounded-tr-sm p-3 shadow-lg">
                            <p className="text-white px-2 break-words">{msg.content}</p>
                          </div>
                          <p className="flex space-x-2 text-xs mt-3 ml-2 justify-end"> 
                            <button 
                            className='hover:text-gray-400  text-white'
                            onClick={() => handleCopyMessage(msg.content)}
                            >
                              <MdContentCopy className='h-4 w-4'/>
                            </button>
                            <button className='hover:text-gray-400  text-white'>
                            <LuSquarePen className='h-4 w-4'/>
                            </button>
                          </p>
                        </div>
                      </div> 
                      ) : (
                        <>
                      <div className="flex items-start space-x-2 message-bubble">
                        {/* AI Messages */}
                        <div className="sm:max-w-60 lg:max-w-150 md:max-w-100">
                          <div className="rounded-2xl rounded-tl-sm p-0 shadow-lg">
                            <p className="text-white">{msg.content}</p>
                          </div>
                          <p className="flex items-center gap-3 mt-4"> 
                            <button 
                            className='hover:text-gray-400 
                           text-white'
                            onClick={() => handleCopyMessage(msg.content)}
                           ><MdContentCopy className='h-4 w-4'/>
                            </button>
                            <button className='hover:text-gray-400  text-white'>
                            <LuRefreshCcw className='h-4 w-4'/>
                            </button>
                          </p>
                        </div>
                      </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Chat Input */}
              <div className="relative grid-rows-2 grid grid-flow-col w-150 self-center m-4 bg-gray-800 rounded-xl p-4 max-w-4xl items-center">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything..."
                  className="bg-transparent border-none text-white placeholder:text-white/40 focus:ring-hidden outline-none"
                />
                <div className="relative">
                  <div className="items-center gap-2 p-1">
                    <button
                      className="flex items-center gap-1 text-white hover:bg-white/10"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    >
                      {currentModelData.name}
                      <FaChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  {/* Model Dropdown */}
                  {isModelDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-30 h-fit bg-gray-800 border border-white/20 rounded-lg shadow-lg z-20">
                      <div className="py-2">
                        {AI_MODELS.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => handleModelSelect(model.id)}
                            className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors ${
                              selectedModel === model.id ? 'bg-white/5' : ''
                            }`}
                          >
                            <div className="flex flex-col">
                              <a className="text-white font-medium">{model.name}</a>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Send Button */}
                <button
                  className="row-span-2 p-2 absolute top-1/2 right-5 place-self-center justify-end text-white transform -translate-y-1/2 hover:bg-gray-600 rounded-full transition-colors"
                  onClick={handleSendMessage}
                >
                  <BsFillSendFill />
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

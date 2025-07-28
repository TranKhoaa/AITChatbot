import React, { useState, useEffect } from 'react';
import { BsFillSendFill } from 'react-icons/bs';
import { MdContentCopy } from 'react-icons/md';
import { LuRefreshCcw, LuSquarePen } from 'react-icons/lu';
import { FaChevronDown } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../api/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';

const Chat = () => {
  const [message, setMessage] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { chat_id } = useParams();
  const [chatId, setChatId] = useState(chat_id);
  const [editIndex, setEditIndex] = useState(null);       // index của tin nhắn đang chỉnh sửa
  const [editedMessage, setEditedMessage] = useState(""); // nội dung tin nhắn đã chỉnh sửa

  const navigate = useNavigate();

  const createNewChat = async () => {
    try {
      const res = await axiosInstance.post("user/chat/create", { name: "New Chat" });
      const newChatId = res.data.chat_id;
      setChatId(newChatId);
      navigate(`${newChatId}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  // useEffect(() => {
  //   if (!chat_id) {
  //     createNewChat();
  //   } else {
  //     setChatId(chat_id);
  //   }
  // }, [chat_id]);

  useEffect(() => {
    setChatId(chat_id);
  }, [chat_id]);

  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get(`user/chat/${chatId}/history`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error loading history:", err);
      }
    };

    // Optional: delay nhỏ để tránh race condition
    const timeout = setTimeout(() => {
      fetchMessages();
    }, 300);

    return () => clearTimeout(timeout);
  }, [chatId]);


  const AI_MODELS = [
    { id: "qwen3", name: "Qwen3" },
    { id: "gpt4", name: "GPT-4" },
    { id: "claude3", name: "Claude 3" },
    { id: "llama2", name: "Llama 2" },
    { id: "mistral", name: "Mistral 7B" }
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

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      source: "user",
      content: message
    };

    const loadingMessage = {
      id: "loading",
      source: "ai",
      content: "Responding..."
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await axiosInstance.post("user/chat/ask", {
        chat_id: chatId, // ban đầu có thể là undefined nếu chưa tạo
        question: message,
      });

      const { answer, chat_id: returnedChatId } = res.data;

      // Nếu chatId chưa có (lần đầu tạo), cập nhật chatId và route
      if (!chatId) {
        setChatId(returnedChatId);
        navigate(`/chat/${returnedChatId}`); // đổi URL
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === "loading"
            ? { id: messages.length + 2, source: "ai", content: answer }
            : msg
        )
      );
    } catch (err) {
      toast.error("Error communicating with server");
      console.error(err);

      // Xoá "loading" nếu lỗi
      setMessages(prev => prev.filter(msg => msg.id !== "loading"));
    } finally {
      setIsLoading(false);
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
      <div className="flex-1 h-[calc(100vh-4rem)] flex flex-col justify-center mx-auto max-w-4xl min-w-100">
        <div className="card-3d flex flex-col h-full">
          <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pb-24 justify-center" id="messagesArea">
            <div className="flex-1 p-4 md:p-6">
              <div className="space-y-6 max-w-4xl">
                {messages.map((msg) => (
                  <div key={msg.id} className={msg.source === "user" ? "flex justify-end" : "space-y-4"}>
                    {msg.source === "user" ? (
                      <div className="flex items-end justify-end space-x-2 message-bubble">
                        <div className="max-w-xs">
                          <div className="chat-gradient bg-gray-700 rounded-2xl rounded-tr-sm p-3 shadow-lg">
                            <p className="text-white px-2 break-words">{msg.content}</p>

                          </div>
                          <p className="flex space-x-2 text-xs mt-3 ml-2 justify-end">
                            <button className='hover:text-gray-400 text-white' onClick={() => handleCopyMessage(msg.content)}>
                              <MdContentCopy className='h-4 w-4' />
                            </button>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-2 message-bubble">
                        <div className="sm:max-w-60 lg:max-w-150 md:max-w-100">
                          <div className="rounded-2xl rounded-tl-sm p-0 shadow-lg">
                            {msg.id === "loading" ? (
                              <span className="italic animate-pulse">Generating answer...</span>
                            ) : (
                              <p className="text-white">{msg.content}</p>
                            )}
                          </div>
                          <p className="flex items-center gap-3 mt-4">
                            <button className='hover:text-gray-400 text-white' onClick={() => handleCopyMessage(msg.content)}>
                              <MdContentCopy className='h-4 w-4' />
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Chat Input */}
          <div className="relative grid-rows-2 grid grid-flow-col w-150 self-center m-4 bg-gray-800 rounded-xl pb-3 pt-5 px-6 max-w-4xl items-center">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything..."
              rows={1}
              style={{ resize: "none", minHeight: "40px", maxHeight: "120px", overflowY: "auto" }}
              className="bg-transparent border-none text-white placeholder:text-white/40 focus:ring-hidden outline-none w-full custom-scrollbar"
            />
            {/* Model Dropdown */}
            <div className="relative flex flex-row space-x-110">
              <div className="items-center gap-2 p-1">
                <button
                  className="flex items-center gap-1 text-white hover:bg-white/10"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                >
                  {currentModelData.name}
                  <FaChevronDown className="w-4 h-4 ml-1" />
                </button>
              </div>
              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-30 h-fit bg-gray-800 border border-white/20 rounded-lg shadow-lg z-20">
                  <div className="py-2">
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors ${selectedModel === model.id ? 'bg-white/5' : ''}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{model.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                className="p-3 justify-end text-white hover:bg-gray-600 rounded-full transition-colors"
                onClick={handleSendMessage}
              >
                <BsFillSendFill className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

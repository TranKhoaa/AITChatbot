import React, { useState, useEffect } from 'react';
import { BsFillSendFill } from 'react-icons/bs';
import { MdContentCopy } from 'react-icons/md';
import { LuRefreshCcw, LuSquarePen } from 'react-icons/lu';
import { FaChevronDown } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../api/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from "react-markdown";

const Chat = () => {
  const [message, setMessage] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { chat_id } = useParams();
  const [chatId, setChatId] = useState(chat_id);
  const [editIndex, setEditIndex] = useState(null);       // index của tin nhắn đang chỉnh sửa
  const [editedMessage, setEditedMessage] = useState(""); // nội dung tin nhắn đã chỉnh sửa

  const navigate = useNavigate();

  // const createNewChat = async () => {
  //   try {
  //     const res = await axiosInstance.post("user/chat/create", { name: "New Chat" });
  //     const newChatId = res.data.chat_id;
  //     setChatId(newChatId);
  //     navigate(`${newChatId}`);
  //   } catch (error) {
  //     console.error("Failed to create chat:", error);
  //   }
  // };

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
        console.log(res.data);
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
    { id: "qwen2:0.5b", name: "Qwen2 (0.5b)" },
    { id: "qwen3:0.6b", name: "Qwen3 (0.6b)" },
    { id: "qwen3", name: "Qwen3" },
    { id: "deepseek-r1", name: "Deepseek R1" },
    { id: "mistral", name: "Mistral" }
  ];
  const AI_MODELS_MAP = {
    "qwen2:0.5b": "Qwen2 (0.5b)",
    "qwen3:0.6b": "Qwen3 (0.6b)",
    "qwen3": "Qwen3",
    "deepseek-r1": "Deepseek R1",
    "mistral": "Mistral"
  };


  const [selectedModel, setSelectedModel] = useState("null");
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
      content: "Responding...",
      model_id: selectedModel || "qwen3 (0.6b)"
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const res = await axiosInstance.post("user/chat/ask", {
        chat_id: chatId, // ban đầu có thể là undefined nếu chưa tạo
        question: message,
        model_id: selectedModel,
      });

      const { answer, chat_id: returnedChatId, model_id } = res.data;
      console.log(res.data);
      console.log(AI_MODELS_MAP[model_id]);

      // Nếu chatId chưa có (lần đầu tạo), cập nhật chatId và route
      if (!chatId) {
        setChatId(returnedChatId);
        navigate(`/chat/${returnedChatId}`); // đổi URL
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === "loading"
            ? {
              id: messages.length + 2,
              source: "ai",
              content: answer,
              model_id: model_id || "qwen3 (0.6b)" // fallback nếu server không trả về
            }
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
                            <div className="text-white px-2 break-words"><ReactMarkdown>{msg.content}</ReactMarkdown></div>

                          </div>
                          <p className="flex space-x-2 text-xs mt-3 ml-2 justify-end">
                            <button className='cursor-pointer hover:text-gray-400 text-white' onClick={() => handleCopyMessage(msg.content)}>
                              <MdContentCopy className='h-4 w-4'
                                title="Copy message" />
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
                              <div className="text-white break-words"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-4 font-bold">
                            <p> {AI_MODELS_MAP[msg.model_id]}</p>
                            <button className='cursor-pointer hover:text-gray-400 text-white' onClick={() => handleCopyMessage(msg.content)}>
                              <MdContentCopy className='h-4 w-4'
                                title="Copy message" />
                            </button>
                          </div>
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
            <div className="relative flex flex-row">
              <div className="items-center gap-2 p-1 group">
                <button
                  className="cursor-pointer flex items-center gap-1 text-white group-hover:text-gray-300"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                >
                  {currentModelData.name}
                  <FaChevronDown className="w-4 h-4 ml-1" />
                </button>
              </div>
              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-40 h-fit bg-gray-800 border border-white/20 rounded-lg shadow-lg z-20">
                  <div className="py-2">
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model.id)}
                        className={`cursor-pointer w-full px-4 py-2 text-left hover:bg-white/10 transition-colors ${selectedModel === model.id ? 'bg-white/5' : ''}`}
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
                className={`p-3 ml-auto rounded-full transition-colors ${isLoading
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "cursor-pointer text-white hover:bg-gray-600"
                  }`}
                onClick={handleSendMessage}
                disabled={isLoading}
                title={isLoading ? "Waiting for response..." : "Send message"}
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

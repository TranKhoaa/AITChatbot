import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AdminPage from "./pages/adminPage";
import Chat from "./pages/Chat";
import ChatSidebar from "./components/ChatSidebar";
import ChatHeader from "./components/ChatHeader";
import Settings from "./components/Settings";
import { useState, useEffect, useRef } from "react";
import { ToastContainer } from "react-toastify";
import { Provider, useSelector } from "react-redux";
import store from "./app/store";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import AdminRoute from "./routes/AdminRoute";
import PrivateRoute from "./routes/PrivateRoute";
import NewChatModal from "./components/NewChatModal";
import { Navigate } from "react-router-dom";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, token } = useSelector((state) => state.auth);
  const wsRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if(user?.role === "admin" && token) {
      const ws = new WebSocket(`ws://localhost:8000/api/v1/admin/file/ws/processing?admin_id=${user.id}`)
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected for admin");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.event === "processing_complete") {
          alert("File processing completed successfully!");
          console.log("Processing result:", message.data);
        } else if (message.event === "processing_error") {
          alert(`File processing failed: ${message.error}`);
          console.error("Processing error:", message.error);
        }
      };

      ws.onerror = (error) => {
        console.warn("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected for admin");
      };

      return () => {
        ws.close();
      };
    }
  }, [user, token]);

  // Role-based redirect logic for '/'
  
  const AuthRedirect = ({ children }) => {
    if (token) {
      if (user?.role === "admin") return <Navigate to="/admin" replace />;
      else if (user?.role === "user") return <Navigate to="/chat" replace />;
      else return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <AuthRedirect>
                <HomePage />
              </AuthRedirect>
            }
          />
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthRedirect>
                <SignUpPage />
              </AuthRedirect>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Chỉ user đăng nhập mới vào được */}
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <div>
                  <ChatHeader toggleSidebar={toggleSidebar} />
                  <main className="flex top-16 h-fit bg-black">
                    <ChatSidebar isSidebarOpen={isSidebarOpen} />
                    <Chat />
                  </main>
                </div>
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:chat_id"
            element={
              <PrivateRoute>
                <div>
                  <ChatHeader toggleSidebar={toggleSidebar} />
                  <main className="flex top-16 h-fit bg-black">
                    <ChatSidebar isSidebarOpen={isSidebarOpen} />
                    <Chat />
                  </main>
                </div>
              </PrivateRoute>
            }
          />

          {/* Chỉ admin mới vào được */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          <Route path="/test" element={<NewChatModal />} />
          <Route path="/settings" element={<Settings />} />
          {/* Catch-all route for non-existent paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </Router>
    </Provider>
  );
};

export default App;

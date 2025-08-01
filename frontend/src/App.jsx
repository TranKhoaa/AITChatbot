import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AdminPage from "./pages/adminPage";
import ChatPage from "./pages/chatPage";
import Settings from "./components/Settings";
import { useState, useEffect, useRef } from "react";
import { ToastContainer } from "react-toastify";
import { Provider, useSelector, useDispatch } from "react-redux";
import store from "./app/store";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import AdminRoute from "./routes/AdminRoute";
import PrivateRoute from "./routes/PrivateRoute";
import NewChatModal from "./components/NewChatModal";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchFiles } from "./features/filesSlice";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, token } = useSelector((state) => state.auth);
  const wsRef = useRef(null);
const dispatch = useDispatch();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (user?.role === "admin" && token) {
      const ws = new WebSocket(`ws://localhost:8000/api/v1/admin/file/ws/processing?admin_id=${user.id}`)
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected for admin");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const toastId = localStorage.getItem("uploadToastId");

        if (message.event === "processing_complete") {
          dispatch(fetchFiles());
          if (toastId) {
            toast.update(toastId, {
              render: "Files has been processed successfully.",
              type: "success",
              isLoading: false,
              autoClose: 3000,
              closeOnClick: true,
            });
            localStorage.removeItem("uploadToastId");
          } else {
            toast.success("File has been processed successfully.");
          }

          console.log("Processing result:", message.data);

        } else if (message.event === "processing_error") {
          if (toastId) {
            toast.update(toastId, {
              render: `Processing failed: ${message.error}`,
              type: "error",
              isLoading: false,
              autoClose: 5000,
              closeOnClick: true,
            });
            localStorage.removeItem("uploadToastId");
          } else {
            toast.error(`Processing error: ${message.error}`);
          }

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
                <ChatPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:chat_id"
            element={
              <PrivateRoute>
                <ChatPage />
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

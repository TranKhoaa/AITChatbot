import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import AdminPage from "./pages/adminPage";
import Chat from "./pages/Chat";
import ChatSidebar from "./components/ChatSidebar";
import ChatHeader from "./components/ChatHeader";
import Settings from "./components/Settings";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";
import store from "./app/store";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import AdminRoute from "./routes/AdminRoute";
import PrivateRoute from "./routes/PrivateRoute";
import NewChatModal from "./components/NewChatModal";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Role-based redirect logic for '/'
  const { user, token } = useSelector((state) => state.auth);
  const AuthRedirect = ({ children }) => {
    if (token) {
      if (user?.role === "admin") return <Navigate to="/admin" replace />;
      return <Navigate to="/chat" replace />;
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

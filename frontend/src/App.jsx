import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import FileManagement from './components/FileManagement';
import AdminPage from './pages/adminPage';
import UploadFiles from './components/UploadFiles';
import Chat from './pages/Chat';
import ChatSidebar from './components/ChatSidebar';
import ChatHeader from './components/ChatHeader';
import Settings from './components/Settings';
import SettingsModal from './components/Settings';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { Provider } from 'react-redux';
import store from './app/store';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminSidebar from './components/AdminSidebar';
import AdminRoute from './routes/AdminRoute';
import PrivateRoute from './routes/PrivateRoute';


const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />


          {/* Chỉ user đăng nhập mới vào được */}
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <div>
                  <ChatHeader toggleSidebar={toggleSidebar} />
                  <main className="flex top-16 h-fit bg-black">
                    <ChatSidebar
                      isSidebarOpen={isSidebarOpen}
                      onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                    {isSettingsOpen && (
                      <SettingsModal onClose={() => setIsSettingsOpen(false)} />
                    )}
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

          <Route path="/test" element={<AdminSidebar />} />
          <Route path="/settings" element={<Settings />} />
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

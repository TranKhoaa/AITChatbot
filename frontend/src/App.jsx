import {BrowserRouter as Router, Routes, Route, BrowserRouter, Link} from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import FileManagement from './components/FileManagement';
import AdminPage from './pages/adminPage';
import UploadFiles from './components/UploadFiles';
import Chat from './pages/Chat';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import Settings from './components/Settings';
import SettingsModal from './components/Settings';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div>
      <Router>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />}/>
          <Route path='/signup' element={<SignUpPage />}/>
          <Route path='/admin/*' element={<AdminPage />}/>

          <Route path='/settings' element={<Settings />}/>

          <Route path="/test" element={
          <nav className="">
              <UploadFiles />
          </nav>} />
        <Route path="/chat" element={
          <nav>
            <div className="">
              <ChatHeader toggleSidebar={toggleSidebar} />
            </div>
              <main className="flex top-16 h-fit bg-black">
                  <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />
                  {isSettingsOpen && (
                    <SettingsModal
                      onClose={() => setIsSettingsOpen(false)}
                    />
                  )}
                  <Chat />
              </main>
          </nav>
        } />
        </Routes>
      </Router>
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
    </div>
  )
}

export default App

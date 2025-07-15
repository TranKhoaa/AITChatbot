import {BrowserRouter as Router, Routes, Route, BrowserRouter, Link} from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import FileManagement from './components/FileManagement';
import AdminPage from './pages/adminPage';
import UploadFiles from './components/UploadFiles';
import Chat from './pages/Chat';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useState } from 'react';
const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Function to toggle sidebar visibility
  const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
  };

  return (
      <Router>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />}/>
          <Route path='/signup' element={<SignUpPage />}/>
          <Route path='/admin/*' element={<AdminPage />}/>

          <Route path='/sidebar' element={<Sidebar />}/>

          <Route path="/test" element={
          <nav className="">
              <UploadFiles />
          </nav>} />
        <Route path="/chat" element={
          <nav>
            <div className="">
              <Header toggleSidebar={toggleSidebar} />
            </div>
              <main className="flex top-16 h-fit bg-black">
                  <Sidebar isSidebarOpen={isSidebarOpen} />
                  <Chat />
              </main>
          </nav>
        } />
        </Routes>
      </Router>
  )
}

export default App

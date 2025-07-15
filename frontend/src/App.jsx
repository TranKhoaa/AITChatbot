import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import FileManagement from './components/FileManagement';
import AdminPage from './pages/adminPage';
function App() {

  return (
      <Router>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />}/>
          <Route path='/signup' element={<SignUpPage />}/>
          <Route path='/admin/*' element={<AdminPage />}/>
        </Routes>
      </Router>
  )
}

export default App

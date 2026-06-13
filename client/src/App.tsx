import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Home from './pages/Home'
import ByList from './pages/recommend/ByList'
import ByAnime from './pages/recommend/ByAnime'
import ByChat from './pages/recommend/ByChat'
import ErrorPage from './pages/ErrorPage'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recommend/by-list" element={<ByList />} />
          <Route path="/recommend/by-anime" element={<ByAnime />} />
          <Route path="/recommend/by-chat" element={<ByChat />} />
          <Route path="/error" element={<ErrorPage />} />
        </Routes>
      </div>
      <Analytics />
    </AuthProvider>
  )
}

export default App

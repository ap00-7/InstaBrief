import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import axios from 'axios'
import SummarizeForm from './components/SummarizeForm'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ArticleDetail from './pages/ArticleDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import NewArticle from './pages/NewArticle'
import Profile from './pages/Profile'
import History from './pages/History'
import SearchPage from './pages/Search'
import SavedPage from './pages/Saved'
import SupportPage from './pages/Support'
import SettingsPage from './pages/Settings'
import RequireAuth, { isAuthed } from './lib/auth'
import Logout from './pages/Logout'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">InstaBrief</Link>
          <nav className="space-x-4">
            <Link to="/" className="hover:underline">Home</Link>
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/articles/new" className="hover:underline">New</Link>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/logout" className="hover:underline">Logout</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6">{children}</main>
    </div>
  )
}

function Home() {
  return (
    <Layout>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">Summarize articles instantly</h1>
        <SummarizeForm />
      </div>
    </Layout>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={isAuthed() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/articles/:id" element={<RequireAuth><Layout><ArticleDetail /></Layout></RequireAuth>} />
      <Route path="/articles/new" element={<RequireAuth><Layout><NewArticle /></Layout></RequireAuth>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/profile" element={<RequireAuth><Layout><Profile /></Layout></RequireAuth>} />
      <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
      <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
      <Route path="/saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
      <Route path="/support" element={<RequireAuth><SupportPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={isAuthed() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>,
)


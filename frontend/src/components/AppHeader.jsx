import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import ProfileDropdown from './ProfileDropdown'

export default function AppHeader({ onMenuClick, searchQuery, onSearchChange, semantic, onSemanticChange, onSearch }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  async function loadUser() {
    try {
      const { data } = await api.get('/users/me')
      setUser(data)
    } catch (e) {
      console.error('Failed to load user', e)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  function getUserInitials() {
    if (!user) return 'U'
    const email = user.email || ''
    return email.charAt(0).toUpperCase()
  }

  function handleSupport() {
    navigate('/support')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <button 
            onClick={onMenuClick}
            className="md:hidden mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ☰
          </button>
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
            <p className="text-xs text-gray-500">AI-Powered Summarization</p>
          </div>
          {searchQuery !== undefined && (
            <div className="ml-4 md:ml-8 flex-1 max-w-md">
              <div className="relative">
                <input 
                  value={searchQuery} 
                  onChange={e => onSearchChange(e.target.value)} 
                  placeholder="Search documents, summaries, or tags..." 
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>
          )}
          {semantic !== undefined && (
            <div className="hidden lg:flex items-center ml-4">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={semantic} onChange={e => onSemanticChange(e.target.checked)} /> 
                Semantic
              </label>
              <button onClick={onSearch} className="ml-2 px-3 py-2 border rounded">Search</button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex items-center text-gray-600">
            <span className="mr-2">🌐</span>
            <span>us English</span>
            <span className="ml-1">▾</span>
          </div>
          <button onClick={handleSupport} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">❓</button>
          <ProfileDropdown user={user} getUserInitials={getUserInitials} />
        </div>
      </div>
      {/* Mobile search controls */}
      {semantic !== undefined && (
        <div className="lg:hidden mt-3 flex items-center justify-between">
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={semantic} onChange={e => onSemanticChange(e.target.checked)} /> 
            Semantic
          </label>
          <button onClick={onSearch} className="px-3 py-2 border rounded">Search</button>
        </div>
      )}
    </header>
  )
}

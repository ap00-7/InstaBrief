import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'

export default function AppSidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
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

  const navItems = [
    { name: "Dashboard", icon: "📊", path: "/dashboard" },
    { name: "History", icon: "🕒", path: "/history" },
    { name: "Search & Explore", icon: "🔎", path: "/search" },
    { name: "Saved Summaries", icon: "🔖", path: "/saved" },
  ]

  const helpItems = [
    { name: "Support", icon: "❓", path: "/support" },
    { name: "Settings", icon: "⚙️", path: "/settings" },
  ]

  function handleNavigation(path) {
    navigate(path)
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed md:relative h-full z-40 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">🗎</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
              <p className="text-xs text-gray-500">AI-Powered Summarization</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <nav className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Menu</h3>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <button 
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full text-left flex items-center px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path 
                        ? 'text-purple-700 bg-gray-100' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
            
            <h3 className="mt-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Help & Settings</h3>
            <ul className="space-y-2">
              {helpItems.map((item) => (
                <li key={item.name}>
                  <button 
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full text-left flex items-center px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path 
                        ? 'text-purple-700 bg-gray-100' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Spacer to push AI Processing to bottom */}
          <div className="flex-1"></div>
          
          {/* AI Processing at the very bottom */}
          <div className="p-4 bg-purple-50 border-t border-gray-200 mt-auto">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">🧠</div>
              <div>
                <p className="text-sm font-medium text-purple-900">AI Processing</p>
                <p className="text-xs text-purple-600">Enhanced summarization with GPT-4</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

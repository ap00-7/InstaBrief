import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProfileDropdown({ user, profilePhoto }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNavigation = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  const handleLogout = () => {
    // Clear any stored auth data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Navigate to logout page
    navigate('/logout')
    setIsOpen(false)
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    
    // Check if we have first_name and last_name
    const firstName = user.first_name?.trim()
    const lastName = user.last_name?.trim()
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName[0].toUpperCase()
    }
    if (lastName) {
      return lastName[0].toUpperCase()
    }
    
    // If no name fields, try to get initials from email
    if (user.email) {
      const emailName = user.email.split('@')[0]
      if (emailName.length >= 2) {
        return emailName.substring(0, 2).toUpperCase()
      }
      return emailName[0].toUpperCase()
    }
    
    return 'U'
  }

  const getUserDisplayName = () => {
    if (!user) return 'User'
    
    // Check if we have first_name and last_name (handle null/undefined/empty strings)
    const firstName = user.first_name?.trim()
    const lastName = user.last_name?.trim()
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    if (firstName) {
      return firstName
    }
    if (lastName) {
      return lastName
    }
    
    // If no name fields are available, try to extract name from email
    if (user.email) {
      const emailName = user.email.split('@')[0]
      // Convert email username to a more readable format
      return emailName.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    return 'User'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium hover:bg-purple-700 transition-colors overflow-hidden"
      >
        {profilePhoto ? (
          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          getUserInitials()
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
            <p className="text-xs text-gray-500">Signed in</p>
          </div>
          
          <button
            onClick={() => handleNavigation('/settings?tab=profile')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <span className="mr-3">👤</span>
            My Profile
          </button>
          
          <button
            onClick={() => handleNavigation('/settings')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <span className="mr-3">⚙️</span>
            Settings
          </button>
          
          <button
            onClick={() => handleNavigation('/support')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <span className="mr-3">❓</span>
            Support
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <span className="mr-3">🚪</span>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

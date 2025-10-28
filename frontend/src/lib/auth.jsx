import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from './api'

export function isAuthed() {
  // Development bypass - always return true
  return true
  // Production: return Boolean(localStorage.getItem('token'))
}

export default function RequireAuth({ children }) {
  // Development bypass - skip authentication
  return children
  
  /* Production authentication code:
  const location = useLocation()
  const [status, setStatus] = useState(isAuthed() ? 'checking' : 'no')

  useEffect(() => {
    if (status !== 'checking') return
    // Validate token by hitting a protected endpoint
    api.get('/users/me').then(() => setStatus('ok')).catch(() => {
      localStorage.removeItem('token')
      setStatus('no')
    })
  }, [status])

  if (status === 'no') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    )
  }
  return children
  */
}



import { useEffect } from 'react'
import { setToken } from '../lib/api'

export default function Logout() {
  useEffect(() => {
    setToken(null)
    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
  }, [])
  return null
}



import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken } from '../lib/api'
import { handleOAuthCallback } from '../lib/oauth'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const token = searchParams.get('token')

        if (token) {
          // Direct token from backend redirect
          setToken(token)
          navigate('/dashboard', { replace: true })
        } else if (code && state) {
          // OAuth callback with code
          const accessToken = await handleOAuthCallback(code, state)
          setToken(accessToken)
          navigate('/dashboard', { replace: true })
        } else {
          setError('Invalid callback parameters')
          setTimeout(() => navigate('/login'), 3000)
        }
      } catch (err) {
        setError(err.message || 'Authentication failed')
        setTimeout(() => navigate('/login'), 3000)
      } finally {
        setLoading(false)
      }
    }

    processCallback()
  }, [searchParams, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <span className="text-white text-xl font-bold">IB</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Signing you in...</h2>
          <p className="text-gray-500">Please wait while we complete your authentication.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Failed</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <p className="text-sm text-gray-400">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  return null
}

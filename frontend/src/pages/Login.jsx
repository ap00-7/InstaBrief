import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setToken } from '../lib/api'
import { initiateGoogleAuth, initiateMicrosoftAuth } from '../lib/oauth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    // Development bypass - create a token that includes user info
    const userInfo = {
      email: email || 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe'
    }
    // Store user info in localStorage for development bypass
    localStorage.setItem('dev-user-info', JSON.stringify(userInfo))
    setToken('dev-token-bypass')
    navigate('/dashboard', { replace: true })
    
    /* Production authentication code:
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.access_token)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
    */
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <span className="text-white text-xl font-bold">IB</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">InstaBrief</h1>
          </div>
          <p className="text-gray-500 text-sm">Summarize Smarter, Tag Faster</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                type="password" 
                placeholder="Enter your password" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                required 
              />
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <button 
              disabled={loading} 
              className="w-full text-white py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              type="button" 
              onClick={initiateGoogleAuth}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Continue with Google</span>
            </button>
            <button 
              type="button" 
              onClick={initiateMicrosoftAuth}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#00BCF2" d="M0 0h11.377v11.372H0z"/>
                <path fill="#00BCF2" d="M12.623 0H24v11.372H12.623z"/>
                <path fill="#00BCF2" d="M0 12.623h11.377V24H0z"/>
                <path fill="#FFC107" d="M12.623 12.623H24V24H12.623z"/>
              </svg>
              <span className="text-gray-700 font-medium">Continue with Microsoft</span>
            </button>
          </div>

          <p className="text-center text-gray-600 mt-6 text-sm">
            Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">Sign up</Link>
          </p>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <p className="text-gray-600 text-sm font-medium">AI Summarization</p>
          </div>
          <div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3l3.293 3.293-7 7-1.586-1.586L13 3z"/>
                <path d="M19 13l-3.293-3.293-7 7 1.586 1.586L19 13z"/>
              </svg>
            </div>
            <p className="text-gray-600 text-sm font-medium">Smart Tagging</p>
          </div>
          <div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
            <p className="text-gray-600 text-sm font-medium">Multi-Format</p>
          </div>
        </div>
      </div>
    </div>
  )
}



import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setToken } from '../lib/api'
import { initiateGoogleAuth, initiateMicrosoftAuth } from '../lib/oauth'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/register', { email, password, first_name: firstName, last_name: lastName })
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.access_token)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setError('Registration failed')
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Create your account</h2>
          <p className="text-gray-500 text-sm">Join thousands of users who summarize smarter</p>
        </div>

        {/* Sign-up Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input 
                  value={firstName} 
                  onChange={e=>setFirstName(e.target.value)} 
                  type="text" 
                  placeholder="John" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input 
                  value={lastName} 
                  onChange={e=>setLastName(e.target.value)} 
                  type="text" 
                  placeholder="Doe" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                  required 
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                type="email" 
                placeholder="john@example.com" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                required 
              />
            </div>

            {/* Password Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                type="password" 
                placeholder="Create a strong password" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input 
                value={confirm} 
                onChange={e=>setConfirm(e.target.value)} 
                type="password" 
                placeholder="Confirm your password" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                required 
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input 
                type="checkbox" 
                id="terms" 
                className="mt-1 mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" 
                required 
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
              </label>
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            
            <button 
              disabled={loading} 
              className="w-full text-white py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Creating account...' : 'Create Account'}
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
              <span className="text-gray-700 font-medium">Sign up with Google</span>
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
              <span className="text-gray-700 font-medium">Sign up with Microsoft</span>
            </button>
          </div>

          <p className="text-center text-gray-600 mt-6 text-sm">
            Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}



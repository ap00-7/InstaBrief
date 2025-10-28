import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { initializeTheme } from '../lib/theme'
import ProfileDropdown from '../components/ProfileDropdown'

export default function SupportPage() {
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    initializeTheme()
    
    async function loadUser() {
      try {
        const { data } = await api.get('/users/me')
        setUser(data)
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }
    loadUser()
  }, [])


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex grow flex-col overflow-y-auto bg-white dark:bg-gray-800 ring-1 ring-white/10 dark:ring-gray-700">
              {/* Logo Section */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
                    <p className="text-xs text-gray-500">AI-Powered Summarization</p>
                  </div>
                </div>
              </div>
              
              <nav className="flex-1 px-4 py-4">
                {/* MAIN MENU Section */}
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Main Menu
                  </h3>
                  <ul role="list" className="space-y-1">
                    {/* Dashboard */}
                    <li>
                      <button
                        onClick={() => { navigate('/dashboard'); setSidebarOpen(false); }}
                        className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Dashboard
                      </button>
                    </li>
                    {/* History */}
                    <li>
                      <button
                        onClick={() => { navigate('/history'); setSidebarOpen(false); }}
                        className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        History
                      </button>
                    </li>
                    {/* Search & Explore */}
                    <li>
                      <button
                        onClick={() => { navigate('/search'); setSidebarOpen(false); }}
                        className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search & Explore
                      </button>
                    </li>
                    {/* Saved Summaries */}
                    <li>
                      <button
                        onClick={() => { navigate('/saved'); setSidebarOpen(false); }}
                        className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Saved Summaries
                      </button>
                    </li>
                  </ul>
                </div>

                {/* HELP & SETTINGS Section */}
                <div>
                  <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Help & Settings
                  </h3>
                  <ul role="list" className="space-y-1">
                    {/* Support */}
                    <li>
                      <button
                        onClick={() => { navigate('/support'); setSidebarOpen(false); }}
                        className="group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium w-full text-left bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Support
                      </button>
                    </li>
                    {/* Settings */}
                    <li>
                      <button
                        onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
                        className="group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium w-full text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                    </li>
                  </ul>
                </div>
              </nav>

              {/* AI Processing Section at bottom */}
              <div className="mt-auto bg-purple-50 dark:bg-purple-900/20 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Processing</p>
                    <p className="text-xs text-purple-600 dark:text-purple-300">Enhanced summarization with GPT-4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col lg:w-64">
        <div className="flex grow flex-col overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Logo Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
                <p className="text-xs text-gray-500">AI-Powered Summarization</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-4">
            {/* MAIN MENU Section */}
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Main Menu
              </h3>
              <ul role="list" className="space-y-1">
                {/* Dashboard */}
                <li>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </button>
                </li>
                {/* History */}
                <li>
                  <button
                    onClick={() => navigate('/history')}
                    className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </button>
                </li>
                {/* Search & Explore */}
                <li>
                  <button
                    onClick={() => navigate('/search')}
                    className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search & Explore
                  </button>
                </li>
                {/* Saved Summaries */}
                <li>
                  <button
                    onClick={() => navigate('/saved')}
                    className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Saved Summaries
                  </button>
                </li>
              </ul>
            </div>

            {/* HELP & SETTINGS Section */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Help & Settings
              </h3>
              <ul role="list" className="space-y-1">
                {/* Support */}
                <li>
                  <button
                    onClick={() => navigate('/support')}
                    className="w-full flex items-center rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors text-left px-3 py-2.5"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Support
                  </button>
                </li>
                {/* Settings */}
                <li>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left px-3 py-2.5"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* AI Processing Section at bottom */}
          <div className="mt-auto bg-purple-50 dark:bg-purple-900/20 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Processing</p>
                <p className="text-xs text-purple-600 dark:text-purple-300">Enhanced summarization with GPT-4</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content container */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 lg:hidden" />

          {/* Logo section with search bar inline - matching Dashboard */}
          <div className="flex items-center flex-1">
            {/* Desktop hamburger menu */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* InstaBrief Logo */}
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>

            {/* InstaBrief Title and Tagline */}
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
              <p className="text-xs text-gray-500">AI-Powered Summarization</p>
              <p className="text-xs text-purple-500">Lang: en</p>
            </div>

            {/* Search Bar - inline with logo */}
            <div className="ml-4 md:ml-8 flex-1 max-w-md">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search documents, summaries, or tags..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-center ml-4">
              <button className="px-3 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700">Search</button>
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Globe Icon */}
            <div className="hidden md:flex items-center text-gray-600">
              <span className="mr-2">🌐</span>
            </div>

            {/* Language Selector with Flag */}
            <div className="hidden md:flex items-center text-gray-600">
              <span className="mr-2">🇺🇸</span>
              <select className="border-0 bg-transparent text-sm focus:ring-0">
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>

            {/* Help Icon */}
            <button className="hidden md:block p-1.5 text-gray-500 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button className="flex items-center p-1.5 text-gray-500 hover:text-gray-700">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  U
                </div>
              </button>
            </div>
          </div>
          </div>
        </header>

        <main className="py-6 lg:py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-none">
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Find answers to your questions, learn how to use InstaBrief effectively, or get in touch with our support team.
                </p>
              </div>

              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative max-w-4xl mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search FAQs..."
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Search
                    </span>
                  </button>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left Column - Support Options and FAQ */}
                <div className="xl:col-span-3 lg:col-span-2 space-y-6 lg:space-y-8">
                  {/* FAQ Section */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                    
                    <div className="space-y-4">
                      {(() => {
                        const faqs = [
                        {
                          id: 1,
                          question: "How do I upload documents for summarization?",
                          answer: "You can upload documents by dragging and dropping them onto the dashboard upload area, or by clicking the upload button. We support PDF, DOC, DOCX, TXT, and many other document formats."
                        },
                        {
                          id: 2,
                          question: "What's the difference between extractive and abstractive summarization?",
                          answer: "Extractive summarization selects and combines existing sentences from the document, preserving the original wording. Abstractive summarization uses AI to generate new sentences that capture the main ideas in a more natural, human-like way, similar to how a person would summarize a text."
                        },
                        {
                          id: 3,
                          question: "Can I adjust the length of my summaries?",
                          answer: "Yes! You can adjust the summary length in the Settings page. Choose from brief, moderate, or detailed summaries based on your needs. The length setting will be applied to all future summaries."
                        },
                        {
                          id: 4,
                          question: "How does the smart tagging feature work?",
                          answer: "Our AI automatically analyzes your documents and generates relevant tags based on the content, topics, and themes identified in the text. You can enable or disable auto-generate tags in the Settings page under Preferences. You can also add custom tags manually to any document."
                        },
                        {
                          id: 5,
                          question: "Is my data secure and private?",
                          answer: "Yes, we take data security seriously. All documents are encrypted in transit using HTTPS and at rest using industry-standard encryption. We never share your content with third parties, and you have full control over your data. You can delete documents at any time."
                        },
                        {
                          id: 6,
                          question: "Can I export my summaries?",
                          answer: "Absolutely! You can export your summaries in various formats including PDF, Word (DOCX), and plain text from the summary view. Click the export button in the summary details page to choose your preferred format."
                        },
                        {
                          id: 7,
                          question: "What file formats are supported?",
                          answer: "We support a wide range of document formats including PDF, DOC, DOCX, TXT, RTF, ODT, and more. Images with text (JPG, PNG) can also be processed using OCR technology to extract and summarize text content."
                        },
                        {
                          id: 8,
                          question: "What AI models does InstaBrief use?",
                          answer: "InstaBrief uses advanced AI models including GPT-4, GPT-3.5 Turbo, and Claude for enhanced summarization. You can select your preferred AI model in the Settings page. GPT-4 provides the highest quality summaries with better understanding of context and nuance."
                        },
                        {
                          id: 9,
                          question: "Can I use dark mode?",
                          answer: "Yes! InstaBrief supports both light and dark themes. You can switch between themes in the Settings page under Preferences, or choose 'System' to automatically match your device's theme preference."
                        },
                        {
                          id: 10,
                          question: "Where can I view my document history?",
                          answer: "All your uploaded documents and summaries are available in the History page. You can access it from the sidebar menu. The history shows all documents you've processed, along with their summaries, tags, and processing dates."
                        },
                        {
                          id: 11,
                          question: "How do I search for specific documents or summaries?",
                          answer: "Use the Search & Explore page from the sidebar menu to search through all your documents and summaries. You can search by document name, content, tags, or date. The search bar at the top of most pages also provides quick search functionality."
                        },
                        {
                          id: 12,
                          question: "Is there a limit to document size?",
                          answer: "Document size limits depend on your subscription plan. Free accounts can upload documents up to 10MB, while premium accounts support documents up to 50MB. Very large documents may take longer to process."
                        },
                        {
                          id: 13,
                          question: "How long does it take to generate a summary?",
                          answer: "Processing time varies based on document length and complexity. Most documents are processed within 30 seconds to 2 minutes. Longer documents with complex formatting may take up to 5 minutes. You'll receive a notification when your summary is ready."
                        },
                        {
                          id: 14,
                          question: "How accurate are the summaries?",
                          answer: "Our AI-powered summaries are highly accurate, capturing the key points and main ideas of documents. The accuracy depends on the document quality, clarity, and the AI model used. GPT-4 provides the highest accuracy with better understanding of context and nuance."
                        },
                        {
                          id: 15,
                          question: "What's included in the free plan?",
                          answer: "The free plan includes basic summarization features, support for common document formats, up to 20 documents per month, and access to GPT-3.5 Turbo. Premium plans offer unlimited documents, GPT-4 access, advanced features, and priority support."
                        },
                        {
                          id: 16,
                          question: "How do I contact customer support?",
                          answer: "You can contact our support team using the contact form on this page, or by emailing support@instabrief.com. Premium users have access to priority support with faster response times. Our team typically responds within 2 hours during business hours."
                        }
                        ];

                        // Filter FAQs based on search query
                        const filteredFaqs = searchQuery.trim() 
                          ? faqs.filter(faq => 
                              faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                          : faqs;

                        // Function to highlight search terms
                        const highlightText = (text, searchTerm) => {
                          if (!searchTerm.trim()) return text;
                          const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                          const parts = text.split(regex);
                          return parts.map((part, index) => 
                            regex.test(part) ? (
                              <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">
                                {part}
                              </mark>
                            ) : part
                          );
                        };

                        return (
                          <>
                            {filteredFaqs.length > 0 ? (
                              filteredFaqs.map((faq) => (
                                <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                  <button
                                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                    className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  >
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {highlightText(faq.question, searchQuery)}
                                    </span>
                                    <svg 
                                      className={`h-5 w-5 text-gray-500 transition-transform ${expandedFAQ === faq.id ? 'rotate-180' : ''}`}
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {expandedFAQ === faq.id && (
                                    <div className="px-4 pb-3">
                                      <p className="text-gray-600 dark:text-gray-300">
                                        {highlightText(faq.answer, searchQuery)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : searchQuery.trim() ? (
                              <div className="text-center py-12">
                                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                  No FAQs found for "{searchQuery}"
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                  We couldn't find any frequently asked questions matching your search. Please try different keywords or contact our support team for assistance.
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                  <div className="flex items-center">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                                      Need help? Use the contact form on the right to get personalized support!
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                </div>

                {/* Right Column - Contact Form */}
                <div className="xl:col-span-1 lg:col-span-1">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Support</h3>
                    
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select 
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select category</option>
                          <option value="technical">Technical Issue</option>
                          <option value="billing">Billing</option>
                          <option value="feature">Feature Request</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                        <select 
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Brief description of your issue"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          placeholder="Provide detailed information about your question or issue"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Submit Ticket
                      </button>
                    </form>

                    {/* Support Status */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Support Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">All systems operational</span>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-green-600 dark:text-green-400">Online</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Average response time</span>
                          <span className="text-gray-900 dark:text-white">&lt; 2 hours</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Customer satisfaction</span>
                          <span className="text-gray-900 dark:text-white">4.9/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { initializeTheme } from '../lib/theme'
import ProfileDropdown from '../components/ProfileDropdown'

function SavedCard({ a, onToggleSave, rating, onRatingChange, note, onNoteChange }) {
  const [hoveredStar, setHoveredStar] = useState(0)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(note || 'Important for quarterly review meeting')

  const getFileIcon = (filename) => {
    if (!filename) return '📄'
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return '📄'
      case 'doc':
      case 'docx': return '📝'
      case 'ppt':
      case 'pptx': return '📊'
      case 'xls':
      case 'xlsx': return '📈'
      default: return '📄'
    }
  }

  const getFileSize = () => {
    // First, check if the document has an actual size property
    if (a.size && typeof a.size === 'number') {
      const bytes = a.size
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    }
    
    // Fallback: Estimate size based on content/summary length for consistency
    // This gives more realistic sizes than random values
    const contentLength = (a.summary || a.content || a.title || '').length
    if (contentLength < 1000) return '0.5 MB'
    if (contentLength < 5000) return '1.2 MB'
    if (contentLength < 10000) return '2.3 MB'
    if (contentLength < 20000) return '3.8 MB'
    return '4.5 MB'
  }

  const handleRating = (star) => {
    onRatingChange(a.id, star)
  }

  const handleDownload = () => {
    // Download functionality
    console.log('Downloading:', a.title)
    alert(`Downloading ${a.title}...`)
  }

  const handleShare = () => {
    // Share functionality
    console.log('Sharing:', a.title)
    if (navigator.share) {
      navigator.share({
        title: a.title,
        text: a.summary || 'Check out this document',
        url: window.location.href
      }).catch((error) => console.log('Error sharing:', error))
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleDelete = () => {
    // Delete functionality
    if (confirm(`Are you sure you want to delete "${a.title}"?`)) {
      onToggleSave(a.id)
      console.log('Deleted:', a.title)
    }
  }

  const handleNoteSave = () => {
    onNoteChange(a.id, noteText)
    setIsEditingNote(false)
  }

  const handleNoteCancel = () => {
    setNoteText(note || 'Important for quarterly review meeting')
    setIsEditingNote(false)
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {/* Header with file icon, title and bookmark */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm">
            {getFileIcon(a.title)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{a.title || 'Untitled Document'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{getFileSize()}</span>
              <div className="flex items-center">
                {Array.from({length: 5}, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleRating(i + 1)}
                    onMouseEnter={() => setHoveredStar(i + 1)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="text-yellow-400 hover:scale-110 transition-transform cursor-pointer"
                    title={`Rate ${i + 1} stars`}
                  >
                    {(hoveredStar > 0 ? hoveredStar : rating) > i ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggleSave(a.id)}
          className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
          title="Remove from saved"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Content Summary */}
      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
        {a.summary || a.content || 'AI-generated extractive summary of the document content with key insights and important information.'}
      </p>

      {/* Notes Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
        {isEditingNote ? (
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full text-xs text-yellow-700 font-medium bg-white border border-yellow-300 rounded p-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
              rows={2}
              placeholder="Add your notes here..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleNoteSave}
                className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleNoteCancel}
                className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <p className="text-xs text-yellow-700 font-medium flex-1">
              Notes: {noteText}
            </p>
            <button
              onClick={() => setIsEditingNote(true)}
              className="ml-2 p-1 hover:bg-yellow-100 rounded transition-colors"
              title="Edit note"
            >
              <svg className="w-3 h-3 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex gap-2 flex-wrap mb-4">
        {a.tags?.length ? (
          a.tags.slice(0,4).map(t => (
            <span key={t} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              {t}
            </span>
          ))
        ) : (
          <>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Business</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Q4</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Revenue</span>
          </>
        )}
      </div>

      {/* Footer with save date, action buttons and view button */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved: 1/15/2024
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Download"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Share"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-100 rounded transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <Link 
          to={`/articles/${a.id}`} 
          className="w-full inline-flex items-center justify-center gap-1 bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </Link>
      </div>
    </div>
  )
}

export default function SavedPage() {
  const [items, setItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bookmarkedItems, setBookmarkedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bookmarkedItems')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch (e) {
      console.error('Error loading bookmarked items:', e)
      return new Set()
    }
  })
  const [ratings, setRatings] = useState(() => {
    try {
      const saved = localStorage.getItem('documentRatings')
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      console.error('Error loading ratings:', e)
      return {}
    }
  })
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('documentNotes')
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      console.error('Error loading notes:', e)
      return {}
    }
  })
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage or use default
    try {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        return JSON.parse(savedUser)
      }
    } catch (e) {
      console.log('Error loading user from localStorage:', e)
    }
    // Default user data
    return {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com'
    }
  })
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [q, setQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Language change handler (for navbar)
  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value)
  }

  // Search handler (for navbar)
  const handleSearch = () => {
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`)
    }
  }

  useEffect(() => {
    // Initialize theme
    initializeTheme()
    
    async function load() {
      try {
        setLoading(true)
        setError(null)
        console.log('=== LOADING SAVED ITEMS ===')
        console.log('Current bookmarkedItems:', Array.from(bookmarkedItems))
        
        // Start with localStorage data (most reliable)
        let allAvailableItems = []
        
        try {
          const recentActivity = JSON.parse(localStorage.getItem('recentActivity') || '[]')
          console.log('Recent activity items:', recentActivity.length)
          allAvailableItems = [...recentActivity]
        } catch (e) {
          console.error('Error parsing localStorage:', e)
        }
        
        // Try to load from API (optional)
        try {
          const { data } = await api.get('/articles', { params: { limit: 100 } })
          if (Array.isArray(data)) {
            console.log('API items loaded:', data.length)
            allAvailableItems = [...allAvailableItems, ...data]
          }
        } catch (apiError) {
          console.log('API failed, using localStorage only:', apiError.message)
        }
        
        // Remove duplicates
        const uniqueItems = allAvailableItems.reduce((acc, item) => {
          if (item && item.id && !acc.find(existing => existing.id === item.id)) {
            acc.push(item)
          }
          return acc
        }, [])
        
        console.log('Total unique items available:', uniqueItems.length)
        setAllItems(uniqueItems)
        
        // Filter for bookmarked items
        const savedItems = uniqueItems.filter(item => {
          const isBookmarked = bookmarkedItems.has(item.id)
          if (isBookmarked) {
            console.log('✓ Bookmarked item found:', item.title || item.id)
          }
          return isBookmarked
        })
        
        console.log('=== FINAL RESULT ===')
        console.log('Saved items to display:', savedItems.length)
        console.log('Items:', savedItems.map(item => ({ id: item.id, title: item.title })))
        
        setItems(savedItems)
        setLoading(false)
        
      } catch (error) {
        console.error('Critical error in load function:', error)
        setError(error.message)
        setLoading(false)
        setItems([])
      }
    }
    
    load()
  }, [bookmarkedItems])

  // Toggle bookmark function
  const toggleBookmark = (itemId) => {
    setBookmarkedItems(prevBookmarked => {
      const newSet = new Set(prevBookmarked)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      // Save to localStorage
      localStorage.setItem('bookmarkedItems', JSON.stringify([...newSet]))
      return newSet
    })
  }

  // Update rating function
  const updateRating = (itemId, rating) => {
    setRatings(prevRatings => {
      const newRatings = { ...prevRatings, [itemId]: rating }
      localStorage.setItem('documentRatings', JSON.stringify(newRatings))
      return newRatings
    })
  }

  // Update note function
  const updateNote = (itemId, noteText) => {
    setNotes(prevNotes => {
      const newNotes = { ...prevNotes, [itemId]: noteText }
      localStorage.setItem('documentNotes', JSON.stringify(newNotes))
      return newNotes
    })
  }

  // Calculate average rating
  const calculateAvgRating = () => {
    if (items.length === 0) return 0
    
    // Calculate average based on currently displayed saved items
    // Use default rating of 5 if not explicitly set
    const sum = items.reduce((acc, item) => {
      const itemRating = ratings[item.id] || 5 // Default to 5 stars
      return acc + itemRating
    }, 0)
    
    return (sum / items.length).toFixed(1)
  }

  // Calculate unique categories
  const calculateCategories = () => {
    const allTags = items.flatMap(item => item.tags || [])
    return new Set(allTags).size
  }

  // Get all unique categories for filter dropdown
  const getAllCategories = () => {
    const allTags = items.flatMap(item => item.tags || [])
    return [...new Set(allTags)]
  }

  // Filter and sort items
  const getFilteredAndSortedItems = () => {
    let filteredItems = [...items]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredItems = filteredItems.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filteredItems = filteredItems.filter(item =>
        item.tags?.includes(categoryFilter)
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filteredItems.sort((a, b) => {
          const dateA = new Date(a.created_at || 0)
          const dateB = new Date(b.created_at || 0)
          return dateB - dateA // Newest first
        })
        break
      case 'name':
        filteredItems.sort((a, b) => 
          (a.title || '').localeCompare(b.title || '')
        )
        break
      case 'rating':
        filteredItems.sort((a, b) => 
          (ratings[b.id] || 0) - (ratings[a.id] || 0) // Highest rating first
        )
        break
      default:
        break
    }

    return filteredItems
  }

  const displayedItems = getFilteredAndSortedItems()

  // Add error boundary protection
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="flex items-center mr-8">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
                <p className="text-xs text-gray-500">AI-Powered Summarization</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documents, summaries, or tags..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <span className="mr-2">🌐</span>
              <select 
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="bg-transparent border-none text-gray-600 focus:outline-none cursor-pointer text-sm"
              >
                <option value="en">🇺🇸 English (US)</option>
                <option value="en-gb">🇬🇧 English (UK)</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
                <option value="de">🇩🇪 German</option>
                <option value="it">🇮🇹 Italian</option>
                <option value="pt">🇵🇹 Portuguese</option>
                <option value="ru">🇷🇺 Russian</option>
                <option value="ja">🇯🇵 Japanese</option>
                <option value="ko">🇰🇷 Korean</option>
                <option value="zh">🇨🇳 Chinese</option>
                <option value="hi">🇮🇳 Hindi</option>
                <option value="ar">🇸🇦 Arabic</option>
              </select>
            </div>
            <ProfileDropdown user={user} />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col fixed left-0 top-0 h-screen overflow-y-auto">
          {/* Logo section at top */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
                <p className="text-xs text-gray-500">AI-Powered Summarization</p>
              </div>
            </div>
          </div>
          
          {/* Main flex container with flex-1 flex flex-col for the navigation content */}
          <div className="flex-1 flex flex-col">
            {/* Navigation section that takes up available space */}
            <nav className="flex-1 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Menu</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => navigate('/dashboard')} 
                    className="w-full text-left flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/history')} 
                    className="w-full text-left flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    History
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/search')} 
                    className="w-full text-left flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search & Explore
                  </button>
                </li>
                <li>
                  <span className="flex items-center px-3 py-2 rounded-lg text-purple-700 bg-purple-50 border border-purple-200">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Saved Summaries
                  </span>
                </li>
              </ul>

              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-8">Help & Settings</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => navigate('/support')} 
                    className="w-full text-left flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Support
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate('/settings')} 
                    className="w-full text-left flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </li>
              </ul>
            </nav>

            {/* AI Processing Section - Positioned at the very bottom with mt-auto */}
            <div className="mt-auto bg-purple-50 border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">AI Processing</p>
                  <p className="text-xs text-purple-600">Enhanced summarization with GPT-4</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Summaries</h2>
              <p className="text-gray-600 dark:text-gray-300">Your bookmarked documents and summaries</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {items.length} saved {items.length === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>
        </header>
        <main className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading saved items...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading saved items</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Saved</p>
                      <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Categories</p>
                      <p className="text-2xl font-bold text-gray-900">{calculateCategories()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avg Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{calculateAvgRating()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">This Week</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search saved summaries, notes, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      {getAllCategories().map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="date">Save Date</option>
                      <option value="name">Name</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              {displayedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedItems.map(a => (
                    <SavedCard 
                      key={a.id} 
                      a={a} 
                      onToggleSave={toggleBookmark}
                      rating={ratings[a.id] || 5}
                      onRatingChange={updateRating}
                      note={notes[a.id] || ''}
                      onNoteChange={updateNote}
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved items yet</h3>
                  <p className="text-gray-500 mb-4">Documents you bookmark will appear here for easy access.</p>
                  <button 
                    onClick={() => navigate('/dashboard')} 
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Documents
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your search or filters.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('')
                      setCategoryFilter('all')
                      setSortBy('date')
                    }} 
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </main>
        </div>
      </div>
    </div>
  )
}



import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { initializeTheme } from '../lib/theme'
import ProfileDropdown from '../components/ProfileDropdown'

export default function History() {
  const [items, setItems] = useState([])
  const [recentActivity, setRecentActivity] = useState(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('recentActivity')
    return saved ? JSON.parse(saved) : []
  })
  const [q, setQ] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [semantic, setSemantic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('date')
  const [savedOnly, setSavedOnly] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [bookmarkedItems, setBookmarkedItems] = useState(() => {
    // Load bookmarks from localStorage on initialization
    const saved = localStorage.getItem('bookmarkedItems')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const navigate = useNavigate()

  // Language translations
  const translations = {
    en: {
      searchPlaceholder: "Search documents, summaries, or tags...",
      semantic: "Semantic",
      search: "Search",
      dashboard: "Dashboard",
      history: "History",
      searchExplore: "Search & Explore",
      savedSummaries: "Saved Summaries",
      support: "Support",
      settings: "Settings",
      aiProcessing: "AI Processing",
      enhancedSummarization: "Enhanced summarization with GPT-4",
      documentHistory: "Document History",
      manageDocuments: "Manage and explore your processed documents",
      allTypes: "All types",
      date: "Date",
      allDocuments: "All Documents",
      saved: "Saved",
      showAll: "Show all",
      view: "View",
      save: "Save",
      download: "Download",
      share: "Share",
      completed: "completed",
      noDocumentsFound: "No documents found."
    },
    es: {
      searchPlaceholder: "Buscar documentos, resúmenes o etiquetas...",
      semantic: "Semántico",
      search: "Buscar",
      dashboard: "Panel",
      history: "Historial",
      searchExplore: "Buscar y Explorar",
      savedSummaries: "Resúmenes Guardados",
      support: "Soporte",
      settings: "Configuración",
      aiProcessing: "Procesamiento IA",
      enhancedSummarization: "Resumización mejorada con GPT-4",
      documentHistory: "Historial de Documentos",
      manageDocuments: "Gestiona y explora tus documentos procesados",
      allTypes: "Todos los tipos",
      date: "Fecha",
      allDocuments: "Todos los Documentos",
      saved: "Guardados",
      showAll: "Mostrar todos",
      view: "Ver",
      save: "Guardar",
      saved: "Guardado",
      download: "Descargar",
      share: "Compartir",
      completed: "completado",
      noDocumentsFound: "No se encontraron documentos."
    },
    fr: {
      searchPlaceholder: "Rechercher des documents, résumés ou étiquettes...",
      semantic: "Sémantique",
      search: "Rechercher",
      dashboard: "Tableau de bord",
      history: "Historique",
      searchExplore: "Rechercher et Explorer",
      savedSummaries: "Résumés Sauvegardés",
      support: "Support",
      settings: "Paramètres",
      aiProcessing: "Traitement IA",
      enhancedSummarization: "Résumé amélioré avec GPT-4",
      documentHistory: "Historique des Documents",
      manageDocuments: "Gérez et explorez vos documents traités",
      allTypes: "Tous les types",
      date: "Date",
      allDocuments: "Tous les Documents",
      saved: "Sauvegardés",
      showAll: "Afficher tout",
      view: "Voir",
      save: "Sauvegarder",
      saved: "Sauvegardé",
      download: "Télécharger",
      share: "Partager",
      completed: "terminé",
      noDocumentsFound: "Aucun document trouvé."
    }
  }

  const t = translations[selectedLanguage] || translations.en

  // Use recent activity if no items from API
  const displayItems = items.length > 0 ? items : recentActivity
  
  // Filter items based on search query, file type, and sort
  let filteredItems = displayItems
  
  // Apply file type filter
  if (type !== 'all') {
    filteredItems = filteredItems.filter(item => {
      const fileName = item.title || ''
      return fileName.toLowerCase().includes(`.${type}`)
    })
  }
  
  // Apply search filter if there's a search query
  if (searchQuery.trim()) {
    const searchTerm = searchQuery.trim().toLowerCase()
    filteredItems = filteredItems.filter(item => 
      (item.title && item.title.toLowerCase().includes(searchTerm)) ||
      (item.content && item.content.toLowerCase().includes(searchTerm)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    )
  }
  
  // Apply sorting
  if (sort === 'title') {
    filteredItems = [...filteredItems].sort((a, b) => {
      const titleA = (a.title || '').toLowerCase()
      const titleB = (b.title || '').toLowerCase()
      return titleA.localeCompare(titleB)
    })
  } else if (sort === 'date') {
    filteredItems = [...filteredItems].sort((a, b) => {
      const dateA = new Date(a.created_at || a.date || 0)
      const dateB = new Date(b.created_at || b.date || 0)
      return dateB - dateA // Most recent first
    })
  }
  
  // Apply saved filter
  const visible = savedOnly ? filteredItems.filter(item => bookmarkedItems.has(item.id)) : filteredItems
  const savedCount = filteredItems.filter(item => bookmarkedItems.has(item.id)).length

  async function load() {
    console.log('Search button clicked, query:', q)
    setLoading(true)
    try {
      // Set the search query to filter results
      setSearchQuery(q)
      
      // Load all items if not already loaded
      if (items.length === 0) {
        let apiResults = []
        try {
          const { data } = await api.get('/users/me/articles')
          apiResults = data
        } catch {
          const { data } = await api.get('/articles', { params: { limit: 50 } })
          apiResults = data
        }
        
        // If no API results, use recent activity
        if (apiResults.length === 0) {
          apiResults = recentActivity.map(item => ({
            ...item,
            id: item.id || `local_${Date.now()}_${Math.random()}`,
            source: 'local'
          }))
        }
        
        setItems(apiResults)
      }
      
    } catch (e) {
      console.error('Failed to load articles', e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    console.log('Search triggered, query:', q)
    setSearchQuery(q)
  }

  // Auto-search when query changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (q.trim()) {
        setSearchQuery(q)
      } else {
        setSearchQuery('')
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [q])

  // Global Esc key listener to clear search
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        clearSearch()
      }
    }

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Clear search when filters change to show fresh results
  useEffect(() => {
    if (searchQuery) {
      setSearchQuery('')
      setQ('')
    }
  }, [type, sort])

  async function loadUser() {
    try {
      const { data } = await api.get('/users/me')
      setUser(data)
    } catch (e) {
      console.error('Failed to load user', e)
    }
  }

  function clearSearch() {
    setQ('')
    setSearchQuery('')
  }

  function toggleBookmark(itemId) {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev)
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

  useEffect(() => { 
    load()
    loadUser()
    // Initialize theme
    initializeTheme()
    // Load saved language preference
    const savedLanguage = localStorage.getItem('preferredLanguage')
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage)
    }
    // Clear search on page load
    setSearchQuery('')

    // Initialize sidebar state based on screen size
    const initializeSidebar = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    // Initialize immediately
    initializeSidebar()

    // Handle window resize
    const handleResize = () => {
      initializeSidebar()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function getUserInitials() {
    if (!user) return 'U'
    const email = user.email || ''
    return email.charAt(0).toUpperCase()
  }
  
  function handleNavigation(path) {
    navigate(path)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  function handleLanguageChange(e) {
    const newLanguage = e.target.value
    setSelectedLanguage(newLanguage)
    localStorage.setItem('preferredLanguage', newLanguage)
  }

  function DocCard({ a, onToggleSave, saved, viewMode = 'grid' }) {
    const getFileIcon = (title) => {
      if (title?.toLowerCase().includes('.pdf')) return '📄'
      if (title?.toLowerCase().includes('.docx')) return '📝'
      if (title?.toLowerCase().includes('.pptx')) return '📊'
      return '📄'
    }

    const getFileSize = (content) => {
      const size = Math.max(1, (content || '').length / 70000)
      return `${size.toFixed(1)} MB`
    }

    const handleBookmark = () => {
      onToggleSave()
    }

    const handleDownload = () => {
      // Create a blob with the document content
      const blob = new Blob([a.content || ''], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = a.title || 'document.txt'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }

    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: a.title || 'Document',
            text: a.content?.substring(0, 200) || '',
            url: window.location.href
          })
        } catch (err) {
          console.log('Error sharing:', err)
        }
      } else {
        // Fallback: copy to clipboard
        const shareText = `${a.title || 'Document'}\n\n${a.content?.substring(0, 200) || ''}\n\n${window.location.href}`
        try {
          await navigator.clipboard.writeText(shareText)
          alert('Document link copied to clipboard!')
        } catch (err) {
          console.log('Error copying to clipboard:', err)
        }
      }
    }

    if (viewMode === 'list') {
      return (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            {getFileIcon(a.title)}
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/articles/${a.id}`} className="font-semibold text-gray-900 hover:underline block truncate">
              {a.title || 'Untitled'}
            </Link>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <span>{getFileSize(a.content)}</span>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            {a.tags?.length ? (
              <div className="flex gap-1 flex-wrap mt-2">
                {a.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link 
              to={`/articles/${a.id}`} 
              className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {t.view}
            </Link>
            <button 
              onClick={handleBookmark} 
              className={`p-1.5 rounded border ${saved ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Bookmark document"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button 
              onClick={handleDownload}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded border"
              title="Download document"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button 
              onClick={handleShare}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded border"
              title="Share document"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              {getFileIcon(a.title)}
            </div>
            <div>
              <Link to={`/articles/${a.id}`} className="font-semibold text-gray-900 hover:underline">
                {a.title || 'Untitled'}
              </Link>
              <div className="text-xs text-gray-500">{getFileSize(a.content)}</div>
            </div>
          </div>
        </div>
        <p className="text-gray-700 text-sm mb-3 line-clamp-3">{a.content?.slice(0,240)}</p>
        {a.tags?.length ? (
          <div className="flex gap-2 flex-wrap mb-4">
            {a.tags.slice(0,4).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Link 
            to={`/articles/${a.id}`} 
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {t.view}
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBookmark} 
              className={`p-2 rounded-lg border ${saved ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Bookmark document"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button 
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg border"
              title="Download document"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button 
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg border"
              title="Share document"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarCollapsed ? 'w-16' : 'w-64'} h-screen shadow-lg lg:shadow-none flex-shrink-0`}>
        <div className={`border-b border-gray-200 ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
                <p className="text-xs text-gray-500">AI-Powered Summarization</p>
              </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
            <button 
              onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Close sidebar"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </div>
          </div>
        </div>
        
        {/* Main flex container for navigation content */}
        <div className="flex-1 flex flex-col">
          {/* Navigation Section */}
          <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="space-y-6">
            <div>
              {!sidebarCollapsed && (
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Menu</h3>
              )}
              <ul className="space-y-1">
            <li>
              <button 
                onClick={() => handleNavigation('/dashboard')}
                    className={`w-full flex items-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                      sidebarCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2.5'
                    }`}
                    title={sidebarCollapsed ? t.dashboard : ''}
                  >
                    <svg className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {!sidebarCollapsed && t.dashboard}
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigation('/history')}
                    className={`w-full flex items-center rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors ${
                      sidebarCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2.5'
                    }`}
                    title={sidebarCollapsed ? t.history : ''}
                  >
                    <svg className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {!sidebarCollapsed && t.history}
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigation('/search')}
                    className={`w-full flex items-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                      sidebarCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2.5'
                    }`}
                    title={sidebarCollapsed ? t.searchExplore : ''}
                  >
                    <svg className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {!sidebarCollapsed && t.searchExplore}
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigation('/saved')}
                    className={`w-full flex items-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                      sidebarCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2.5'
                    }`}
                    title={sidebarCollapsed ? t.savedSummaries : ''}
                  >
                    <svg className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {!sidebarCollapsed && t.savedSummaries}
              </button>
            </li>
          </ul>
            </div>
            
            <div>
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Help & Settings</h3>
              )}
              <ul className="space-y-1">
            <li>
              <button 
                onClick={() => handleNavigation('/support')}
                    className={`w-full flex items-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                      sidebarCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2.5'
                    }`}
                    title={sidebarCollapsed ? t.support : ''}
                  >
                    <svg className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {!sidebarCollapsed && t.support}
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleNavigation('/settings')}
                    className={`w-full flex items-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
                      sidebarCollapsed ? 'justify-center p-2' : 'text-left px-3 py-2.5'
                    }`}
                    title={sidebarCollapsed ? t.settings : ''}
                  >
                    <svg className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                    {!sidebarCollapsed && t.settings}
              </button>
            </li>
          </ul>
            </div>
          </div>
        </div>
        
        {/* AI Processing Section - Positioned at the very bottom with mt-auto */}
        <div className={`mt-auto bg-purple-50 border-t border-gray-200 ${sidebarCollapsed ? 'p-2' : 'p-4'} flex-shrink-0`}>
          <div className="flex items-center">
            <div className={`bg-purple-600 rounded-lg flex items-center justify-center text-white ${
            sidebarCollapsed ? 'w-8 h-8' : 'w-8 h-8 mr-3'
          }`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="text-sm font-medium text-purple-900">AI Processing</p>
                <p className="text-xs text-purple-600">Enhanced summarization with GPT-4</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <button 
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setSidebarCollapsed(!sidebarCollapsed)
                  } else {
                    setSidebarOpen(!sidebarOpen)
                  }
                }}
                className="mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
                aria-label="Toggle sidebar"
                title={window.innerWidth >= 1024 ? (sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar') : 'Toggle sidebar'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-gray-900">InstaBrief</h1>
                <p className="text-xs text-gray-500">AI-Powered Summarization</p>
                <p className="text-xs text-purple-500">Lang: {selectedLanguage}</p>
              </div>
              <div className="ml-4 md:ml-8 flex-1 max-w-md">
                <div className="relative">
                  <input 
                    value={q} 
                    onChange={e => setQ(e.target.value)} 
                    placeholder={t.searchPlaceholder} 
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
              </div>
              <div className="flex items-center ml-4">
                <button onClick={load} className="px-3 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700">{t.search}</button>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden md:flex items-center text-gray-600">
                <span className="mr-2">🌐</span>
                <select 
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="bg-transparent border-none text-gray-600 focus:outline-none cursor-pointer"
                >
                  <option value="en">🇺🇸 English (US)</option>
                  <option value="en-gb">🇬🇧 English (UK)</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="it">🇮🇹 Italiano</option>
                  <option value="pt">🇵🇹 Português</option>
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="ja">🇯🇵 日本語</option>
                  <option value="ko">🇰🇷 한국어</option>
                  <option value="zh">🇨🇳 中文</option>
                  <option value="hi">🇮🇳 हिन्दी</option>
                  <option value="ar">🇸🇦 العربية</option>
                </select>
              </div>
              <button onClick={() => handleNavigation('/support')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">❓</button>
              <ProfileDropdown user={user} getUserInitials={getUserInitials} />
            </div>
          </div>
          {/* Mobile search controls */}
          <div className="lg:hidden mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={semantic} onChange={e => setSemantic(e.target.checked)} /> 
                {t.semantic}
              </label>
              <div className="flex items-center text-gray-600">
                <span className="mr-2">🌐</span>
                <select 
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="bg-transparent border-none text-gray-600 focus:outline-none cursor-pointer text-sm"
                >
                  <option value="en">🇺🇸 EN</option>
                  <option value="en-gb">🇬🇧 EN-GB</option>
                  <option value="es">🇪🇸 ES</option>
                  <option value="fr">🇫🇷 FR</option>
                  <option value="de">🇩🇪 DE</option>
                  <option value="it">🇮🇹 IT</option>
                  <option value="pt">🇵🇹 PT</option>
                  <option value="ru">🇷🇺 RU</option>
                  <option value="ja">🇯🇵 JA</option>
                  <option value="ko">🇰🇷 KO</option>
                  <option value="zh">🇨🇳 ZH</option>
                  <option value="hi">🇮🇳 HI</option>
                  <option value="ar">🇸🇦 AR</option>
                </select>
              </div>
            </div>
            <button onClick={load} className="px-3 py-2 border rounded">{t.search}</button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t.documentHistory}</h2>
            <p className="text-gray-600 dark:text-gray-300">
              {searchQuery ? (
                <>
                  Search results for "{searchQuery}" ({filteredItems.length} found)
                  <span className="ml-2 text-xs text-gray-500">Press Esc to clear</span>
                </>
              ) : type !== 'all' || sort !== 'date' ? (
                <>
                  Showing {type !== 'all' ? type.toUpperCase() : 'all'} documents
                  {sort !== 'date' && ` sorted by ${sort}`}
                  ({filteredItems.length} found)
                </>
              ) : (
                t.manageDocuments
              )}
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 mb-5">
            <div className="flex-1 relative">
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                placeholder={t.searchPlaceholder} 
                className="w-full px-4 py-2 pl-10 pr-10 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  title="Clear search (Esc)"
                >
                  ✕
                </button>
              )}
            </div>
            <select value={type} onChange={e => setType(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="all">{t.allTypes}</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="pptx">PPTX</option>
              <option value="txt">TXT</option>
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="date">{t.date}</option>
              <option value="title">Title</option>
            </select>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                title="Grid view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            <button 
              onClick={handleSearch} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t.search}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3 mb-4 text-sm">
            <button 
              onClick={() => setSavedOnly(false)} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !savedOnly ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t.allDocuments} ({filteredItems.length})
            </button>
            <button 
              onClick={() => setSavedOnly(true)} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                savedOnly ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t.saved} ({savedCount})
            </button>
            {savedOnly && (
              <button 
                onClick={() => setSavedOnly(false)} 
                className="text-purple-600 underline hover:text-purple-700"
              >
                {t.showAll}
              </button>
            )}
          </div>

          {/* Document Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : visible.length > 0 ? (
              visible.map(a => (
                <DocCard 
                  key={a.id} 
                  a={a} 
                  saved={bookmarkedItems.has(a.id)} 
                  onToggleSave={() => toggleBookmark(a.id)}
                  viewMode={viewMode}
                />
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'No results found' : 'No documents found'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? `No documents match your search for "${searchQuery}". Try a different search term.`
                      : 'Start by uploading your first document to see it appear here.'
                    }
                  </p>
                  {searchQuery ? (
                    <button 
                      onClick={clearSearch}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Document
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
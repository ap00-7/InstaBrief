import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { initializeTheme } from '../lib/theme'
import ProfileDropdown from '../components/ProfileDropdown'

export default function Search() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All categories')
  const [selectedFileType, setSelectedFileType] = useState('All types')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const navigate = useNavigate()

  // Language translations
  const translations = {
    en: {
      searchPlaceholder: "Search documents, summaries, or tags...",
      search: "Search",
      dashboard: "Dashboard",
      history: "History",
      searchExplore: "Search & Explore",
      savedSummaries: "Saved Summaries",
      support: "Support",
      settings: "Settings",
      aiProcessing: "AI Processing",
      enhancedSummarization: "Enhanced summarization with GPT-4",
      searchAndExplore: "Search & Explore",
      findDocuments: "Find documents, summaries, and insights across your knowledge base",
      searchForDocuments: "Search for documents, content, tags, or specific topics...",
      filters: "Filters",
      categories: "Categories",
      businessReports: "Business Reports",
      marketingMaterials: "Marketing Materials",
      technicalDocs: "Technical Docs",
      researchPapers: "Research Papers",
      popularTags: "Popular Tags",
      searchResults: "Search Results",
      documentsFound: "documents found",
      relevance: "Relevance",
      viewDocument: "View Document"
    },
    es: {
      searchPlaceholder: "Buscar documentos, resúmenes o etiquetas...",
      search: "Buscar",
      dashboard: "Panel",
      history: "Historial",
      searchExplore: "Buscar y Explorar",
      savedSummaries: "Resúmenes Guardados",
      support: "Soporte",
      settings: "Configuración",
      aiProcessing: "Procesamiento IA",
      enhancedSummarization: "Resumización mejorada con GPT-4",
      searchAndExplore: "Buscar y Explorar",
      findDocuments: "Encuentra documentos, resúmenes e información en tu base de conocimiento",
      searchForDocuments: "Buscar documentos, contenido, etiquetas o temas específicos...",
      filters: "Filtros",
      categories: "Categorías",
      businessReports: "Informes de Negocio",
      marketingMaterials: "Materiales de Marketing",
      technicalDocs: "Documentos Técnicos",
      researchPapers: "Documentos de Investigación",
      popularTags: "Etiquetas Populares",
      searchResults: "Resultados de Búsqueda",
      documentsFound: "documentos encontrados",
      relevance: "Relevancia",
      viewDocument: "Ver Documento"
    },
    fr: {
      searchPlaceholder: "Rechercher des documents, résumés ou étiquettes...",
      search: "Rechercher",
      dashboard: "Tableau de bord",
      history: "Historique",
      searchExplore: "Rechercher et Explorer",
      savedSummaries: "Résumés Sauvegardés",
      support: "Support",
      settings: "Paramètres",
      aiProcessing: "Traitement IA",
      enhancedSummarization: "Résumé amélioré avec GPT-4",
      searchAndExplore: "Rechercher et Explorer",
      findDocuments: "Trouvez des documents, résumés et informations dans votre base de connaissances",
      searchForDocuments: "Rechercher des documents, contenu, étiquettes ou sujets spécifiques...",
      filters: "Filtres",
      categories: "Catégories",
      businessReports: "Rapports d'Entreprise",
      marketingMaterials: "Matériaux Marketing",
      technicalDocs: "Documents Techniques",
      researchPapers: "Documents de Recherche",
      popularTags: "Étiquettes Populaires",
      searchResults: "Résultats de Recherche",
      documentsFound: "documents trouvés",
      relevance: "Pertinence",
      viewDocument: "Voir le Document"
    }
  }

  const t = translations[selectedLanguage] || translations.en

  // Dynamic categories and tags state
  const [categories, setCategories] = useState([])
  const [popularTags, setPopularTags] = useState([])

  async function load() {
    console.log('Search function called with query:', q)
    setLoading(true)
    try {
      const hasQuery = Boolean(q && q.trim())
      let apiResults = []
      
      // Get results from API only - use same endpoint as History page
      if (!hasQuery) {
        console.log('Loading all articles...')
        try {
          // Try user-specific articles first, then fallback to general articles
          const response = await api.get('/users/me/articles')
          apiResults = Array.isArray(response.data) ? response.data : []
          console.log('User articles response:', response.data)
        } catch (e) {
          try {
            const response = await api.get('/articles', { params: { limit: 50 } })
            apiResults = Array.isArray(response.data) ? response.data : []
            console.log('General articles response:', response.data)
          } catch (e2) {
            console.log('API not available or no articles found', e2)
            apiResults = []
          }
        }
      } else {
        const params = { limit: 50, q: q.trim() }
        console.log('Searching with params:', params)
        try {
          // Try user-specific search first
          const response = await api.get('/users/me/articles', { params })
          apiResults = Array.isArray(response.data) ? response.data : []
          console.log('User search response:', response.data)
        } catch (e) {
          try {
            const response = await api.get('/articles', { params })
            apiResults = Array.isArray(response.data) ? response.data : []
            console.log('General search response:', response.data)
          } catch (e2) {
            console.log('API search failed', e2)
            apiResults = []
          }
        }
      }
      
      // Also search in localStorage recent activity if we have a query
      let localResults = []
      if (hasQuery) {
        const recentActivity = JSON.parse(localStorage.getItem('recentActivity') || '[]')
        const searchTerm = q.trim().toLowerCase()
        localResults = recentActivity.filter(item => 
          (item.title && item.title.toLowerCase().includes(searchTerm)) ||
          (item.content && item.content.toLowerCase().includes(searchTerm)) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        ).map(item => ({
          ...item,
          id: item.id || `local_${Date.now()}_${Math.random()}`,
          source: 'local'
        }))
      }
      
      // If no API results and no query, try to use recent activity as fallback
      if (apiResults.length === 0 && !hasQuery) {
        const recentActivity = JSON.parse(localStorage.getItem('recentActivity') || '[]')
        apiResults = recentActivity.map(item => ({
          ...item,
          id: item.id || `local_${Date.now()}_${Math.random()}`,
          source: 'local'
        }))
        console.log('Using recent activity as fallback:', apiResults.length, 'items')
      }

      // Combine results - prioritize API results, then local search results
      let combinedResults = [...apiResults, ...localResults]
      
      console.log('API results:', apiResults.length, 'Local results:', localResults.length)
      console.log('Combined results:', combinedResults)
      console.log('Sample API result:', apiResults[0]) // Debug: see data structure
      setItems(combinedResults)
      
      // Update categories and tags based on actual data
      updateCategoriesAndTags(combinedResults)
      
    } catch (e) {
      console.error('Failed to load articles', e)
      setItems([]) // Show empty state instead of sample data
    } finally {
      setLoading(false)
    }
  }

  // Function to dynamically generate categories and tags from actual data
  function updateCategoriesAndTags(data) {
    if (!data || data.length === 0) {
      setCategories([])
      setPopularTags([])
      return
    }

    // Generate categories based on content analysis and tags
    const categoryCount = {}
    const tagCount = {}
    
    data.forEach(item => {
      // Determine category based on content and tags
      const category = determineCategory(item)
      categoryCount[category] = (categoryCount[category] || 0) + 1
      
      // Count tags
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })

    // Create categories from analysis
    const dynamicCategories = Object.entries(categoryCount).map(([category, count]) => ({
      name: category,
      count,
      type: category.toLowerCase().replace(/\s+/g, '_')
    }))

    // Get most popular tags (top 10)
    const dynamicTags = Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ name: tag, count }))

    setCategories(dynamicCategories)
    setPopularTags(dynamicTags)
  }

  // Function to determine category based on content and tags
  function determineCategory(item) {
    const title = (item.title || '').toLowerCase()
    const content = (item.content || '').toLowerCase()
    const tags = (item.tags || []).map(tag => tag.toLowerCase())
    
    // First, check filename patterns for strong indicators
    if (title.includes('manual') || title.includes('guide') || title.includes('documentation')) {
      return 'Technical Docs'
    }
    if (title.includes('resume') || title.includes('cv')) {
      return 'Other Documents'
    }
    if (title.includes('application') || title.includes('form')) {
      return 'Other Documents'
    }
    if (title.includes('invoice') || title.includes('bill') || title.includes('receipt')) {
      return 'Other Documents'
    }
    if (title.includes('contract') || title.includes('agreement')) {
      return 'Other Documents'
    }
    if (title.includes('presentation') || title.includes('ppt') || title.includes('slides')) {
      return 'Other Documents'
    }
    
    // Technical indicators in filename
    if (title.includes('computing') || title.includes('parallel') || title.includes('algorithm') || 
        title.includes('programming') || title.includes('code') || title.includes('software') ||
        title.includes('technical') || title.includes('system') || title.includes('wiki')) {
      return 'Technical Docs'
    }
    
    // Question bank or educational content
    if (title.includes('question') && title.includes('bank') || 
        title.includes('quiz') || title.includes('exam') || title.includes('test')) {
      return 'Research Papers'
    }

    // Define category keywords with more specific and weighted terms
    const categoryKeywords = {
      'Technical Docs': {
        high: ['programming', 'code', 'software', 'api', 'framework', 'algorithm', 'technical', 'computing', 'system', 'database'],
        medium: ['development', 'javascript', 'python', 'react', 'vue', 'angular', 'sql', 'web development', 'frontend', 'backend'],
        low: ['technology', 'digital', 'computer']
      },
      'Business Reports': {
        high: ['quarterly report', 'annual report', 'financial report', 'business report', 'revenue', 'profit', 'sales report'],
        medium: ['market analysis', 'business strategy', 'kpi', 'metrics', 'budget', 'forecast', 'financial'],
        low: ['business', 'market', 'performance', 'analysis']
      },
      'Research Papers': {
        high: ['research paper', 'academic paper', 'journal', 'publication', 'peer review', 'hypothesis', 'methodology'],
        medium: ['research', 'study', 'experiment', 'findings', 'conclusion', 'statistics', 'academic'],
        low: ['data', 'analysis', 'results']
      },
      'Marketing Materials': {
        high: ['marketing campaign', 'brand strategy', 'digital marketing', 'content marketing', 'social media marketing'],
        medium: ['marketing', 'campaign', 'brand', 'advertising', 'promotion', 'customer', 'audience'],
        low: ['engagement', 'conversion', 'lead']
      },
      'AI & Machine Learning': {
        high: ['machine learning', 'artificial intelligence', 'deep learning', 'neural network', 'data science'],
        medium: ['ai', 'ml', 'model', 'training', 'prediction', 'classification', 'regression'],
        low: ['nlp', 'computer vision', 'algorithm']
      },
      'Cloud & Infrastructure': {
        high: ['cloud computing', 'aws', 'azure', 'google cloud', 'kubernetes', 'docker'],
        medium: ['cloud', 'infrastructure', 'server', 'deployment', 'devops', 'microservices'],
        low: ['scalability', 'architecture']
      }
    }

    // Score each category based on weighted keyword matches
    let bestCategory = 'Other Documents'
    let maxScore = 0

    for (const [category, keywordLevels] of Object.entries(categoryKeywords)) {
      let score = 0
      
      // Check high-priority keywords (weight: 10)
      keywordLevels.high.forEach(keyword => {
        if (title.includes(keyword)) score += 30
        else if (tags.some(tag => tag.includes(keyword))) score += 20
        else if (content.includes(keyword)) score += 10
      })
      
      // Check medium-priority keywords (weight: 5)
      keywordLevels.medium.forEach(keyword => {
        if (title.includes(keyword)) score += 15
        else if (tags.some(tag => tag.includes(keyword))) score += 10
        else if (content.includes(keyword)) score += 5
      })
      
      // Check low-priority keywords (weight: 2)
      keywordLevels.low.forEach(keyword => {
        if (title.includes(keyword)) score += 6
        else if (tags.some(tag => tag.includes(keyword))) score += 4
        else if (content.includes(keyword)) score += 2
      })

      if (score > maxScore) {
        maxScore = score
        bestCategory = category
      }
    }

    // Require minimum score to avoid false categorization
    if (maxScore < 5) {
      bestCategory = 'Other Documents'
    }

    return bestCategory
  }

  // Function to generate meaningful description from available data
  function generateDescription(item) {
    // Try to use existing content first
    if (item.content && item.content.trim()) {
      const content = item.content.trim()
      // Clean up the content - remove excessive whitespace and format nicely
      const cleanContent = content.replace(/\s+/g, ' ').slice(0, 180)
      return cleanContent + (content.length > 180 ? '...' : '')
    }

    // Generate description from filename and metadata
    const title = item.title || 'Document'
    const category = determineCategory(item)
    const tags = item.tags || []
    
    let description = ''
    
    // Analyze filename to extract meaningful info
    const filename = title.toLowerCase()
    
    if (filename.includes('resume') || filename.includes('cv')) {
      description = 'Professional resume document containing career information, skills, and experience details'
    } else if (filename.includes('application') || filename.includes('form')) {
      description = 'Application form document for submission and processing of requests or applications'
    } else if (filename.includes('report')) {
      description = 'Comprehensive report document containing analysis, findings, and recommendations'
    } else if (filename.includes('invoice') || filename.includes('bill')) {
      description = 'Financial document containing billing information and payment details'
    } else if (filename.includes('contract') || filename.includes('agreement')) {
      description = 'Legal contract or agreement document outlining terms and conditions'
    } else if (filename.includes('presentation') || filename.includes('ppt')) {
      description = 'Presentation document with slides and visual content for meetings or training'
    } else if (filename.includes('manual') || filename.includes('guide')) {
      description = 'Instructional manual or guide document providing step-by-step information'
    } else if (filename.includes('policy') || filename.includes('procedure')) {
      description = 'Policy or procedure document outlining organizational guidelines and processes'
    } else if (filename.includes('specification') || filename.includes('spec')) {
      description = 'Technical specification document detailing requirements and implementation guidelines'
    } else if (filename.includes('proposal')) {
      description = 'Business proposal document outlining project plans, objectives, and recommendations'
    } else {
      // Generate description based on category and tags
      if (category === 'Technical Docs') {
        description = 'Technical documentation containing specifications, guidelines, or implementation details'
      } else if (category === 'Business Reports') {
        description = 'Business document containing analytical information, metrics, or strategic insights'
      } else if (category === 'Research Papers') {
        description = 'Research document containing academic or scientific findings and analysis'
      } else if (category === 'Marketing Materials') {
        description = 'Marketing document designed for promotional activities and customer engagement'
      } else if (category === 'AI & Machine Learning') {
        description = 'Document related to artificial intelligence, machine learning concepts, or data science'
      } else if (category === 'Cloud & Infrastructure') {
        description = 'Document covering cloud computing, infrastructure, or system architecture topics'
      } else {
        description = 'Document containing important information and data for reference or processing'
      }
    }
    
    // Add tag information if available and space permits
    if (tags.length > 0 && description.length < 120) {
      const tagList = tags.slice(0, 3).join(', ')
      description += `. Topics: ${tagList}`
    }
    
    // Ensure proper ending
    if (!description.endsWith('.')) {
      description += '.'
    }
    
    return description
  }

  // Function to calculate relevance score based on search query
  function calculateRelevance(item, searchQuery) {
    if (!searchQuery || !searchQuery.trim()) return null
    
    const query = searchQuery.toLowerCase().trim()
    const title = (item.title || '').toLowerCase()
    const content = (item.content || '').toLowerCase()
    const tags = (item.tags || []).map(tag => tag.toLowerCase())
    
    // Check for exact matches first - these should get 100% relevance
    if (title === query) {
      return 100
    }
    
    // Check if any tag is an exact match
    if (tags.some(tag => tag === query)) {
      return 100
    }
    
    // Check for very high similarity (like filename variations)
    const titleSimilarity = calculateStringSimilarity(title, query)
    if (titleSimilarity > 0.9) {
      return Math.round(90 + (titleSimilarity - 0.9) * 100) // 90-100% for very similar
    }
    
    let score = 0
    
    // Title matches get highest score
    if (title.includes(query)) {
      const matchRatio = query.length / title.length
      score += Math.round(50 * matchRatio) // Up to 50 points based on how much of title matches
      
      // Bonus for query being a significant part of the title
      if (matchRatio > 0.5) score += 20
    }
    
    // Tag matches get high score
    tags.forEach(tag => {
      if (tag.includes(query)) {
        const matchRatio = query.length / tag.length
        score += Math.round(25 * matchRatio) // Up to 25 points per tag
      }
    })
    
    // Content matches get moderate score
    const contentMatches = (content.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    score += Math.min(contentMatches * 3, 20) // Cap at 20 points for content
    
    // Normalize to percentage
    return Math.min(Math.round(score), 100)
  }

  // Helper function to calculate string similarity
  function calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = getEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  // Helper function to calculate edit distance (Levenshtein distance)
  function getEditDistance(str1, str2) {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Function to filter and sort items based on selected filters
  function getFilteredAndSortedItems() {
    let filteredItems = [...items]
    const hasSearchQuery = Boolean(q && q.trim())

    // Calculate relevance scores if there's a search query
    if (hasSearchQuery) {
      filteredItems = filteredItems.map(item => ({
        ...item,
        calculatedRelevance: calculateRelevance(item, q)
      }))
      
      // Filter out items with 0 relevance when searching
      filteredItems = filteredItems.filter(item => item.calculatedRelevance > 0)
    }

    // Apply category filter
    if (selectedCategory !== 'All categories') {
      filteredItems = filteredItems.filter(item => {
        const category = determineCategory(item)
        return category === selectedCategory
      })
    }

    // Apply file type filter (same as category for now)
    if (selectedFileType !== 'All types') {
      filteredItems = filteredItems.filter(item => {
        const category = determineCategory(item)
        return category === selectedFileType
      })
    }

    // Apply tags filter
    if (selectedTags.length > 0) {
      filteredItems = filteredItems.filter(item => {
        return selectedTags.some(tag => 
          item.tags && item.tags.some(itemTag => 
            itemTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      })
    }

    // Apply date filter
    if (selectedDate) {
      filteredItems = filteredItems.filter(item => {
        const itemDate = item.date || item.created_at
        if (!itemDate) return false
        
        try {
          // Parse the item date
          const itemDateObj = new Date(itemDate)
          const selectedDateObj = new Date(selectedDate)
          
          // Ensure both dates are valid
          if (isNaN(itemDateObj.getTime()) || isNaN(selectedDateObj.getTime())) {
            return false
          }
          
          // Compare dates (same day) - normalize to remove time component
          const itemDateStr = itemDateObj.toISOString().split('T')[0]
          const selectedDateStr = selectedDateObj.toISOString().split('T')[0]
          
          return itemDateStr === selectedDateStr
        } catch (error) {
          console.warn('Date parsing error:', error, 'Item date:', itemDate)
          return false
        }
      })
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          if (hasSearchQuery) {
            const scoreA = a.calculatedRelevance || 0
            const scoreB = b.calculatedRelevance || 0
            return scoreB - scoreA // Higher relevance first
          } else {
            // When no search query, sort by date instead
            const dateA = new Date(a.date || Date.now())
            const dateB = new Date(b.date || Date.now())
            return dateB - dateA
          }
        case 'date':
          const dateA = new Date(a.date || Date.now())
          const dateB = new Date(b.date || Date.now())
          return dateB - dateA // Newer first
        case 'title':
          const titleA = (a.title || '').toLowerCase()
          const titleB = (b.title || '').toLowerCase()
          return titleA.localeCompare(titleB) // Alphabetical
        default:
          return 0
      }
    })

    return filteredItems
  }

  async function loadUser() {
    try {
      const { data } = await api.get('/users/me')
      setUser(data)
    } catch (e) {
      console.error('Failed to load user', e)
    }
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

    // Initialize sidebar state based on screen size
    const initializeSidebar = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true)
        setSidebarCollapsed(false)
      } else {
        setSidebarOpen(false)
        setSidebarCollapsed(false)
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

  // Trigger re-render when filters change
  useEffect(() => {
    // This will cause a re-render when filter states change
  }, [selectedCategory, selectedFileType, selectedTags, selectedDate, sortBy])


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

  function getDocumentIcon(item) {
    // Determine category for this item
    const category = determineCategory(item)
    
    switch (category) {
      case 'Technical Docs':
        return { icon: '🛠️', bgColor: 'bg-blue-100', textColor: 'text-blue-600' }
      case 'Business Reports':
        return { icon: '📊', bgColor: 'bg-green-100', textColor: 'text-green-600' }
      case 'Research Papers':
        return { icon: '📚', bgColor: 'bg-purple-100', textColor: 'text-purple-600' }
      case 'Marketing Materials':
        return { icon: '📈', bgColor: 'bg-orange-100', textColor: 'text-orange-600' }
      case 'AI & Machine Learning':
        return { icon: '🤖', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' }
      case 'Cloud & Infrastructure':
        return { icon: '☁️', bgColor: 'bg-sky-100', textColor: 'text-sky-600' }
      default:
        return { icon: '📄', bgColor: 'bg-gray-100', textColor: 'text-gray-600' }
    }
  }

  function ResultRow({ a, score, hasSearchQuery = false }) {
    const docIcon = getDocumentIcon(a)
    const displayScore = score || a.relevance || 0
    const displayDate = a.date || new Date().toLocaleDateString()
    
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 ${docIcon.bgColor} ${docIcon.textColor} rounded-lg flex items-center justify-center text-lg`}>
              {docIcon.icon}
            </div>
            <div className="flex-1">
              <Link to={`/articles/${a.id}`} className="font-semibold text-indigo-600 hover:underline text-base">
                {a.title || 'Untitled'}
              </Link>
              <div className="text-xs text-gray-500 mt-1">
                {displayDate}{hasSearchQuery ? ` · ${t.relevance}: ${displayScore}%` : ''}
              </div>
            </div>
          </div>
          <p className="text-gray-700 text-sm mb-3 line-clamp-2 leading-relaxed">
            {generateDescription(a)}
          </p>
          {a.tags?.length ? (
            <div className="flex gap-2 flex-wrap">
              {a.tags.slice(0,4).map(tag => (
                <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-3">
          {hasSearchQuery && (
            <span className="text-xs text-gray-600 px-3 py-1 rounded-full bg-gray-100 font-medium">
              {displayScore}% match
            </span>
          )}
          <Link 
            to={`/articles/${a.id}`} 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t.viewDocument}
          </Link>
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
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
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
                    className={`w-full flex items-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
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
                    className={`w-full flex items-center rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors ${
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {!sidebarCollapsed && t.settings}
                  </button>
                </li>
              </ul>
            </div>
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
              </div>
              <div className="ml-4 md:ml-8 flex-1 max-w-md">
                <div className="relative flex">
                  <input 
                    value={q} 
                    onChange={e => setQ(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && load()}
                    placeholder={t.searchPlaceholder} 
                    className="flex-1 px-4 py-2 pl-10 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  <button 
                    onClick={load} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg border border-blue-600 transition-colors"
                  >
                    {t.search}
                  </button>
                </div>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.searchAndExplore}</h2>
            <p className="text-gray-600 dark:text-gray-300">{t.findDocuments}</p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && load()}
                placeholder={t.searchForDocuments} 
                className="w-full px-4 py-3 pl-10 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
              />
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${showFilters ? 'bg-gray-100' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {t.filters}
            </button>
            <button 
              onClick={load} 
              className="px-5 py-2 rounded-lg text-white" 
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              {t.search}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="All categories">All categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* File Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File Type</label>
                  <select 
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="All types">All types</option>
                    <option value="Technical Docs">Technical Docs</option>
                    <option value="Business Reports">Business Reports</option>
                    <option value="Research Papers">Research Papers</option>
                    <option value="Marketing Materials">Marketing Materials</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Select date"
                  />
                </div>

              </div>

              {/* Tags Filter */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 10).map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (selectedTags.includes(tag.name)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag.name))
                        } else {
                          setSelectedTags([...selectedTags, tag.name])
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        selectedTags.includes(tag.name)
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag.name} ({tag.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCategory('All categories')
                    setSelectedFileType('All types')
                    setSelectedTags([])
                    setSelectedDate('')
                    setSemantic(false)
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories + Popular Tags */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-3">{t.categories}</h3>
                {categories.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {categories.map((category, index) => {
                      const icons = {
                        'Business Reports': '📊',
                        'Marketing Materials': '📈', 
                        'Technical Docs': '🛠️',
                        'Research Papers': '📚',
                        'AI & Machine Learning': '🤖',
                        'Cloud & Infrastructure': '☁️',
                        'Other Documents': '📄'
                      }
                      return (
                        <li key={index} className="flex items-center justify-between">
                          <span>{icons[category.name] || '📄'} {category.name}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{category.count}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No categories available. Upload documents to see categories.</p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-3">{t.popularTags}</h3>
                {popularTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {popularTags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 rounded-full">
                        {tag.name} ({tag.count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No tags available. Upload documents with tags to see popular tags.</p>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t.searchResults}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span>{getFilteredAndSortedItems().length} {t.documentsFound}</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border rounded px-3 py-1.5"
                  >
                    <option value="relevance">{t.relevance}</option>
                    <option value="date">Date</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : (() => {
                const filteredItems = getFilteredAndSortedItems()
                const hasSearchQuery = Boolean(q && q.trim())
                return filteredItems.length > 0 ? (
                  filteredItems.map((a, i) => (
                    <ResultRow 
                      key={a.id} 
                      a={a} 
                      score={hasSearchQuery ? a.calculatedRelevance : null} 
                      hasSearchQuery={hasSearchQuery} 
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">No results found</div>
                    <p className="text-sm text-gray-400">Try adjusting your search terms or filters</p>
                  </div>
                )
              })()}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
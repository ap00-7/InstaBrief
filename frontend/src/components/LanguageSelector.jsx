import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange, 
  showNativeNames = true,
  compact = false,
  className = "" 
}) {
  const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadSupportedLanguages()
  }, [])

  const loadSupportedLanguages = async () => {
    try {
      setLoading(true)
      const response = await api.get('/documents/languages')
      
      if (response.data.status === 'success') {
        setLanguages(response.data.data.languages || [])
      } else {
        // Fallback to basic language list
        setLanguages([
          { code: 'en', name: 'English', native: 'English' },
          { code: 'es', name: 'Spanish', native: 'Español' },
          { code: 'fr', name: 'French', native: 'Français' },
          { code: 'de', name: 'German', native: 'Deutsch' },
          { code: 'it', name: 'Italian', native: 'Italiano' },
          { code: 'pt', name: 'Portuguese', native: 'Português' },
          { code: 'ru', name: 'Russian', native: 'Русский' },
          { code: 'zh', name: 'Chinese', native: '中文' },
          { code: 'ja', name: 'Japanese', native: '日本語' },
          { code: 'ko', name: 'Korean', native: '한국어' },
          { code: 'ar', name: 'Arabic', native: 'العربية' },
          { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
        ])
      }
    } catch (err) {
      console.error('Failed to load languages:', err)
      setError('Failed to load languages')
      // Fallback to minimal language list
      setLanguages([
        { code: 'en', name: 'English', native: 'English' },
        { code: 'es', name: 'Spanish', native: 'Español' },
        { code: 'fr', name: 'French', native: 'Français' },
        { code: 'de', name: 'German', native: 'Deutsch' },
        { code: 'it', name: 'Italian', native: 'Italiano' },
        { code: 'pt', name: 'Portuguese', native: 'Português' },
        { code: 'ru', name: 'Russian', native: 'Русский' },
        { code: 'zh', name: 'Chinese', native: '中文' },
        { code: 'ja', name: 'Japanese', native: '日本語' },
        { code: 'ko', name: 'Korean', native: '한국어' },
        { code: 'ar', name: 'Arabic', native: 'العربية' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedLang = languages.find(lang => lang.code === selectedLanguage)

  const handleLanguageSelect = (langCode) => {
    onLanguageChange(langCode)
    setShowDropdown(false)
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (compact) {
    return (
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className={`border border-gray-300 rounded px-2 py-1 text-sm bg-white ${className}`}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {showNativeNames ? `${lang.name} (${lang.native})` : lang.name}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-4 rounded border border-gray-300 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            {selectedLang?.code.toUpperCase() || 'EN'}
          </div>
          <span className="text-gray-900">
            {selectedLang ? (
              showNativeNames ? (
                <>
                  {selectedLang.name} <span className="text-gray-500">({selectedLang.native})</span>
                </>
              ) : (
                selectedLang.name
              )
            ) : (
              'Select Language'
            )}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                    selectedLanguage === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className={`w-6 h-4 rounded border flex items-center justify-center text-xs font-bold ${
                    selectedLanguage === lang.code 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-300'
                  }`}>
                    {lang.code.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{lang.name}</div>
                    {showNativeNames && lang.native !== lang.name && (
                      <div className="text-sm text-gray-500">{lang.native}</div>
                    )}
                  </div>
                  {selectedLanguage === lang.code && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                No languages found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

// Language categories for organized display
export const LanguageCategories = {
  MAJOR: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'],
  EUROPEAN: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru'],
  ASIAN: ['zh', 'ja', 'ko', 'hi'],
  AFRICAN: [],
  MIDDLE_EASTERN: ['ar'],
  INDIGENOUS: []
}

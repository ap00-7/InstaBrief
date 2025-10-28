import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function LanguageDetector({ 
  text, 
  onLanguageDetected, 
  autoDetect = true,
  showConfidence = true,
  className = "" 
}) {
  const [detectedLanguage, setDetectedLanguage] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [possibleLanguages, setPossibleLanguages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (autoDetect && text && text.trim().length >= 10) {
      detectLanguage(text)
    }
  }, [text, autoDetect])

  const detectLanguage = async (inputText) => {
    if (!inputText || inputText.trim().length < 10) {
      setError('Text too short for reliable detection')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await api.post('/documents/detect-language', {
        text: inputText
      })

      if (response.data.status === 'success') {
        const data = response.data.data
        setDetectedLanguage(data.primary_language)
        setConfidence(data.confidence)
        setPossibleLanguages(data.possible_languages || [])
        
        if (onLanguageDetected) {
          onLanguageDetected({
            language: data.primary_language,
            confidence: data.confidence,
            possibleLanguages: data.possible_languages,
            languageInfo: data.language_info
          })
        }
      } else {
        setError(response.data.message || 'Detection failed')
      }
    } catch (err) {
      console.error('Language detection error:', err)
      setError('Failed to detect language')
    } finally {
      setLoading(false)
    }
  }

  const getLanguageName = (code) => {
    const languageNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi'
    }
    return languageNames[code] || code.toUpperCase()
  }

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-100'
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceLabel = (conf) => {
    if (conf >= 0.8) return 'High'
    if (conf >= 0.6) return 'Medium'
    return 'Low'
  }

  if (!text || text.trim().length < 10) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span>Enter more text for language detection</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {loading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span>Detecting language...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {detectedLanguage && !loading && !error && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="text-gray-700">
              Detected: <span className="font-semibold">{getLanguageName(detectedLanguage)}</span>
            </span>
            {showConfidence && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
                {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
              </span>
            )}
          </div>

          {possibleLanguages.length > 1 && (
            <div className="text-xs text-gray-500">
              <span>Other possibilities: </span>
              {possibleLanguages.slice(1, 4).map((lang, index) => (
                <span key={index}>
                  {getLanguageName(lang[0])} ({Math.round(lang[1] * 100)}%)
                  {index < Math.min(possibleLanguages.length - 2, 2) ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {!autoDetect && (
            <button
              onClick={() => detectLanguage(text)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Detect again
            </button>
          )}
        </div>
      )}

      {!autoDetect && !detectedLanguage && !loading && (
        <button
          onClick={() => detectLanguage(text)}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span>Detect Language</span>
        </button>
      )}
    </div>
  )
}

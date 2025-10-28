import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState('extractive');
  const [isPlaying, setIsPlaying] = useState(false);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handler functions for buttons
  const handleDownloadOriginal = async () => {
    if (!document || document.isMockDocument) {
      alert('Original document not available for demo documents');
      return;
    }
    
    try {
      const response = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.original_filename || document.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document');
    }
  };

  const handleExportPDF = () => {
    // Generate PDF with summary content
    const summaryText = document.summary[selectedSummaryType];
    const content = `
Document: ${document.title}
${document.subtitle}

Summary (${selectedSummaryType}):
${summaryText}

Tags: ${document.tags.join(', ')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.title}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const shareText = `Check out this document summary: ${document.title}\n\n${document.summary[selectedSummaryType]}`;
    
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Summary copied to clipboard!');
      });
    }
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (!document.isMockDocument) {
      try {
        // Try to get audio from API
        const response = await api.get(`/documents/${document.id}/audio`, {
          responseType: 'blob'
        });
        
        const audioBlob = new Blob([response.data], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          // Fallback to speech synthesis
          playWithSpeechSynthesis();
        };
        
        audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        // Fallback to speech synthesis
        playWithSpeechSynthesis();
      }
    } else {
      // Use speech synthesis for mock documents
      playWithSpeechSynthesis();
    }
  };

  const playWithSpeechSynthesis = () => {
    const text = document.summary[selectedSummaryType];
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = 1.3;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    speechSynthesis.speak(utterance);
  };

  // Fetch document data from API or localStorage
  useEffect(() => {
    async function fetchDocument() {
      if (!id) return;
      
      setLoading(true);
      
      try {
        // First try to fetch from API
        const response = await api.get(`/documents/${id}`);
        const doc = response.data;
        
        setDocument({
          id: doc.id,
          title: doc.title,
          subtitle: `Processed on ${new Date(doc.created_at).toLocaleDateString()}`,
          summary: doc.summary,
          tags: doc.tags,
          audioUrl: null,
          content: doc.content,
          file_type: doc.file_type,
          original_filename: doc.original_filename,
          isMockDocument: false
        });
      } catch (error) {
        console.error('Failed to fetch document from API:', error);
        
        // Fallback to localStorage
        const recentActivity = JSON.parse(localStorage.getItem('recentActivity') || '[]');
        const recentDoc = recentActivity.find(item => item.id === id);
        
        if (recentDoc) {
          setDocument({
            id: recentDoc.id,
            title: recentDoc.title || 'Untitled Document',
            subtitle: `Processed on ${new Date(recentDoc.created_at).toLocaleDateString()}`,
            summary: {
              extractive: recentDoc.summary || 'Financial performance analysis showing 15% growth in revenue.',
              abstractive: recentDoc.abstractiveSummary || 'This comprehensive business report provides detailed insights into performance metrics and strategic initiatives.'
            },
            tags: recentDoc.tags || ['Finance', 'Business', 'Q4'],
            audioUrl: null,
            content: `Document content for ${recentDoc.title}`,
            isMockDocument: true
          });
        } else {
          // Final fallback
          setDocument({
            id: id,
            title: 'Q4 Business Report.pdf',
            subtitle: `Processed on ${new Date().toLocaleDateString()}`,
            summary: {
              extractive: 'Financial performance analysis showing 15% growth in revenue. The quarterly report demonstrates strong market positioning and operational efficiency improvements across all business units.',
              abstractive: 'This comprehensive business report provides detailed insights into Q4 performance metrics, strategic initiatives, and future growth opportunities.'
            },
            tags: ['Finance', 'Business', 'Q4'],
            audioUrl: null,
            content: 'This is a sample business document containing quarterly performance analysis and strategic recommendations.',
            isMockDocument: true
          });
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchDocument();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Document should always exist due to fallback logic above
  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="border-b border-gray-200 p-6">
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

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <div className="space-y-1">
              <button onClick={() => navigate('/dashboard')} className="w-full flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </button>
              <button onClick={() => navigate('/history')} className="w-full flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Document History
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate('/dashboard')} className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{document.title}</h1>
                <p className="text-sm text-gray-500">{document.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={handleExportPDF} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm font-medium text-gray-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PDF
              </button>
              <button onClick={handleShare} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Document Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Document Preview</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">{document.title}</h3>
                <p className="text-sm text-gray-500 mb-4">Document preview not available</p>
                <p className="text-xs text-gray-400 mb-6">Original document cannot be displayed here in a production environment</p>
                <button onClick={handleDownloadOriginal} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 inline-flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Original
                </button>
              </div>
            </div>

            {/* Right Column - Summary & Features */}
            <div className="space-y-6">
              {/* AI Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex space-x-2 mb-4">
                  <button 
                    onClick={() => setSelectedSummaryType('extractive')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSummaryType === 'extractive' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Extractive
                  </button>
                  <button 
                    onClick={() => setSelectedSummaryType('abstractive')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSummaryType === 'abstractive' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Abstractive
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">{document.summary[selectedSummaryType]}</p>
                </div>
              </div>

              {/* Audio Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Summary</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a2 2 0 001.414.586h3a2 2 0 002-2v-3a2 2 0 00-.586-1.414l-1.586-1.586a2 2 0 00-2.828 0l-3 3a2 2 0 000 2.828l1.586 1.586z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Listen to extractive summary</span>
                    </div>
                    <button onClick={handlePlayAudio} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      {isPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select className="text-sm border-0 bg-transparent text-green-800 focus:ring-0">
                      <option>English</option>
                      <option>Spanish</option>
                    </select>
                    <select className="text-sm border-0 bg-transparent text-green-800 focus:ring-0">
                      <option>Samantha (en-US)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Smart Tags */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Smart Tags</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {document.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">3 tags automatically generated based on document content analysis</p>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">PDF Report</span>
                  </button>
                  <button className="flex items-center justify-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Word Doc</span>
                  </button>
                  <button className="flex items-center justify-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">JSON Data</span>
                  </button>
                  <button className="flex items-center justify-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Text File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocumentDetail;

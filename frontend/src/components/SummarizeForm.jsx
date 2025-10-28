import { useState } from 'react'
import axios from 'axios'

export default function SummarizeForm() {
  const [text, setText] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setSummary('')
    try {
      const { data } = await axios.post('/api/summarize', { text })
      setSummary(data.summary)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea value={text} onChange={e => setText(e.target.value)} className="w-full border rounded p-3" rows="8" placeholder="Paste text to summarize..." />
        <button type="submit" className="px-4 py-2 bg-black text-white rounded" disabled={loading}>
          {loading ? 'Summarizing...' : 'Summarize'}
        </button>
      </form>
      {summary && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Summary</h2>
          <p className="whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </div>
  )
}



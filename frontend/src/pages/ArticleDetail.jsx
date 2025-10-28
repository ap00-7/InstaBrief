import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { api } from '../lib/api'

export default function ArticleDetail() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [helpful, setHelpful] = useState(null)
  const [summaryId, setSummaryId] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await axios.get(`/api/articles/${id}`)
      setArticle(data)
    })()
  }, [id])

  if (!article) return <div>Loading...</div>

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
      <div className="prose whitespace-pre-wrap">{article.content}</div>
      {article.tags?.length ? (
        <div className="mt-4 text-sm text-gray-500">Tags: {article.tags.join(', ')}</div>
      ) : null}
      <div className="mt-6 flex gap-3">
        <button className="px-3 py-2 border rounded" onClick={async ()=>{
          const { data } = await axios.post('/api/summarize', { text: article.content })
          const tts = await axios.post('/api/summarize/tts', { text: article.content }, { responseType: 'blob' })
          const url = URL.createObjectURL(tts.data)
          setAudioUrl(url)
          setSummaryId(data.id)
          alert('Summary: ' + data.summary)
        }}>Summarize & TTS</button>
        {audioUrl && <audio controls src={audioUrl} className="self-center" />}
        {summaryId && <a className="px-3 py-2 border rounded" href={`/api/summarize/${summaryId}/export`}>Download summary</a>}
      </div>
      <div className="mt-6">
        <div className="mb-2 font-medium">Was this helpful?</div>
        <div className="flex gap-2">
          <button className={`px-3 py-2 border rounded ${helpful===true?'bg-green-100':''}`} onClick={async()=>{ setHelpful(true); await api.post('/feedback', { article_id: id, helpful: true }) }}>Yes</button>
          <button className={`px-3 py-2 border rounded ${helpful===false?'bg-red-100':''}`} onClick={async()=>{ setHelpful(false); await api.post('/feedback', { article_id: id, helpful: false }) }}>No</button>
        </div>
      </div>
    </div>
  )
}



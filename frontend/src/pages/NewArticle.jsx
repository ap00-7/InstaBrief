import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { initializeTheme } from '../lib/theme'

export default function NewArticle() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    initializeTheme()
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = { title, content, tags: tags.split(',').map(t=>t.trim()).filter(Boolean) }
      const { data } = await api.post('/articles', payload)
      navigate(`/articles/${data.id}`)
    } catch (e) {
      setError('Create failed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Article</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Title" />
        <textarea value={content} onChange={e=>setContent(e.target.value)} className="w-full border rounded px-3 py-2" rows="10" placeholder="Content" />
        <input value={tags} onChange={e=>setTags(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Tags (comma separated)" />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="px-4 py-2 bg-black text-white rounded">Create</button>
      </form>
    </div>
  )
}



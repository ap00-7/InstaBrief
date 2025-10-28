import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { initializeTheme } from '../lib/theme'

export default function Profile() {
  const [me, setMe] = useState(null)
  const [articles, setArticles] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Initialize theme
    initializeTheme()
    if (!getToken()) { navigate('/login'); return }
    (async ()=>{
      const meRes = await api.get('/users/me')
      setMe(meRes.data)
      const artRes = await api.get('/users/me/articles')
      setArticles(artRes.data)
    })()
  }, [])

  if (!me) return <div>Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="mb-6">{me.email}</div>
      <h2 className="font-semibold mb-2">My Articles</h2>
      <ul className="space-y-3">
        {articles.map(a => (
          <li key={a.id} className="border rounded p-3 bg-white">
            <Link to={`/articles/${a.id}`} className="font-semibold hover:underline">{a.title || 'Untitled'}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}



import axios from 'axios'

export async function listEditableArticles() {
  const response = await axios.get('/api/article/list')
  return response.data?.articles || []
}

export async function readEditableArticle(id) {
  const response = await axios.get('/api/article/read', {
    params: { id }
  })
  return response.data
}

export async function saveEditableArticle(payload) {
  const response = await axios.post('/api/article/write', payload, {
    headers: { 'Content-Type': 'application/json' }
  })
  return response.data
}

export async function deleteEditableArticle(id) {
  const response = await axios.post('/api/article/delete', { id }, {
    headers: { 'Content-Type': 'application/json' }
  })
  return response.data
}

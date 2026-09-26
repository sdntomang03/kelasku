import { useEffect, useState } from 'react'
import Icon from '../components/common/Icon'
import ImageRichContent from '../components/content/ImageRichContent'
import {
  getLearningCategories,
  getLearningMaterial,
  getLearningMaterials,
  refreshBundledPracticeDatabase,
} from '../services/practiceDatabase'

export default function LearnPage({ categoryId, materialId, navigate }) {
  const [categories, setCategories] = useState([])
  const [materials, setMaterials] = useState([])
  const [category, setCategory] = useState(null)
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const refreshMaterials = async () => {
    setRefreshing(true)
    try {
      await refreshBundledPracticeDatabase()
      setReloadKey((key) => key + 1)
    } catch (refreshError) {
      setError(refreshError.message || 'Database materi tidak dapat dimuat ulang.')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return undefined
      setLoading(true)
      setError('')
      if (!categoryId) return getLearningCategories()
      if (!materialId) return Promise.all([getLearningCategories(), getLearningMaterials(categoryId)])
      return Promise.all([
        getLearningCategories(),
        getLearningMaterial(categoryId, materialId),
      ])
    }).then((result) => {
      if (cancelled || result === undefined) return
      if (!categoryId) {
        setCategories(result)
        setCategory(null)
        setMaterials([])
        setMaterial(null)
      } else if (!materialId) {
        const [allCategories, categoryMaterials] = result
        setCategory(allCategories.find((item) => String(item.id) === String(categoryId)) || null)
        setMaterials(categoryMaterials)
        setMaterial(null)
      } else {
        const [allCategories, selectedMaterial] = result
        setCategory(allCategories.find((item) => String(item.id) === String(categoryId)) || null)
        setMaterial(selectedMaterial)
        setMaterials([])
      }
    }).catch((loadError) => {
      if (!cancelled) setError(loadError.message || 'Materi belajar lokal tidak dapat dimuat.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [categoryId, materialId, reloadKey])

  if (loading) return <div className="practice-state" role="status">Memuat materi belajar...</div>

  if (error) return <div className="learn-page">
    <div className="practice-inline-error" role="alert">{error}</div>
    <button className="secondary-button" onClick={() => setReloadKey((key) => key + 1)}>Coba lagi</button>
  </div>

  if (materialId) return <div className="page-enter learn-page">
    <div className="practice-breadcrumb"><button onClick={() => navigate('/learn')}>Belajar</button><span>/</span><button onClick={() => navigate(`/learn/${encodeURIComponent(categoryId)}`)}>{category?.name || 'Kategori'}</button><span>/</span><strong>{material?.title || 'Materi tidak ditemukan'}</strong></div>
    {material ? <article className="learn-detail-card">
      <button className="learn-back-button" onClick={() => navigate(`/learn/${encodeURIComponent(categoryId)}`)}><Icon name="arrow" size={15} /> Materi {category?.name || ''}</button>
      <span className="learn-category-label">{category?.name || material.category_name}</span>
      <h1>{material.title}</h1>
      {material.summary && <p className="learn-summary">{material.summary}</p>}
      {material.content
        ? <ImageRichContent html={material.content} className="learn-content-body" />
        : <p className="muted">Isi materi ini belum tersedia.</p>}
    </article> : <div className="practice-empty">
      <span className="practice-empty-icon"><Icon name="book" size={20} /></span>
      <h2>Materi tidak ditemukan</h2>
      <p>Materi yang dicari tidak tersedia di kategori ini.</p>
      <button className="secondary-button" onClick={() => navigate(`/learn/${encodeURIComponent(categoryId)}`)}>Kembali ke kategori</button>
    </div>}
  </div>

  if (categoryId) return <div className="page-enter learn-page">
    <div className="practice-breadcrumb"><button onClick={() => navigate('/learn')}>Belajar</button><span>/</span><strong>{category?.name || 'Kategori tidak ditemukan'}</strong></div>
    <section className="practice-heading">
      <div><p className="eyebrow">PILIH MATERI</p><h1>{category?.name || 'Kategori belajar'}</h1><p className="muted">{category?.description || 'Pilih judul materi untuk mulai belajar.'}</p></div>
      <button className="secondary-button" onClick={() => navigate('/learn')}>Semua kategori</button>
    </section>
    {materials.length ? <div className="learn-material-grid">{materials.map((item, index) => <button className="learn-material-card" key={item.id} onClick={() => navigate(`/learn/${encodeURIComponent(categoryId)}/${encodeURIComponent(item.id)}`)}>
      <span className={`practice-category-icon tone-${index % 3}`}><Icon name="book" size={21} /></span>
      <strong>{item.title}</strong>
      {item.summary && <span className="learn-material-summary">{item.summary}</span>}
      <span className="learn-material-action">Baca materi <Icon name="arrow" size={14} /></span>
    </button>)}</div> : <div className="practice-empty">
      <span className="practice-empty-icon"><Icon name="book" size={20} /></span>
      <h2>{category ? 'Materi belum tersedia' : 'Kategori tidak ditemukan'}</h2>
      <p>{category ? 'Belum ada judul materi untuk kategori ini.' : 'Kategori belajar yang dipilih tidak tersedia di database lokal.'}</p>
      <button className="secondary-button" onClick={() => navigate('/learn')}>Kembali ke kategori</button>
    </div>}
  </div>

  return <div className="page-enter learn-page">
    <section className="practice-heading">
      <div><p className="eyebrow">BELAJAR MANDIRI</p><h1>Pilih kategori</h1><p className="muted">Pilih kategori untuk melihat daftar materi belajar.</p></div>
      <button className="secondary-button" onClick={refreshMaterials} disabled={refreshing}>{refreshing ? 'Memuat ulang...' : 'Muat ulang materi'}</button>
    </section>
    {categories.length ? <div className="practice-category-grid">{categories.map((item, index) => <button className="practice-category-card" key={item.id} onClick={() => navigate(`/learn/${encodeURIComponent(item.id)}`)}>
      <span className={`practice-category-icon tone-${index % 3}`}><Icon name="book" size={21} /></span>
      <strong>{item.name}</strong>
      <span>{item.description || 'Materi belajar'}</span>
      <small>{item.material_count} materi <Icon name="arrow" size={14} /></small>
    </button>)}</div> : <div className="practice-empty">
      <span className="practice-empty-icon"><Icon name="book" size={20} /></span>
      <h2>Kategori materi belum tersedia</h2>
      <p>Materi belajar akan tampil setelah tersedia di tabel <code>learning_materials</code> pada database SQLite.</p>
    </div>}
  </div>
}

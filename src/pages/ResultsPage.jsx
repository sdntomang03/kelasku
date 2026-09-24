import Icon from '../components/common/Icon'
import ImageRichContent from '../components/content/ImageRichContent'
import { useState } from 'react'

export default function ResultsPage({ exams, result, allowExplanation }) {
  const score = result?.score ?? result?.average_score
  const explanationItems = result?.questions || result?.explanations || []
  return <div className="page-enter">
    <div className="page-title-row"><div><p className="eyebrow">PERFORMA</p><h1>Hasil ujian</h1><p className="muted">Pantau perkembangan dan pencapaian belajarmu.</p></div>{score !== undefined && <div className="average-box"><span>NILAI UJIAN TERAKHIR</span><strong>{score}</strong><small>{result.status === 'completed' ? 'Ujian telah selesai' : result.status}</small></div>}</div>
    {result && <section className="result-highlight"><div className="result-medal">?</div><div><span className="eyebrow">HASIL UJIAN TERBARU</span><h2>{result.exam?.title || 'Ujian selesai'}</h2><p className="muted">Attempt #{result.attempt_id} · Mode penilaian {result.result_mode || 'average'}</p></div><div className="result-highlight-score"><strong>{score ?? '—'}</strong><span>/ 100</span></div></section>}
    <div className="results-summary"><div><span>Ujian selesai</span><strong>{exams.length}</strong></div><div><span>Nilai tertinggi</span><strong>{exams.length ? Math.max(...exams.map((exam) => exam.final_score || 0)) : score || 0}</strong></div><div><span>Total soal dijawab</span><strong>{exams.reduce((total, exam) => total + (exam.total_questions || 0), 0)}</strong></div></div>
    <section className="section-card results-table"><div className="section-heading"><div><h2>Riwayat ujian</h2><p className="muted">Semua hasil ujian yang telah kamu selesaikan.</p></div></div>{exams.map((exam) => <ResultRow key={exam.id} exam={exam} />)}</section>
    {result?.sections?.length > 0 && <section className="section-card result-sections"><div className="section-heading"><div><h2>Rincian bagian ujian</h2><p className="muted">Nilai berdasarkan section yang dikembalikan API.</p></div></div>{result.sections.map((section, index) => <div className="section-result-row" key={section.id || index}><span>{section.name || `Bagian ${index + 1}`}</span><strong>{section.score ?? section.average_score ?? '—'}</strong></div>)}</section>}
    {allowExplanation && <ExplanationSection items={explanationItems} text={result?.explanation_text || result?.explanation} />}
  </div>
}

function ResultRow({ exam }) {
  return <div className="result-row"><div className={`subject-icon ${exam.color}`}><Icon name="chart" size={20} /></div><div className="row-main"><strong>{exam.title}</strong><span>{exam.end_time} <i /> {exam.total_questions} soal</span></div><div className="score"><strong>{exam.final_score}</strong><span>/ 100</span></div><span className="score-label">Sangat baik</span></div>
}

function ExplanationSection({ items, text }) {
  const [open, setOpen] = useState(false)
  if (!items.length && !text) return null
  return <section className="section-card explanation-section"><div className="section-heading"><div><p className="eyebrow">PEMBELAJARAN</p><h2>Pembahasan ujian</h2><p className="muted">Pelajari penjelasan untuk memahami jawaban dan materi soal.</p></div><button className="primary-button small" onClick={() => setOpen((value) => !value)}>{open ? 'Sembunyikan' : 'Lihat pembahasan'} <Icon name="book" size={15} /></button></div>{open && <div className="explanation-list">{text && <div className="explanation-intro"><ImageRichContent html={text} className="rich-text" /></div>}{items.map((item, index) => <article className="explanation-item" key={item.id || item.question_id || index}><div className="explanation-item-head"><span>SOAL {index + 1}</span><strong>{item.is_correct === true ? 'Benar' : item.is_correct === false ? 'Perlu dipelajari' : ''}</strong></div>{item.content && <ImageRichContent html={item.content} className="rich-text explanation-question" />}{item.explanation && <ImageRichContent html={item.explanation} className="rich-text" />}</article>)}</div>}</section>
}

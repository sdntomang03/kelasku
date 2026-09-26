import Icon from '../components/common/Icon'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function ResultDetailPage({ detail, loading, error, onBack, onDiscussion }) {
  const sections = detail?.detail_nilai || []

  return <div className="page-enter result-detail-page exam-result-shell">
    <button className="back-button result-back-button" onClick={onBack}><Icon name="arrowLeft" size={17} /> <span>Kembali ke hasil ujian</span></button>
    {loading && <div className="result-detail-state"><div className="loading-spinner" /><strong>Memuat detail nilai...</strong></div>}
    {!loading && error && <div className="result-detail-state error"><strong>{error}</strong><button className="primary-button small" onClick={onBack}>Kembali ke hasil ujian</button></div>}
    {!loading && !error && detail && <><ExamScoreSummary detail={detail} /><section className="section-card result-detail-sections result-surface-card"><div className="section-heading"><div><h2>Detail nilai per section</h2><p className="muted">Rincian nilai yang dikirim oleh server untuk setiap section.</p></div></div>{sections.length ? <div className="section-score-list">{sections.map((section, index) => <SectionScoreCard key={section.id || section.section_name || index} section={section} />)}</div> : <div className="result-detail-empty">Detail nilai section belum tersedia.</div>}</section>{detail.exam?.show_explanation === true && detail.status === 'completed' && <button type="button" className="result-detail-discussion-button" onClick={() => onDiscussion({ ...detail.exam, status: detail.status, attempt_id: detail.attempt_id, attempt: { id: detail.attempt_id } })}><Icon name="book" size={15} /> Lihat pembahasan</button>}</>}
    {!loading && !error && !detail && <div className="result-detail-state"><strong>Detail nilai belum tersedia.</strong></div>}
  </div>
}

function ExamScoreSummary({ detail }) {
  const pointBased = detail.is_point_based === true
  const score = detail.final_score
  return <div className="result-detail-hero"><div><p className="eyebrow">DETAIL NILAI</p><h1>{detail.exam?.title || 'Detail hasil ujian'}</h1><p className="muted">Nilai akhir dan rincian capaian pada setiap section ujian.</p></div><div className={`result-detail-score ${pointBased ? 'point' : ''}`}><span>{pointBased ? 'TOTAL POINT' : 'NILAI AKHIR'}</span><strong>{score ?? '—'}</strong></div></div>
}

function SectionScoreCard({ section }) {
  const pointBased = section.is_point_based === true
  const score = section.display_score ?? section.nilai ?? section.score
  const label = section.score_label || (pointBased ? 'Point' : 'Point')
  const maximum = section.maximum
  const questionCount = getQuestionCount(section)
  const chartData = {
    labels: ['Benar', 'Salah', 'Tidak dijawab'],
    datasets: [{
      data: [section.benar ?? 0, section.salah ?? 0, section.tidak_dijawab ?? 0],
      backgroundColor: ['#2baa78', '#ed6b78', '#efa64f'],
      borderColor: '#fff',
      borderWidth: 4,
      hoverOffset: 6,
    }],
  }
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { padding: 10, displayColors: true },
    },
  }
  return <article className="section-score-card"><div className="section-score-heading"><div><strong>{section.section_name || section.name || 'Section'}</strong><span>{questionCount} soal</span></div><div className="section-score-value"><b>{score ?? '—'}</b><small>{label}</small></div></div><div className="section-score-visual"><div className="section-score-chart"><Doughnut data={chartData} options={chartOptions} /><span><b>{score ?? '—'}</b><small>{pointBased ? 'Point' : 'Nilai'}</small></span></div><div className="section-score-stats"><span className="correct"><b>{section.benar ?? 0}</b><small>Benar</small></span><span className="incorrect"><b>{section.salah ?? 0}</b><small>Salah</small></span><span className="unanswered"><b>{section.tidak_dijawab ?? 0}</b><small>Tidak dijawab</small></span></div></div><div className="section-score-meta"><span>Diperoleh <b>{section.earned ?? '—'}</b></span><span>Maksimal <b>{maximum ?? '—'}</b></span><span>{label}</span></div></article>
}

function getQuestionCount(section) {
  const explicitCount = section.question_count ?? section.total_questions ?? section.metadata?.question_count ?? section.metadata?.total_questions
  if (explicitCount !== null && explicitCount !== undefined && explicitCount !== '') return explicitCount
  const correct = Number(section.benar)
  const wrong = Number(section.salah)
  const unanswered = Number(section.tidak_dijawab)
  if ([correct, wrong, unanswered].every(Number.isFinite)) return correct + wrong + unanswered
  return 0
}

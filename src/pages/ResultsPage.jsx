import Icon from '../components/common/Icon'

export default function ResultsPage({ exams, result, discussion, allowExplanation, onQuestionDiscussion, onDetail }) {
  const score = result?.score ?? result?.average_score
  const explanationItems = discussion?.questions || []
  return <div className="page-enter results-page exam-result-shell">
    <div className="page-title-row results-page-header"><div><p className="eyebrow">HASIL UJIAN</p><h1>Hasil ujian</h1><p className="muted">Pantau perkembangan dan pencapaian belajarmu.</p></div>{score !== undefined && <div className="average-box"><span>NILAI UJIAN TERAKHIR</span><strong>{score}</strong><small>{result.status === 'completed' ? 'Ujian telah selesai' : result.status}</small></div>}</div>
    {result && <section className="result-highlight result-summary-card"><div className="result-medal">?</div><div className="result-summary-copy"><span className="eyebrow">HASIL UJIAN TERBARU</span><h2>{result.exam?.title || 'Ujian selesai'}</h2><p className="muted">Attempt #{result.attempt_id} · Mode penilaian {result.result_mode || 'average'}</p></div><div className="result-highlight-score"><strong>{score ?? '—'}</strong><span>/ 100</span></div>{onDetail && <button type="button" className="result-detail-button" onClick={onDetail}>Detail nilai <Icon name="arrow" size={15} /></button>}</section>}
    <div className="results-summary result-stat-grid"><div><span>Ujian selesai</span><strong>{exams.length}</strong></div><div><span>Nilai tertinggi</span><strong>{exams.length ? Math.max(...exams.map((exam) => exam.final_score || 0)) : score || 0}</strong></div><div><span>Total soal dijawab</span><strong>{exams.reduce((total, exam) => total + (exam.total_questions || 0), 0)}</strong></div></div>
    <section className="section-card results-table result-surface-card"><div className="section-heading"><div><h2>Riwayat ujian</h2><p className="muted">Semua hasil ujian yang telah kamu selesaikan.</p></div></div>{exams.map((exam) => <ResultRow key={exam.id} exam={exam} />)}</section>
    {allowExplanation && explanationItems.length > 0 && <ExplanationSection items={explanationItems} onQuestionDiscussion={onQuestionDiscussion} />}
  </div>
}

function ResultRow({ exam }) {
  return <div className="result-row"><div className={`subject-icon ${exam.color}`}><Icon name="chart" size={20} /></div><div className="row-main"><strong>{exam.title}</strong><span>{exam.end_time} <i /> {exam.total_questions} soal</span></div><div className="score"><strong>{exam.final_score}</strong><span>/ 100</span></div><span className="score-label">Sangat baik</span></div>
}

function ExplanationSection({ items, onQuestionDiscussion }) {
  return <section className="section-card explanation-section"><div className="section-heading"><div><p className="eyebrow">PEMBELAJARAN</p><h2>Daftar soal</h2><p className="muted">Pilih soal untuk melihat pembahasan lengkap.</p></div></div><div className="discussion-question-list">{items.map((item, index) => <button type="button" key={item.id || item.question_id || index} onClick={() => onQuestionDiscussion(item.id || item.question_id)}><span>SOAL {index + 1}</span><strong>{item.is_correct ? 'Benar' : 'Perlu dipelajari'}</strong><Icon name="arrow" size={15} /></button>)}</div></section>
}

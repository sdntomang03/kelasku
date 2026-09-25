import Icon from '../components/common/Icon'

export default function ResultDetailPage({ result, discussion, onBack }) {
  const questions = discussion?.questions || []
  const sections = buildSections(result?.sections, questions)
  const stats = questions.reduce((summary, question) => {
    const answered = hasAnswer(question.answer)
    const section = getSectionName(question)
    const target = summary
    target.total += 1
    if (!answered) target.unanswered += 1
    else if (question.is_correct === true) target.correct += 1
    else target.incorrect += 1
    target.bySection[section] ||= { correct: 0, incorrect: 0, unanswered: 0 }
    if (!answered) target.bySection[section].unanswered += 1
    else if (question.is_correct === true) target.bySection[section].correct += 1
    else target.bySection[section].incorrect += 1
    return target
  }, { total: 0, correct: 0, incorrect: 0, unanswered: 0, bySection: {} })
  const scoring = getScoringInfo(result, sections)

  return <div className="page-enter result-detail-page">
    <button className="back-button" onClick={onBack}><Icon name="arrow" size={15} /> Kembali ke hasil ujian</button>
    <div className="result-detail-hero">
      <div>
        <p className="eyebrow">DETAIL NILAI</p>
        <h1>{result?.exam?.title || 'Detail hasil ujian'}</h1>
        <p className="muted">Rincian performa dan nilai berdasarkan hasil pengerjaanmu.</p>
      </div>
      {result?.score !== undefined && <div className="result-detail-score"><span>NILAI AKHIR</span><strong>{result.score}</strong><small>/ 100</small></div>}
    </div>
    <section className="result-detail-stats">
      <Stat label="Benar" value={stats.correct} tone="correct" />
      <Stat label="Salah" value={stats.incorrect} tone="incorrect" />
      <Stat label="Tidak dijawab" value={stats.unanswered} tone="unanswered" />
      <Stat label="Total soal" value={stats.total} tone="total" />
    </section>
    <section className="section-card scoring-info">
      <div><span className="scoring-info-icon"><Icon name="chart" size={17} /></span><div><strong>Aturan penilaian</strong><p>{scoring.label}</p></div></div>
      <small>{scoring.description}</small>
    </section>
    <section className="section-card result-detail-sections">
      <div className="section-heading"><div><h2>Performa tiap section</h2><p className="muted">Benar, salah, dan tidak dijawab ditampilkan untuk setiap bagian ujian.</p></div></div>
      {sections.length ? <div className="section-score-list">{sections.map((section, index) => {
        const sectionStats = {
          correct: section.correct ?? section.correct_count ?? stats.bySection[section.name]?.correct ?? 0,
          incorrect: section.incorrect ?? section.incorrect_count ?? stats.bySection[section.name]?.incorrect ?? 0,
          unanswered: section.unanswered ?? section.unanswered_count ?? section.unanswered_questions ?? stats.bySection[section.name]?.unanswered ?? 0,
        }
        return <article className="section-score-card" key={section.id || section.name || index}>
          <div className="section-score-heading"><div><strong>{section.name || `Section ${index + 1}`}</strong><span>{section.question_count || sectionStats.correct + sectionStats.incorrect + sectionStats.unanswered} soal</span></div><b>{formatSectionScore(section)}</b></div>
          <div className="section-score-track"><i style={{ width: `${getSectionPercent(section)}%` }} /></div>
          <div className="section-score-stats"><span className="correct"><b>{sectionStats.correct}</b> Benar</span><span className="incorrect"><b>{sectionStats.incorrect}</b> Salah</span><span className="unanswered"><b>{sectionStats.unanswered}</b> Kosong</span></div>
        </article>
      })}</div> : <div className="empty-state">Data section belum tersedia.</div>}
    </section>
  </div>
}

function Stat({ label, value, tone }) {
  return <div className={`result-detail-stat ${tone}`}><span>{label}</span><strong>{value}</strong></div>
}

function hasAnswer(answer) {
  return answer !== null && answer !== undefined && !(typeof answer === 'string' && answer.trim() === '') && !(Array.isArray(answer) && answer.length === 0) && !(typeof answer === 'object' && !Array.isArray(answer) && Object.keys(answer).length === 0)
}

function getSectionName(question) {
  return question.section?.name || question.section || 'Tanpa section'
}

function buildSections(apiSections, questions) {
  const grouped = {}
  questions.forEach((question) => {
    const name = getSectionName(question)
    grouped[name] ||= { name, question_count: 0, correct: 0, incorrect: 0, unanswered: 0, score: 0, maximum: 0 }
    const section = grouped[name]
    section.question_count += 1
    section.score += Number(question.score || 0)
    section.maximum += Number(question.maximum_score || 0)
    if (!hasAnswer(question.answer)) section.unanswered += 1
    else if (question.is_correct === true) section.correct += 1
    else section.incorrect += 1
  })
  if (!apiSections?.length) return Object.values(grouped)
  return apiSections.map((section) => {
    const name = section.name || section.title || section.label || 'Tanpa section'
    const fallback = grouped[name] || {}
    return { ...fallback, ...section, name, question_count: section.question_count ?? fallback.question_count }
  })
}

function getScoringInfo(result, sections) {
  const source = result?.scoring_profil || result?.scoring_profile || result?.scoring || result?.exam?.scoring_profil || result?.exam?.scoring_profile
  const mode = typeof source === 'string' ? source : source?.mode || source?.type || source?.calculation
  const normalized = String(mode || result?.scoring_mode || '').toLowerCase()
  if (normalized.includes('weight') || normalized.includes('bobot')) return { label: 'Menggunakan bobot soal', description: 'Nilai section mengikuti total nilai bobot soal yang dikirim oleh API.' }
  if (normalized.includes('standard') || normalized.includes('standar') || normalized.includes('100')) return { label: 'Skala standar 100', description: 'Nilai section dinormalisasi pada skala 100 sesuai konfigurasi scoring API.' }
  const hasMaximum = sections.some((section) => Number(section.maximum_score ?? section.maximum) > 0)
  return { label: 'Mengikuti nilai dari API', description: hasMaximum ? 'Mode scoring belum dikirim pada response; nilai dan maksimum section ditampilkan apa adanya dari API.' : 'Backend belum mengirim metadata scoring_profil atau maksimum nilai section.' }
}

function getSectionPercent(section) {
  const score = Number(section.display_score ?? section.score ?? section.average_score ?? 0)
  const maximum = Number(section.maximum_score ?? section.maximum ?? 100)
  if (!maximum) return 0
  return Math.min(100, Math.max(0, (score / maximum) * 100))
}

function formatSectionScore(section) {
  const score = section.display_score ?? section.score ?? section.average_score
  const maximum = section.maximum_score ?? section.maximum
  if (score === undefined || score === null) return '—'
  return maximum ? `${score} / ${maximum}` : score
}

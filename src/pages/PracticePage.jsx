import { useEffect, useState } from 'react'
import Icon from '../components/common/Icon'
import ImageRichContent from '../components/content/ImageRichContent'
import MathContent from '../components/content/MathContent'
import QuestionAnswer from '../components/exam/QuestionAnswer'
import {
  getPracticeAnswers,
  getPracticeCategories,
  getPracticePackage,
  getPracticePackages,
  getPracticeGradingMode,
  getPracticeQuestions,
  savePracticeGradingMode,
  savePracticeAnswer,
} from '../services/practiceDatabase'

export default function PracticePage({ categoryId, packageId, mode, navigate }) {
  const [categories, setCategories] = useState([])
  const [packages, setPackages] = useState([])
  const [category, setCategory] = useState(null)
  const [practicePackage, setPracticePackage] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [gradingMode, setGradingMode] = useState('average')
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!categoryId) {
        const result = await getPracticeCategories()
        if (!cancelled) setCategories(result)
      } else if (!packageId) {
        const [allCategories, categoryPackages] = await Promise.all([
          getPracticeCategories(),
          getPracticePackages(categoryId),
        ])
        if (!cancelled) {
          setCategory(allCategories.find((item) => String(item.id) === String(categoryId)) || null)
          setPackages(categoryPackages)
        }
      } else {
        const [allCategories, packageInfo, packageQuestions, savedAnswers, packageGradingMode] = await Promise.all([
          getPracticeCategories(),
          getPracticePackage(categoryId, packageId),
          getPracticeQuestions(packageId),
          getPracticeAnswers(packageId),
          getPracticeGradingMode(packageId),
        ])
        if (!cancelled) {
          setCategory(allCategories.find((item) => String(item.id) === String(categoryId)) || null)
          setPracticePackage(packageInfo)
          setQuestions(packageQuestions)
          setAnswers(savedAnswers)
          setGradingMode(packageGradingMode)
        }
      }
    }
    Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
      setError('')
      return load()
    }).then(() => {
      if (!cancelled) setLoading(false)
    }).catch((loadError) => {
      if (!cancelled) {
        setError(loadError.message || 'Data latihan lokal tidak dapat dimuat.')
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [categoryId, packageId])

  const updateAnswer = async (questionId, answer) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }))
    try {
      await savePracticeAnswer(packageId, questionId, answer)
    } catch (saveError) {
      setError(saveError.message || 'Jawaban latihan gagal disimpan ke database lokal.')
    }
  }

  const openResults = async () => {
    try {
      await Promise.all(Object.entries(answers).map(([questionId, answer]) => savePracticeAnswer(packageId, questionId, answer)))
      navigate(`/practice/${categoryId}/${packageId}/result`)
    } catch (saveError) {
      setError(saveError.message || 'Jawaban latihan gagal disimpan sebelum menampilkan hasil.')
    }
  }

  const changeGradingMode = async (event) => {
    const nextMode = event.target.value
    try {
      await savePracticeGradingMode(packageId, nextMode)
      setGradingMode(nextMode)
    } catch (saveError) {
      setError(saveError.message || 'Metode koreksi gagal disimpan.')
    }
  }

  if (loading) return <div className="practice-state"><span className="loading-spinner" /><strong>Memuat latihan lokal...</strong></div>
  if (mode === 'result' && practicePackage && questions.length) {
    const reviewedQuestions = questions.map((question) => ({
      question,
      answer: answers[question.id],
      review: reviewPracticeAnswer(question, answers[question.id], gradingMode),
    }))
    const summary = reviewedQuestions.reduce((counts, item) => {
      counts[item.review.status] += 1
      counts.points += item.review.points
      counts.maximumPoints += item.review.maxPoints
      return counts
    }, { correct: 0, incorrect: 0, unanswered: 0, ungraded: 0, points: 0, maximumPoints: 0 })
    const scorePercent = summary.maximumPoints ? (summary.points / summary.maximumPoints) * 100 : 0

    return <div className="page-enter practice-page practice-result-page">
      <div className="practice-breadcrumb"><button onClick={() => navigate('/practice')}>Latihan</button><span>/</span><button onClick={() => navigate(`/practice/${categoryId}`)}>{category?.name}</button><span>/</span><strong>Hasil latihan</strong></div>
      <section className="practice-heading"><div><p className="eyebrow">HASIL LATIHAN</p><h1>{practicePackage.title}</h1><p className="muted">{category?.name} · Pilih metode koreksi yang sesuai untuk paket ini</p></div><div className="practice-result-actions"><button className="secondary-button" onClick={() => navigate(`/practice/${categoryId}/${packageId}/attempt`)}>Kembali mengerjakan</button><button className="primary-button" onClick={() => navigate(`/practice/${categoryId}`)}>Pilih paket lain</button></div></section>
      {error && <div className="practice-inline-error" role="alert">{error}</div>}
      <section className="practice-grading-panel" aria-label="Metode koreksi">
        <label htmlFor="practice-grading-mode">Metode koreksi</label>
        <select id="practice-grading-mode" value={gradingMode} onChange={changeGradingMode}>
          <option value="weighted">Bobot / poin</option>
          <option value="average">Rata-rata nilai</option>
        </select>
        <p>{gradingMode === 'weighted' ? 'Nilai dihitung dari poin yang diperoleh dibanding total poin maksimal. Bobot jawaban TKP digunakan jika tersedia.' : 'Nilai dihitung dari jumlah soal benar dibanding seluruh soal yang dapat dikoreksi.'}</p>
      </section>
      <section className="practice-result-summary" aria-label="Ringkasan hasil latihan">
        <PracticeResultStat label="Benar" value={summary.correct} tone="correct" />
        <PracticeResultStat label="Salah" value={summary.incorrect} tone="incorrect" />
        <PracticeResultStat label="Tidak dijawab" value={summary.unanswered} tone="unanswered" />
        <PracticeResultStat label="Belum dikoreksi" value={summary.ungraded} tone="ungraded" />
      </section>
      <section className="practice-score-card" aria-live="polite">
        <span>{gradingMode === 'weighted' ? 'POIN DIPEROLEH' : 'NILAI RATA-RATA'}</span>
        <strong>{gradingMode === 'weighted' ? `${formatScore(summary.points)} / ${formatScore(summary.maximumPoints)} poin` : `${formatScore(scorePercent)} / 100`}</strong>
        <small>{formatScore(scorePercent)}%</small>
      </section>
      <section className="practice-review-list">
        <div className="practice-review-heading"><div><span className="small-label">KOREKSI JAWABAN</span><h2>Rincian setiap soal</h2></div><span>{questions.length} soal</span></div>
        {reviewedQuestions.map(({ question, answer, review }, index) => <article className="practice-review-card" key={question.id}>
          <div className="practice-review-card-heading"><strong>Soal {String(index + 1).padStart(2, '0')}</strong><span className={`practice-result-status ${review.status}`}>{review.label}</span></div>
          <ImageRichContent html={question.content} className="question-content practice-review-question" />
          <PracticeAnswerReview question={question} answer={answer} status={review.status} />
          {question.explanation && <div className="practice-review-explanation"><span className="small-label">PEMBAHASAN</span><ImageRichContent html={question.explanation} className="rich-text" /></div>}
        </article>)}
      </section>
    </div>
  }

  if (mode === 'attempt' && practicePackage && questions.length) {
    const question = questions[activeQuestion]
    const answeredCount = questions.filter((item) => hasPracticeAnswer(answers[item.id])).length
    return <div className="page-enter practice-page">
      <div className="practice-breadcrumb"><button onClick={() => navigate('/practice')}>Latihan</button><span>/</span><button onClick={() => navigate(`/practice/${categoryId}`)}>{category?.name}</button><span>/</span><strong>{practicePackage.title}</strong></div>
      <section className="practice-heading"><div><p className="eyebrow">LATIHAN MANDIRI</p><h1>{practicePackage.title}</h1><p className="muted">{category?.name} · {questions.length} soal · Jawaban disimpan di perangkat ini</p></div><button className="secondary-button" onClick={() => navigate(`/practice/${categoryId}`)}>Kembali ke paket</button></section>
      {error && <div className="practice-inline-error" role="alert">{error}</div>}
      <div className="practice-workspace">
        <aside className="practice-question-nav"><span className="small-label">DAFTAR SOAL</span><strong>{answeredCount} <small>/ {questions.length}</small></strong><div className="practice-question-grid">{questions.map((item, index) => <button key={item.id} className={`${index === activeQuestion ? 'active' : ''} ${answers[item.id] !== undefined ? 'answered' : ''}`} onClick={() => setActiveQuestion(index)} aria-label={`Buka soal ${index + 1}`}>{index + 1}</button>)}</div><div className="practice-legend"><span><i className="answered" />Sudah dijawab</span><span><i />Belum dijawab</span></div></aside>
        {question ? <main className="practice-question-area"><div className="practice-question-meta"><span>SOAL <b>{String(activeQuestion + 1).padStart(2, '0')}</b></span><span>{question.type?.replaceAll('_', ' ')}</span></div><article className="practice-question-card"><ImageRichContent html={question.content} className="question-content" /><QuestionAnswer type={question.type} question={question} value={answers[question.id]} onChange={(answer) => updateAnswer(question.id, answer)} /></article><div className="practice-question-footer"><button className="secondary-button" disabled={activeQuestion === 0} onClick={() => setActiveQuestion((index) => index - 1)}>← Sebelumnya</button>{activeQuestion < questions.length - 1 ? <button className="primary-button" onClick={() => setActiveQuestion((index) => index + 1)}>Soal berikutnya <Icon name="arrow" size={15} /></button> : <button className="primary-button" onClick={openResults}>Lihat hasil latihan <Icon name="arrow" size={15} /></button>}</div></main> : <div className="practice-state">Paket ini belum memiliki soal.</div>}
      </div>
    </div>
  }

  if (packageId) {
    return <div className="practice-state"><strong>Paket latihan tidak ditemukan atau belum memiliki soal.</strong><button className="secondary-button" onClick={() => navigate(`/practice/${categoryId}`)}>Kembali ke paket</button></div>
  }

  if (categoryId) return <div className="page-enter practice-page">
    <div className="practice-breadcrumb"><button onClick={() => navigate('/practice')}>Latihan</button><span>/</span><strong>{category?.name || 'Kategori'}</strong></div>
    <section className="practice-heading"><div><p className="eyebrow">PILIH PAKET</p><h1>{category?.name || 'Kategori latihan'}</h1><p className="muted">{category?.description || 'Pilih paket soal untuk mulai latihan.'}</p></div><button className="secondary-button" onClick={() => navigate('/practice')}>Semua kategori</button></section>
    {error && <div className="practice-inline-error" role="alert">{error}</div>}
    {packages.length ? <div className="practice-package-grid">{packages.map((item, index) => <button className="practice-package-card" key={item.id} onClick={() => navigate(`/practice/${categoryId}/${item.id}/attempt`)}><span className="practice-package-number">PAKET {index + 1}</span><strong>{item.title}</strong><span className="muted">{item.description || item.difficulty || 'Latihan mandiri'} · {item.question_count} soal</span><span className="practice-package-action">Mulai latihan <Icon name="arrow" size={15} /></span></button>)}</div> : <PracticeEmpty />}
  </div>

  return <div className="page-enter practice-page">
    <section className="practice-heading"><div><p className="eyebrow">BELAJAR MANDIRI</p><h1>Latihan</h1><p className="muted">Pilih materi latihan untuk mulai berlatih secara mandiri.</p></div></section>
    {error && <div className="practice-inline-error" role="alert">{error}</div>}
    {categories.length ? <div className="practice-category-grid">{categories.map((item, index) => <button className="practice-category-card" key={item.id} onClick={() => navigate(`/practice/${item.id}`)}><span className={`practice-category-icon tone-${index % 3}`}><Icon name="book" size={21} /></span><strong>{item.name}</strong><span>{item.description || 'Latihan soal pilihan'}</span><small>{item.package_count} paket <Icon name="arrow" size={14} /></small></button>)}</div> : <PracticeEmpty />}
  </div>
}

function hasPracticeAnswer(answer) {
  if (Array.isArray(answer)) return answer.length > 0
  if (answer && typeof answer === 'object') return Object.values(answer).some((value) => value !== null && value !== undefined && String(value).trim() !== '')
  return answer !== undefined && answer !== null && String(answer).trim() !== ''
}

function reviewPracticeAnswer(question, answer, gradingMode) {
  const options = question.options || []
  const weightedOptions = options.filter((option) => option.score_weight !== null && option.score_weight !== undefined && Number.isFinite(Number(option.score_weight)))
  const hasWeights = weightedOptions.length > 0
  const bestWeight = hasWeights ? Math.max(...weightedOptions.map((option) => Number(option.score_weight))) : 0
  const isAnswered = hasPracticeAnswer(answer)
  let correct = null
  let points = 0
  let maxPoints = 0

  if (question.type === 'tkp') {
    if (hasWeights) {
      const selected = options.find((option) => String(option.id) === String(answer))
      correct = Boolean(selected && Number(selected.score_weight) === bestWeight)
      maxPoints = gradingMode === 'weighted' ? bestWeight : 1
      points = gradingMode === 'weighted' ? Number(selected?.score_weight || 0) : Number(correct)
    }
  } else if (question.type === 'single_choice') {
    const hasKey = options.some((option) => option.is_correct)
    if (hasKey) {
      correct = options.some((option) => option.is_correct && String(option.id) === String(answer))
      if (gradingMode === 'weighted' && hasWeights) {
        maxPoints = bestWeight
        points = Number(options.find((option) => String(option.id) === String(answer))?.score_weight || 0)
      } else {
        maxPoints = 1
        points = Number(correct)
      }
    } else if (gradingMode === 'weighted' && hasWeights) {
      const selected = options.find((option) => String(option.id) === String(answer))
      correct = Boolean(selected && Number(selected.score_weight) === bestWeight)
      maxPoints = bestWeight
      points = Number(selected?.score_weight || 0)
    }
  } else if (['multiple_choice', 'complex_choice'].includes(question.type)) {
    const correctOptions = options.filter((option) => option.is_correct)
    if (correctOptions.length) {
      const correctIds = correctOptions.map((option) => String(option.id)).sort()
      const answerIds = (Array.isArray(answer) ? answer : [answer]).map(String).sort()
      correct = correctIds.length === answerIds.length && correctIds.every((id, index) => id === answerIds[index])
      if (gradingMode === 'weighted' && correctOptions.every((option) => weightedOptions.includes(option))) {
        maxPoints = correctOptions.reduce((total, option) => total + Number(option.score_weight), 0)
        points = (Array.isArray(answer) ? answer : [answer]).reduce((total, id) => {
          const option = correctOptions.find((item) => String(item.id) === String(id))
          return total + Number(option?.score_weight || 0)
        }, 0)
      } else {
        maxPoints = 1
        points = Number(correct)
      }
    }
  } else if (['true_false', 'true_false_multi'].includes(question.type)) {
    if (options.length > 0) {
      correct = options.every((option) => String(answer?.[option.id] || '').toLowerCase() === (option.is_correct ? 'benar' : 'salah'))
      maxPoints = 1
      points = Number(correct)
    }
  } else if (question.type === 'matching') {
    const matches = question.matches || []
    if (matches.length && matches.every((item) => item.target_id !== undefined && item.target_id !== null)) {
      correct = matches.every((item) => String(answer?.[item.id]) === String(item.target_id))
      maxPoints = 1
      points = Number(correct)
    }
  }

  if (correct === null) return { status: isAnswered ? 'ungraded' : 'unanswered', label: isAnswered ? 'Belum dikoreksi' : 'Tidak dijawab', points: 0, maxPoints: 0 }
  if (!isAnswered) {
    return { status: 'unanswered', label: 'Tidak dijawab', points: 0, maxPoints }
  }
  return {
    status: correct ? 'correct' : 'incorrect',
    label: correct ? 'Benar' : 'Salah',
    points,
    maxPoints,
  }
}

function formatScore(value) {
  return Number(value.toFixed(2)).toString()
}

function PracticeResultStat({ label, value, tone }) {
  return <div className={`practice-result-stat ${tone}`}><span>{label}</span><strong>{value}</strong></div>
}

function PracticeAnswerReview({ question, answer, status }) {
  const options = question.options || []
  if (['single_choice', 'tkp', 'multiple_choice', 'complex_choice'].includes(question.type)) {
    const answers = (Array.isArray(answer) ? answer : [answer]).filter((item) => item !== undefined && item !== null).map(String)
    const highestTkpWeight = question.type === 'tkp'
      ? Math.max(...options.filter((option) => option.score_weight !== null && option.score_weight !== undefined && Number.isFinite(Number(option.score_weight))).map((option) => Number(option.score_weight)), -Infinity)
      : -Infinity
    return <div className="practice-review-options">
      {options.map((option, index) => {
        const selected = answers.includes(String(option.id))
        const bestWeighted = question.type === 'tkp' && Number(option.score_weight) === highestTkpWeight
        const correct = question.type === 'tkp' ? bestWeighted : option.is_correct
        return <div className={`${selected ? 'selected' : ''} ${correct ? 'correct' : ''}`} key={option.id}>
          <span className="choice-letter">{String.fromCharCode(65 + index)}</span><MathContent html={option.option_text || ''} />
          <div className="practice-review-option-labels">{selected && <b>Jawaban siswa</b>}{correct && <b>{question.type === 'tkp' ? 'Bobot tertinggi' : 'Kunci jawaban'}</b>}{question.type === 'tkp' && option.score_weight !== null && option.score_weight !== undefined && <b>Bobot {option.score_weight}</b>}</div>
        </div>
      })}
      {question.type === 'tkp' && highestTkpWeight === -Infinity && <p className="practice-review-note">Bobot penilaian belum tersedia dalam database; jawaban ini belum dapat dinilai otomatis.</p>}
      {question.type !== 'tkp' && !options.some((option) => option.is_correct) && <p className="practice-review-note">{status === 'ungraded' ? 'Kunci jawaban belum tersedia dalam database; jawaban ini belum dapat dinilai otomatis.' : 'Kunci jawaban belum tersedia dalam database.'}</p>}
    </div>
  }

  if (['true_false', 'true_false_multi'].includes(question.type)) {
    return <div className="practice-review-table-wrap"><table className="practice-review-table"><thead><tr><th>Pernyataan</th><th>Jawaban siswa</th><th>Kunci jawaban</th><th>Status</th></tr></thead><tbody>{options.map((option) => {
      const student = answer?.[option.id]
      const expected = option.is_correct ? 'benar' : 'salah'
      const correct = String(student || '').toLowerCase() === expected
      return <tr key={option.id}><td><MathContent html={option.option_text || ''} /></td><td>{student || '—'}</td><td>{expected}</td><td>{!student ? 'Belum dijawab' : correct ? 'Benar' : 'Salah'}</td></tr>
    })}</tbody></table></div>
  }

  if (question.type === 'matching') {
    const matches = question.matches || []
    const targets = question.target_options || []
    const targetText = (id) => targets.find((target) => String(target.id) === String(id))?.text || '—'
    return <div className="practice-review-matching">{matches.map((item) => {
      const studentTarget = answer?.[item.id]
      const correct = String(studentTarget) === String(item.target_id)
      return <div key={item.id}><MathContent html={item.premise_text || ''} /><span>Jawaban siswa: <strong>{targetText(studentTarget)}</strong></span><span>Kunci jawaban: <strong>{targetText(item.target_id)}</strong></span><b className={correct ? 'correct' : 'incorrect'}>{studentTarget ? correct ? 'Benar' : 'Salah' : 'Belum dijawab'}</b></div>
    })}</div>
  }

  if (question.type === 'essay') {
    return <div className="practice-review-essay"><span>Jawaban siswa</span><p>{String(answer)}</p><small>Isian singkat perlu diperiksa secara manual.</small></div>
  }

  return <p className="practice-review-note">Jawaban: {Array.isArray(answer) ? answer.join(', ') : typeof answer === 'object' ? JSON.stringify(answer) : String(answer)}</p>
}

function PracticeEmpty() {
  return <div className="practice-empty"><div className="practice-empty-icon"><Icon name="book" size={24} /></div><h2>Belum ada paket latihan</h2><p>Belum tersedia paket latihan untuk kategori ini.</p></div>
}
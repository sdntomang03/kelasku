import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1/student'

const iconPaths = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  clipboard: 'M9 4h6m-7 3h8M7 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2M8 4a2 2 0 0 1 4 0v1H8V4z',
  chart: 'M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8',
  user: 'M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v5l3 2',
  logout: 'M10 17l5-5-5-5m5 5H3m11-9h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-3',
  chevronDown: 'm6 9 6 6 6-6',
  filter: 'M4 6h16M7 12h10M10 18h4',
  book: 'M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2V5zm0 0v16a2 2 0 0 1 2-2h12',
}

function Icon({ name, size = 19 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconPaths[name]} /></svg>
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatQuestionType(type) {
  return {
    single_choice: 'Pilihan tunggal',
    tkp: 'Pilihan tunggal',
    multiple_choice: 'Pilihan kompleks',
    complex_choice: 'Pilihan kompleks',
    true_false: 'Benar / Salah',
    true_false_multi: 'Benar / Salah',
    matching: 'Menjodohkan',
    essay: 'Isian singkat',
  }[type] || type?.replaceAll('_', ' ') || 'Soal'
}

function answerExists(answer) {
  return Array.isArray(answer) ? answer.length > 0 : answer && typeof answer === 'object' ? Object.keys(answer).length > 0 : answer !== undefined && answer !== null && answer !== ''
}

function isExamCompleted(exam) {
  return String(exam?.status || '').toLowerCase() === 'completed'
}

function isExamOngoing(exam) {
  return ['ongoing', 'in_progress', 'active'].includes(exam?.status)
}

function isExamLocked(exam) {
  return Boolean(exam?.is_locked || exam?.locked || exam?.attempt?.is_locked)
}

function examRequiresToken(exam) {
  return Boolean(exam?.require_token ?? exam?.requires_token ?? exam?.config?.require_token)
}

function examShowsExplanation(exam, result) {
  return Boolean(result?.show_explanation ?? result?.config?.show_explanation ?? exam?.show_explanation ?? exam?.config?.show_explanation)
}

function getSchoolName(student) {
  return student?.school?.name || student?.school_name || 'Sekolah'
}

function getClassName(student) {
  return student?.classroom?.name || student?.classroom_name || 'Kelas belum tersedia'
}

function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}

function randomizeQuestion(question, config) {
  if (!config?.random_answer) return question
  const randomized = { ...question }
  if (Array.isArray(question.options)) randomized.options = shuffle(question.options)
  if (question.type === 'matching' && Array.isArray(question.matches)) {
    randomized.target_options = shuffle(question.matches.map((match) => ({ id: match.id, text: match.target_text })))
  }
  return randomized
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Terjadi kendala saat menghubungkan ke server.'
}

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('cbt_token')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const payload = await response.json()
  if (!response.ok || payload.success === false) throw new ApiError(payload.message || 'Request gagal', response.status)
  return payload.data
}

function Logo() {
  return <div className="brand"><span className="brand-mark">C</span><span>kelas<span className="brand-accent">ku</span></span></div>
}

function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const examId = location.pathname.match(/^\/exams\/([^/]+)/)?.[1]
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem('cbt_token')))
  const [student, setStudent] = useState(null)
  const [exams, setExams] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [selectedExam, setSelectedExam] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem('cbt_token')))
  const [dataError, setDataError] = useState('')
  const [login, setLogin] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [examToken, setExamToken] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [isTokenLoading, setIsTokenLoading] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [attempt, setAttempt] = useState(null)
  const [questionIds, setQuestionIds] = useState([])
  const [questions, setQuestions] = useState({})
  const [questionError, setQuestionError] = useState('')
  const [examResult, setExamResult] = useState(null)
  const [examConfig, setExamConfig] = useState({ random_question: false, random_answer: false })
  const [violationState, setViolationState] = useState({ count: 0, max: 0, locked: false, warning: false })
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const [answers, setAnswers] = useState({})
  const [doubtful, setDoubtful] = useState([])
  const [timeLeft, setTimeLeft] = useState(76 * 60 + 24)

  const completed = useMemo(() => exams.filter(isExamCompleted), [exams])
  const answeredCount = Object.keys(answers).length
  const attemptId = attempt?.id || selectedExam?.attempt?.id || selectedExam?.attempt_id
  const currentQuestionId = questionIds[activeQuestion]
  const currentQuestion = currentQuestionId ? questions[currentQuestionId] : null
  const attemptStorageKey = examId ? `cbt_exam_attempt_${examId}` : ''

  useEffect(() => {
    function closeProfileMenu(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', closeProfileMenu)
    return () => document.removeEventListener('mousedown', closeProfileMenu)
  }, [])

  useEffect(() => {
    if (!authenticated) return undefined
    let cancelled = false
    Promise.all([apiRequest('/profile'), apiRequest('/dashboard'), apiRequest('/exams')])
      .then(([profile, dashboardData, examData]) => {
        if (cancelled) return
        setStudent(profile)
        setDashboard(dashboardData)
        const latestExams = Array.isArray(examData) ? examData : []
        setExams(latestExams)
        setSelectedExam((current) => {
          if (!current) return current
          const latest = latestExams.find((exam) => String(exam.id) === String(current.id))
          return latest ? { ...current, ...latest } : current
        })
        setDataError('')
      })
      .catch((error) => {
        if (cancelled) return
        if (error?.status === 401) {
          localStorage.removeItem('cbt_token')
          setStudent(null)
          setAuthenticated(false)
          window.location.replace('/login')
          setDataError('Sesi login telah berakhir. Silakan masuk kembali.')
          return
        }
        setDataError(getErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [authenticated, location.pathname])

  useEffect(() => {
    if (!location.pathname.endsWith('/attempt')) return undefined
    const timer = setInterval(() => setTimeLeft((time) => Math.max(0, time - 1)), 1000)
    return () => clearInterval(timer)
  }, [location.pathname])

  useEffect(() => {
    if (!location.pathname.endsWith('/attempt') || !examId || attemptId || !authenticated) return undefined
    const stored = localStorage.getItem(`cbt_exam_attempt_${examId}`)
    if (!stored) return undefined
    try {
      const recovery = JSON.parse(stored)
      if (!recovery.attempt?.id || !Array.isArray(recovery.questionIds)) return undefined
      const recoveryTimer = setTimeout(() => {
        setAttempt(recovery.attempt)
        setQuestionIds(recovery.questionIds)
        setExamConfig(recovery.config || { random_question: false, random_answer: false })
        setAnswers(recovery.answers || {})
        setDoubtful(recovery.doubtful || [])
        setViolationState(recovery.violationState || { count: 0, max: 0, locked: false, warning: false })
        if (typeof recovery.activeQuestion === 'number') setActiveQuestion(Math.min(recovery.activeQuestion, recovery.questionIds.length - 1))
        apiRequest(`/attempts/${recovery.attempt.id}`)
          .then((serverAttempt) => {
            setAttempt(serverAttempt)
            setTimeLeft(typeof serverAttempt.remaining_seconds === 'number' ? serverAttempt.remaining_seconds : 0)
            setViolationState((state) => ({
              ...state,
              count: serverAttempt.violation_count ?? state.count,
              locked: Boolean(serverAttempt.is_locked),
            }))
          })
          .catch((error) => setQuestionError(getErrorMessage(error)))
      }, 0)
      return () => clearTimeout(recoveryTimer)
    } catch {
      localStorage.removeItem(`cbt_exam_attempt_${examId}`)
    }
  }, [location.pathname, examId, attemptId, authenticated])

  useEffect(() => {
    if (!location.pathname.endsWith('/attempt') || !attemptId || !currentQuestionId) return undefined
    if (questions[currentQuestionId]) return undefined
    let cancelled = false
    apiRequest(`/attempts/${attemptId}/questions/${currentQuestionId}`)
      .then((data) => {
        if (cancelled) return
        setQuestions((items) => ({ ...items, [currentQuestionId]: randomizeQuestion(data.question, examConfig) }))
        if (data.answer !== null && data.answer !== undefined) {
          let savedAnswer = data.answer
          if (typeof savedAnswer === 'string' && ['multiple_choice', 'complex_choice', 'matching', 'true_false', 'true_false_multi'].includes(data.question.type)) {
            try { savedAnswer = JSON.parse(savedAnswer) } catch { /* API may return a plain essay/string answer. */ }
          }
          setAnswers((items) => ({ ...items, [currentQuestionId]: savedAnswer }))
        }
        setDoubtful((items) => data.is_doubtful && !items.includes(currentQuestionId) ? [...items, currentQuestionId] : items.filter((id) => id !== currentQuestionId || data.is_doubtful))
        if (typeof data.remaining_seconds === 'number') setTimeLeft(data.remaining_seconds)
      })
      .catch((error) => { if (!cancelled) setQuestionError(getErrorMessage(error)) })
    return () => { cancelled = true }
  }, [location.pathname, attemptId, currentQuestionId, examConfig, questions])

  useEffect(() => {
    if (!attemptStorageKey || !attempt?.id || !questionIds.length) return
    localStorage.setItem(attemptStorageKey, JSON.stringify({
      attempt,
      questionIds,
      config: examConfig,
      answers,
      doubtful,
      activeQuestion,
      violationState,
    }))
  }, [attemptStorageKey, attempt, questionIds, examConfig, answers, doubtful, activeQuestion, violationState])

  useEffect(() => {
    if (!examId || !authenticated) return undefined
    let cancelled = false
    apiRequest(`/exams/${examId}`)
      .then((data) => { if (!cancelled) setSelectedExam(data) })
      .catch((error) => { if (!cancelled) setDataError(getErrorMessage(error)) })
    return () => { cancelled = true }
  }, [examId, location.pathname, authenticated])

  useEffect(() => {
    if (location.pathname !== '/results' || !attemptId || !authenticated) return undefined
    let cancelled = false
    apiRequest(`/attempts/${attemptId}/result`)
      .then((data) => { if (!cancelled) setExamResult(data) })
      .catch((error) => { if (!cancelled) setDataError(getErrorMessage(error)) })
    return () => { cancelled = true }
  }, [location.pathname, attemptId, authenticated])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginError('')
    setIsLoginLoading(true)
    try {
      const data = await apiRequest('/login', { method: 'POST', body: login })
      localStorage.setItem('cbt_token', data.token)
      setStudent(data.student)
      setAuthenticated(true)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setLoginError(getErrorMessage(error))
    } finally {
      setIsLoginLoading(false)
    }
  }

  function openExam(exam) {
    setSelectedExam({ ...exam })
    navigate(`/exams/${exam.id}`)
  }

  function openTokenPage() {
    setExamToken('')
    setTokenError('')
    navigate(`/exams/${selectedExam.id}/token`)
  }

  async function startExam(mode, token = '') {
    if (!selectedExam) return
    if (isExamLocked(selectedExam)) {
      setDataError('Ujian ini terkunci dan tidak dapat dilanjutkan.')
      return
    }
    if (mode === 'result') {
      navigate('/results')
      return
    }
    setTokenError('')
    setIsTokenLoading(true)
    try {
      const data = await apiRequest(`/exams/${selectedExam.id}/start`, {
        method: 'POST',
        body: token.trim() ? { token: token.trim() } : {},
      })
      setSelectedExam({ ...selectedExam, ...data.exam, attempt: data.attempt, question_ids: data.question_ids })
      setAttempt(data.attempt)
      setExamConfig(data.config || { random_question: false, random_answer: false })
      setViolationState({
        count: data.attempt?.violation_count || 0,
        max: data.config?.max_tolerances || 0,
        locked: Boolean(data.attempt?.is_locked),
        warning: false,
      })
      const questionOrder = data.config?.random_question ? shuffle(data.question_ids || []) : (data.question_ids || [])
      setQuestionIds(questionOrder)
      setQuestions({})
      setAnswers(data.existing_answers || {})
      setDoubtful(data.flags || [])
      if (typeof data.attempt?.remaining_seconds === 'number') setTimeLeft(data.attempt.remaining_seconds)
      localStorage.setItem(`cbt_exam_attempt_${selectedExam.id}`, JSON.stringify({
        attempt: data.attempt,
        questionIds: questionOrder,
        config: data.config || { random_question: false, random_answer: false },
        answers: data.existing_answers || {},
        doubtful: data.flags || [],
        activeQuestion: 0,
        violationState: {
          count: data.attempt?.violation_count || 0,
          max: data.config?.max_tolerances || 0,
          locked: Boolean(data.attempt?.is_locked),
          warning: false,
        },
      }))
    } catch (error) {
      if (token.trim() || examRequiresToken(selectedExam)) setTokenError(getErrorMessage(error))
      else setDataError(getErrorMessage(error))
      return
    } finally {
      setIsTokenLoading(false)
    }
    setActiveQuestion(0)
    navigate(`/exams/${selectedExam.id}/attempt`)
  }

  async function saveAnswer(questionId, answer, isDoubtful = doubtful.includes(questionId)) {
    if (!attemptId) return
    setAnswers((items) => ({ ...items, [questionId]: answer }))
    try {
      const data = await apiRequest(`/attempts/${attemptId}/answers`, {
        method: 'POST',
        body: { question_id: questionId, answer, is_doubtful: isDoubtful },
      })
      if (data.is_doubtful) setDoubtful((items) => items.includes(questionId) ? items : [...items, questionId])
    } catch (error) {
      setDataError(getErrorMessage(error))
    }
  }

  async function toggleDoubtful(questionId) {
    const nextValue = !doubtful.includes(questionId)
    setDoubtful((items) => nextValue ? [...items, questionId] : items.filter((id) => id !== questionId))
    if (answers[questionId] !== undefined) await saveAnswer(questionId, answers[questionId], nextValue)
  }

  const reportViolation = useCallback(async () => {
    if (!examConfig.enable_violation || !attemptId || violationState.locked) return
    try {
      const data = await apiRequest(`/attempts/${attemptId}/violation`, { method: 'POST', body: {} })
      const count = data.violation_count ?? violationState.count + 1
      const max = data.max_tolerances ?? examConfig.max_tolerances
      const locked = Boolean(data.is_locked) || (max > 0 && count >= max)
      setViolationState({ count, max, locked, warning: !locked })
    } catch (error) {
      setDataError(getErrorMessage(error))
    }
  }, [attemptId, examConfig.enable_violation, examConfig.max_tolerances, violationState.count, violationState.locked])

  const dismissViolationWarning = useCallback(() => {
    setViolationState((state) => ({ ...state, warning: false }))
  }, [])

  async function finishExam() {
    if (!selectedExam || !attemptId || isFinishing) return
    setIsFinishing(true)
    try {
      const result = await apiRequest(`/attempts/${attemptId}/submit`, { method: 'POST', body: {} })
      setExamResult(result)
      const [dashboardData, examData] = await Promise.all([apiRequest('/dashboard'), apiRequest('/exams')])
      setDashboard(dashboardData)
      setExams(Array.isArray(examData) ? examData : [])
      localStorage.removeItem(`cbt_exam_attempt_${selectedExam.id}`)
      navigate('/results')
    } catch (error) {
      setDataError(getErrorMessage(error))
    } finally {
      setIsFinishing(false)
    }
  }

  if (!authenticated) {
    if (location.pathname !== '/login') return <Navigate to="/login" replace />
    return <LoginScreen login={login} setLogin={setLogin} onSubmit={handleLogin} error={loginError} loading={isLoginLoading} />
  }
  if (location.pathname === '/login') return <Navigate to="/dashboard" replace />
  if (isLoading && !student) return <div className="loading-screen"><Logo /><p>Memuat data akun...</p></div>
  if (!student) return <div className="loading-screen"><Logo /><p>{dataError || 'Data akun tidak dapat dimuat.'}</p><button className="primary-button" onClick={() => { localStorage.removeItem('cbt_token'); setAuthenticated(false); navigate('/login') }}>Kembali ke login</button></div>

  const path = location.pathname
  const page = path.startsWith('/exams') ? (path.endsWith('/attempt') ? 'exam' : path.endsWith('/token') ? 'exam-token' : examId ? 'exam-detail' : 'exams') : path.startsWith('/results') ? 'results' : path.startsWith('/profile') ? 'profile' : 'dashboard'
  const currentExam = selectedExam?.id && String(selectedExam.id) === String(examId)
    ? selectedExam
    : exams.find((exam) => String(exam.id) === String(examId)) || selectedExam || null
  if (page === 'exam') return <ExamScreen exam={currentExam} question={currentQuestion} questionIds={questionIds} activeQuestion={activeQuestion} setActiveQuestion={setActiveQuestion} answers={answers} doubtful={doubtful} answeredCount={answeredCount} timeLeft={timeLeft} questionError={questionError} enableViolation={Boolean(examConfig.enable_violation)} violationState={violationState} onViolation={reportViolation} onDismissViolation={dismissViolationWarning} onAnswer={saveAnswer} onToggleDoubtful={toggleDoubtful} onFinish={finishExam} isFinishing={isFinishing} onExit={() => navigate('/dashboard')} />
  if (page === 'exam-token') return <TokenScreen exam={currentExam} token={examToken} setToken={setExamToken} error={tokenError} loading={isTokenLoading} onBack={() => navigate(`/exams/${examId}`)} onSubmit={() => startExam('start', examToken)} />
  return (
    <div className="app-shell">
      <div className={`mobile-sidebar-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Logo />
        <button className="mobile-close-button" onClick={() => setMobileMenuOpen(false)} aria-label="Tutup menu">×</button>
        <div className="workspace-switcher"><div className="school-avatar">{getSchoolName(student).slice(0, 1)}</div><div><strong>{getSchoolName(student)}</strong><span>{getClassName(student)}</span></div></div>
        <nav className="main-nav" aria-label="Navigasi utama">
          <span className="nav-label">MENU UTAMA</span>
          <NavItem icon="grid" label="Ringkasan" active={page === 'dashboard'} onClick={() => { setMobileMenuOpen(false); navigate('/dashboard') }} />
          <NavItem icon="clipboard" label="Ujian saya" active={page === 'exams' || page === 'exam-detail'} badge={exams.length} onClick={() => { setMobileMenuOpen(false); navigate('/exams') }} />
          <NavItem icon="chart" label="Hasil ujian" active={page === 'results'} onClick={() => { setMobileMenuOpen(false); navigate('/results') }} />
          <span className="nav-label nav-label-spaced">AKUN</span>
          <NavItem icon="user" label="Profil saya" active={page === 'profile'} onClick={() => { setMobileMenuOpen(false); navigate('/profile') }} />
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">?</div><strong>Butuh bantuan?</strong><span>Tim kami siap membantu kamu.</span><button>Hubungi kami <Icon name="arrow" size={14} /></button></div><button className="logout-button" onClick={async () => { try { await apiRequest('/logout', { method: 'POST', body: {} }) } finally { localStorage.removeItem('cbt_token'); setAuthenticated(false); navigate('/login') } }}><Icon name="logout" /> Keluar</button></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Buka menu"><span /><span /><span /></button><div className="mobile-logo"><Logo /></div><div className="breadcrumb"><span>Portal Siswa</span><b>/</b><strong>{page === 'dashboard' ? 'Ringkasan' : page === 'exams' ? 'Ujian saya' : page === 'results' ? 'Hasil ujian' : 'Profil saya'}</strong></div><div className="topbar-actions"><button className="icon-button notification"><Icon name="bell" /><i /></button><div className="profile-menu-wrap" ref={profileMenuRef}><button className="top-profile" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}><div className="avatar">{student?.name?.slice(0, 2).toUpperCase()}</div><div><strong>{student?.name}</strong><span>Siswa</span></div><Icon name="chevronDown" size={15} /></button>{profileOpen && <div className="profile-menu"><button onClick={() => { setProfileOpen(false); navigate('/profile') }}><Icon name="user" size={16} /> Profil saya</button><button onClick={async () => { try { await apiRequest('/logout', { method: 'POST', body: {} }) } finally { localStorage.removeItem('cbt_token'); setAuthenticated(false); setProfileOpen(false); navigate('/login') } }}><Icon name="logout" size={16} /> Keluar</button></div>}</div></div></header>
        {dataError && <div className="api-error">{dataError}</div>}
        <div className="content-wrap">{page === 'dashboard' && <Dashboard onExam={openExam} onPage={(target) => navigate(target === 'exams' ? '/exams' : '/results')} exams={exams} completed={completed} student={student} dashboard={dashboard} />}{page === 'exams' && <ExamList exams={exams} onExam={openExam} />}{page === 'exam-detail' && <ExamDetail exam={currentExam} onBack={() => navigate('/exams')} onStart={examRequiresToken(currentExam) ? openTokenPage : startExam} />}{page === 'results' && <Results exams={completed} result={examResult} allowExplanation={examShowsExplanation(currentExam, examResult)} />}{page === 'profile' && <Profile student={student} />}</div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, badge, onClick }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon name={icon} /><span>{label}</span>{badge && <em>{badge}</em>}</button> }

function Dashboard({ onExam, onPage, exams, completed, student, dashboard }) {
  const upcoming = exams.filter((exam) => !isExamCompleted(exam))
  const stats = dashboard?.stats || {}
  const progress = exams.length ? Math.round((completed.length / exams.length) * 100) : 0
  return <div className="page-enter"><div className="welcome-row"><div><p className="eyebrow">KAMIS, 24 SEPTEMBER 2026</p><h1>Selamat pagi, {student.name.split(' ')[0]} <span className="wave">✦</span></h1><p className="muted">Siap menaklukkan tantangan hari ini?</p></div><button className="outline-button" onClick={() => onPage('exams')}>Lihat semua ujian <Icon name="arrow" size={16} /></button></div>
    <section className="stats-grid"><StatCard label="Total ujian" value={stats.total_ujian ?? exams.length} detail="ujian terdaftar" icon="clipboard" tone="violet" /><StatCard label="Ujian selesai" value={stats.ujian_selesai ?? completed.length} detail={`dari ${stats.total_ujian ?? exams.length} ujian`} icon="chart" tone="green" /><StatCard label="Sedang aktif" value={stats.ujian_aktif ?? exams.filter(isExamOngoing).length} detail="Ujian yang sedang aktif" icon="clock" tone="orange" /><StatCard label="Rata-rata nilai" value={stats.rata_nilai ?? '—'} detail="Berdasarkan hasil ujian" icon="chart" tone="blue" /></section>
    <div className="dashboard-grid"><section className="section-card upcoming-card"><div className="section-heading"><div><h2>Ujian mendatang</h2><p className="muted">Jangan sampai terlewat, ya!</p></div><button className="text-button" onClick={() => onPage('exams')}>Lihat semua <Icon name="arrow" size={15} /></button></div>{upcoming.slice(0, 2).map((exam) => <ExamRow key={exam.id} exam={exam} onClick={() => onExam(exam)} />)}</section><section className="section-card progress-card"><div className="section-heading"><div><h2>Progress belajar</h2><p className="muted">Performa kamu berdasarkan ujian selesai</p></div><button className="more-button">•••</button></div><div className="progress-ring" style={{ background: `conic-gradient(#6c59d8 0 ${progress}%,#ecebf7 ${progress}% 100%)` }}><div><strong>{progress}%</strong><span>Selesai</span></div></div><div className="legend"><span><i className="dot violet" />Ujian selesai <b>{completed.length}</b></span><span><i className="dot pale" />Belum dikerjakan <b>{upcoming.length}</b></span></div></section></div>
    <section className="section-card recent-card"><div className="section-heading"><div><h2>Hasil terbaru</h2><p className="muted">Lihat pencapaian terbaikmu</p></div><button className="text-button" onClick={() => onPage('results')}>Lihat semua <Icon name="arrow" size={15} /></button></div>{completed.length ? completed.map((exam) => <ResultRow key={exam.id} exam={exam} />) : <div className="empty-state">Belum ada hasil ujian.</div>}</section>
  </div>
}

function StatCard({ label, value, detail, icon, tone }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function ExamRow({ exam, onClick }) { return <button className="exam-row" onClick={onClick}><div className={`subject-icon ${exam.color}`}><Icon name="clipboard" size={20} /></div><div className="row-main"><strong>{exam.title}</strong><span><span className="date-dot" />{formatDate(exam.start_time)} <i /> {exam.duration_minutes} menit <i /> {exam.total_questions} soal</span></div><span className={`status-pill ${isExamCompleted(exam) ? 'completed' : exam.status}`}>{isExamCompleted(exam) ? 'Selesai' : isExamOngoing(exam) ? 'Sedang dikerjakan' : 'Belum dimulai'}</span><Icon name="arrow" size={17} /></button> }
function ResultRow({ exam }) { return <div className="result-row"><div className={`subject-icon ${exam.color}`}><Icon name="chart" size={20} /></div><div className="row-main"><strong>{exam.title}</strong><span>{formatDate(exam.end_time)} <i /> {exam.total_questions} soal</span></div><div className="score"><strong>{exam.final_score}</strong><span>/ 100</span></div><span className="score-label">Sangat baik</span></div> }

function ExamList({ exams, onExam }) {
  const [filter, setFilter] = useState('all')
  const filteredExams = exams.filter((exam) => filter === 'all' || filter === 'completed' && isExamCompleted(exam) || filter === 'ongoing' && isExamOngoing(exam) || filter === 'not_started' && !isExamCompleted(exam) && !isExamOngoing(exam))
  const labels = { all: 'Semua status', completed: 'Selesai', ongoing: 'Sedang dikerjakan', not_started: 'Belum dimulai' }
  return <div className="page-enter"><div className="page-title-row"><div><p className="eyebrow">AKADEMIK</p><h1>Ujian saya</h1><p className="muted">Kelola dan kerjakan semua ujianmu di sini.</p></div><div className="filter-actions"><label className="filter-button"><Icon name="filter" size={15} /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter status ujian">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Icon name="chevronDown" size={14} /></label></div></div><div className="exam-list">{filteredExams.length ? filteredExams.map((exam) => { const completed = isExamCompleted(exam); const ongoing = isExamOngoing(exam); const locked = isExamLocked(exam); return <div className="list-exam-card" key={exam.id}><div className={`large-subject-icon ${exam.color}`}><Icon name="clipboard" size={25} /></div><div className="list-exam-content"><div className="list-top"><span className={`status-pill ${locked ? 'locked' : completed ? 'completed' : ongoing ? 'ongoing' : exam.status}`}>{locked ? 'Terkunci' : completed ? 'Selesai' : ongoing ? 'Sedang dikerjakan' : 'Tersedia'}</span><span className="list-code">ID {exam.id}</span></div><h2>{exam.title}</h2><p className="muted">{exam.subject || 'Ujian'} • {exam.total_questions} soal • {exam.duration_minutes} menit</p><div className="exam-progress"><div><span>Jadwal ujian</span><strong>{formatDate(exam.start_time)} · 08.00 WIB</strong></div>{completed ? <div className="mini-score"><span>Nilai</span><strong>{exam.final_score ?? '—'}</strong></div> : locked ? <span className="locked-hint">Ujian tidak dapat dilanjutkan</span> : <button className="primary-button small" onClick={() => onExam(exam)}>{ongoing ? 'Lanjutkan' : 'Lihat detail'} <Icon name="arrow" size={15} /></button>}</div></div></div> }) : <div className="empty-state">Tidak ada ujian dengan status “{labels[filter]}”.</div>}</div></div>
}

function TokenScreen({ exam, token, setToken, error, loading, onBack, onSubmit }) {
  return <div className="token-page"><div className="token-card"><Logo /><span className="eyebrow">VERIFIKASI UJIAN</span><h1>Masukkan token ujian</h1><p className="muted">Ujian <strong>{exam?.title || 'ini'}</strong> memerlukan token sebelum dapat dimulai.</p><form onSubmit={(event) => { event.preventDefault(); onSubmit() }}><label htmlFor="exam-token">Token ujian</label><input id="exam-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Masukkan token" autoComplete="off" autoFocus disabled={loading} />{error && <p className="form-error">{error}</p>}<div className="token-actions"><button type="button" className="secondary-button" onClick={onBack} disabled={loading}>Kembali</button><button type="submit" className="primary-button" disabled={loading || !token.trim()}>{loading ? 'Memverifikasi...' : 'Verifikasi & mulai'} <Icon name="arrow" size={16} /></button></div></form></div></div>
}

function ExamDetail({ exam, onBack, onStart }) {
  const completed = isExamCompleted(exam)
  const ongoing = isExamOngoing(exam)
  const locked = isExamLocked(exam)
  const statusLabel = locked ? 'TERKUNCI' : completed ? 'SELESAI' : ongoing ? 'SEDANG DIKERJAKAN' : 'TERSEDIA'
  return <div className="page-enter detail-page"><button className="back-button" onClick={onBack}>← Kembali ke ujian saya</button><div className="detail-hero"><div className={`large-subject-icon ${exam?.color}`}><Icon name="clipboard" size={30} /></div><div><span className={`status-pill ${locked ? 'locked' : completed ? 'completed' : ongoing ? 'ongoing' : 'available'}`}>{statusLabel}</span><h1>{exam?.title}</h1><p className="muted">Informasi dan status ujian berdasarkan data terbaru dari server.</p></div></div><div className="detail-layout"><div className="section-card detail-info"><h2>Informasi ujian</h2><div className="info-grid"><InfoItem label="Jadwal mulai" value={`${formatDate(exam?.start_time)} · 08.00 WIB`} /><InfoItem label="Durasi pengerjaan" value={`${exam?.duration_minutes} menit`} /><InfoItem label="Jumlah soal" value={`${exam?.total_questions} soal`} /><InfoItem label="Status" value={locked ? 'Terkunci' : completed ? 'Selesai' : ongoing ? 'Sedang dikerjakan' : 'Belum dimulai'} /></div><div className="notice-box"><span>ⓘ</span><div><strong>{locked ? 'Ujian terkunci' : completed ? 'Ujian telah selesai' : ongoing ? 'Kamu masih memiliki ujian aktif' : 'Pastikan kamu sudah siap'}</strong><p>{locked ? 'Ujian tidak dapat dilanjutkan karena akses telah dikunci.' : completed ? 'Jawaban sudah dikunci dan tidak dapat diubah.' : 'Waktu berjalan mengikuti server saat ujian dimulai.'}</p></div></div></div><div className="section-card start-card">{locked ? <><div className="start-card-top"><span className="small-label">AKSES DITOLAK</span><div className="start-illustration locked-mark">!</div></div><h2>Ujian tidak dapat dilanjutkan.</h2><p className="muted">Hubungi pengawas atau administrator jika menurutmu ini adalah kesalahan.</p></> : completed ? <><div className="start-card-top"><span className="small-label">UJIAN SELESAI</span><div className="start-illustration">✓</div></div><h2>Hasil sudah tersedia.</h2><p className="muted">Buka halaman hasil untuk melihat nilai ujian.</p><button className="primary-button wide" onClick={() => onStart('result')}>Lihat hasil <Icon name="arrow" size={17} /></button></> : <><div className="start-card-top"><span className="small-label">{ongoing ? 'LANJUTKAN UJIAN?' : 'SIAP UNTUK MULAI?'}</span><div className="start-illustration">✦</div></div><h2>{ongoing ? 'Lanjutkan pengerjaan.' : 'Kerjakan dengan percaya diri.'}</h2><p className="muted">Cari tempat yang tenang dan pastikan koneksi internetmu stabil.</p><button className="primary-button wide" onClick={onStart}>{ongoing ? 'Lanjutkan ujian' : 'Mulai ujian'} <Icon name="arrow" size={17} /></button></>}</div></div></div>
}
function InfoItem({ label, value }) { return <div className="info-item"><span>{label}</span><strong>{value}</strong></div> }

function Results({ exams, result, allowExplanation }) {
  const score = result?.score ?? result?.average_score
  const explanationItems = result?.questions || result?.explanations || []
  return <div className="page-enter">
    <div className="page-title-row"><div><p className="eyebrow">PERFORMA</p><h1>Hasil ujian</h1><p className="muted">Pantau perkembangan dan pencapaian belajarmu.</p></div>{score !== undefined && <div className="average-box"><span>NILAI UJIAN TERAKHIR</span><strong>{score}</strong><small>{result.status === 'completed' ? 'Ujian telah selesai' : result.status}</small></div>}</div>
    {result && <section className="result-highlight"><div className="result-medal">✓</div><div><span className="eyebrow">HASIL UJIAN TERBARU</span><h2>{result.exam?.title || 'Ujian selesai'}</h2><p className="muted">Attempt #{result.attempt_id} · Mode penilaian {result.result_mode || 'average'}</p></div><div className="result-highlight-score"><strong>{score ?? '—'}</strong><span>/ 100</span></div></section>}
    <div className="results-summary"><div><span>Ujian selesai</span><strong>{exams.length}</strong></div><div><span>Nilai tertinggi</span><strong>{exams.length ? Math.max(...exams.map((exam) => exam.final_score || 0)) : score || 0}</strong></div><div><span>Total soal dijawab</span><strong>{exams.reduce((total, exam) => total + (exam.total_questions || 0), 0)}</strong></div></div>
    <section className="section-card results-table"><div className="section-heading"><div><h2>Riwayat ujian</h2><p className="muted">Semua hasil ujian yang telah kamu selesaikan.</p></div></div>{exams.map((exam) => <ResultRow key={exam.id} exam={exam} />)}</section>
    {result?.sections?.length > 0 && <section className="section-card result-sections"><div className="section-heading"><div><h2>Rincian bagian ujian</h2><p className="muted">Nilai berdasarkan section yang dikembalikan API.</p></div></div>{result.sections.map((section, index) => <div className="section-result-row" key={section.id || index}><span>{section.name || `Bagian ${index + 1}`}</span><strong>{section.score ?? section.average_score ?? '—'}</strong></div>)}</section>}
    {allowExplanation && <ExplanationSection items={explanationItems} text={result?.explanation_text || result?.explanation} />}
  </div>
}

function ExplanationSection({ items, text }) {
  const [open, setOpen] = useState(false)
  if (!items.length && !text) return null
  return <section className="section-card explanation-section"><div className="section-heading"><div><p className="eyebrow">PEMBELAJARAN</p><h2>Pembahasan ujian</h2><p className="muted">Pelajari penjelasan untuk memahami jawaban dan materi soal.</p></div><button className="primary-button small" onClick={() => setOpen((value) => !value)}>{open ? 'Sembunyikan' : 'Lihat pembahasan'} <Icon name="book" size={15} /></button></div>{open && <div className="explanation-list">{text && <div className="explanation-intro"><ImageRichContent html={text} className="rich-text" /></div>}{items.map((item, index) => <article className="explanation-item" key={item.id || item.question_id || index}><div className="explanation-item-head"><span>SOAL {index + 1}</span><strong>{item.is_correct === true ? 'Benar' : item.is_correct === false ? 'Perlu dipelajari' : ''}</strong></div>{item.content && <ImageRichContent html={item.content} className="rich-text explanation-question" />}{item.explanation && <ImageRichContent html={item.explanation} className="rich-text" />}</article>)}</div>}</section>
}
function Profile({ student }) {
  const initials = student?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <div className="page-enter"><div className="page-title-row"><div><p className="eyebrow">AKUN</p><h1>Profil saya</h1><p className="muted">Informasi siswa yang terdaftar pada akunmu.</p></div></div><section className="section-card profile-card"><div className="profile-cover" /><div className="profile-body"><div className="profile-avatar">{initials}</div><h2>{student.name}</h2><p className="muted">Siswa terdaftar</p><div className="profile-fields"><InfoItem label="ID siswa" value={student.id} /><InfoItem label="Username / NIS" value={student.username} /><InfoItem label="Sekolah" value={getSchoolName(student)} /><InfoItem label="Kelas" value={getClassName(student)} /></div></div></section></div>
}

function LoginScreen({ login, setLogin, onSubmit, error, loading }) { return <div className="login-page"><div className="login-decoration decor-one" /><div className="login-decoration decor-two" /><div className="login-panel"><Logo /><div className="login-copy"><span className="eyebrow">PORTAL SISWA</span><h1>Belajar lebih terarah,<br /><em>berprestasi lebih hebat.</em></h1><p>Tempat kamu mengerjakan ujian, melihat hasil, dan melacak perkembangan belajar.</p></div><div className="login-quote"><span>“</span><p>Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.</p></div></div><div className="login-form-wrap"><div className="login-form"><div className="mobile-login-logo"><Logo /></div><span className="eyebrow">SELAMAT DATANG KEMBALI</span><h2>Masuk ke akunmu</h2><p className="muted">Gunakan username dan password yang terdaftar.</p><form onSubmit={onSubmit}><label>Username / NIS<input required value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} placeholder="Contoh: 123456" /></label><label>Password<div className="password-wrap"><input required type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} placeholder="Masukkan password" /><span>◉</span></div></label>{error && <p className="form-error">{error}</p>}<button className="primary-button login-button" disabled={loading}>{loading ? 'Memproses...' : 'Masuk ke portal'} <Icon name="arrow" size={17} /></button></form><p className="login-help">Lupa password? <button>Hubungi admin sekolah</button></p></div><footer>© 2026 kelasku · Portal Ujian Digital</footer></div></div> }

function ExamScreen({ exam, question, questionIds, activeQuestion, setActiveQuestion, answers, doubtful, answeredCount, timeLeft, questionError, enableViolation, violationState, onViolation, onDismissViolation, onAnswer, onToggleDoubtful, onFinish, isFinishing, onExit }) {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')
  const totalQuestions = questionIds.length
  const questionId = questionIds[activeQuestion]
  const [questionListOpen, setQuestionListOpen] = useState(false)
  const [violationBusy, setViolationBusy] = useState(false)
  const requestExamFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!enableViolation || violationState.locked) return undefined
    let lastReport = 0
    const detectViolation = async () => {
      const now = Date.now()
      if (now - lastReport < 1500 || violationBusy) return
      lastReport = now
      setViolationBusy(true)
      try {
        await onViolation()
      } finally {
        setViolationBusy(false)
      }
    }
    const onVisibilityChange = () => { if (document.hidden) detectViolation() }
    const onBlur = () => detectViolation()
    const onFullscreenChange = () => { if (!document.fullscreenElement) detectViolation() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    requestExamFullscreen()
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [enableViolation, violationState.locked, violationBusy, onViolation, requestExamFullscreen])

  if (violationState.locked) return <ViolationLockedScreen count={violationState.count} onExit={onExit} />
  if (!question) return <div className="loading-screen"><Logo /><p>{questionError || 'Memuat soal...'}</p><button className="secondary-button" onClick={onExit}>Keluar dari ujian</button></div>
  const answer = answers[questionId]
  const update = (value) => onAnswer(questionId, value)
  const questionList = <><div className="question-nav-summary"><span className="small-label">DAFTAR SOAL</span><strong>{answeredCount} <small>/ {totalQuestions}</small></strong><div className="thin-progress"><i style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }} /></div></div><div className="question-grid">{questionIds.map((id, index) => <button key={id} className={`${index === activeQuestion ? 'current' : ''} ${answerExists(answers[id]) ? 'answered' : ''} ${doubtful.includes(id) ? 'doubtful' : ''}`} onClick={() => { setActiveQuestion(index); setQuestionListOpen(false) }}>{index + 1}</button>)}</div><div className="question-legend"><span><i className="legend-current" />Sedang dikerjakan</span><span><i className="legend-answered" />Sudah dijawab</span><span><i className="legend-doubtful" />Ragu-ragu</span></div><div className="exam-tip"><strong>Tips</strong><p>Kamu bisa menandai soal sebagai ragu-ragu untuk ditinjau kembali nanti.</p></div></>
  return <div className="exam-screen">{violationState.warning && <ViolationWarning count={violationState.count} max={violationState.max} onDismiss={() => { onDismissViolation(); requestExamFullscreen() }} />}<header className="exam-topbar"><Logo /><div className="exam-title"><span>SEDANG MENGERJAKAN</span><strong>{exam?.title}</strong></div><div className="exam-timer"><Icon name="clock" size={17} /><div><span>Sisa waktu</span><strong className={timeLeft < 300 ? 'urgent' : ''}>{minutes}:{seconds}</strong></div></div><button className="exam-question-button" onClick={() => setQuestionListOpen(true)}><Icon name="grid" size={15} /> Soal</button><button className="exit-exam" onClick={onExit}>Keluar</button></header><div className="exam-body"><aside className="question-nav">{questionList}</aside><main className="question-area"><div className="question-toolbar"><div className="question-meta"><span className="question-number">NO. <b>{activeQuestion + 1}</b></span><span className="question-type">{formatQuestionType(question.type)}</span></div><div className="question-tools"><div className="zoom-control"><button>A-</button><button>A</button><button>A+</button></div><button className={`doubtful-button ${doubtful.includes(questionId) ? 'selected' : ''}`} onClick={() => onToggleDoubtful(questionId)}>⚑ <span className="doubtful-label">{doubtful.includes(questionId) ? 'Ditandai' : 'Ragu-ragu'}</span></button></div></div><div className="question-card blade-question-card"><ImageRichContent html={question.content} className="question-content" /><QuestionAnswer key={questionId} type={question.type} question={question} value={answer} onChange={update} /></div><div className="question-footer"><button className="secondary-button" disabled={activeQuestion === 0} onClick={() => setActiveQuestion((value) => value - 1)}>← <span>Sebelumnya</span></button>{activeQuestion === totalQuestions - 1 ? <button type="button" className="primary-button" disabled={isFinishing} onClick={onFinish}>{isFinishing ? 'Mengirim jawaban...' : 'Selesaikan ujian'} <Icon name="arrow" size={16} /></button> : <button type="button" className="primary-button" onClick={() => setActiveQuestion((value) => value + 1)}>Soal berikutnya <Icon name="arrow" size={16} /></button>}</div></main></div>{questionListOpen && <div className="question-modal-backdrop" onClick={() => setQuestionListOpen(false)}><div className="question-modal" onClick={(event) => event.stopPropagation()}><div className="question-modal-header"><div><span className="small-label">NAVIGASI UJIAN</span><h2>Daftar soal</h2></div><button onClick={() => setQuestionListOpen(false)}>×</button></div>{questionList}</div></div>}</div>
}

function ViolationWarning({ count, max, onDismiss }) {
  return <div className="violation-warning"><div className="violation-warning-card"><div className="violation-alert-icon">!</div><span className="eyebrow">PELANGGARAN TERDETEKSI</span><h2>Peringatan keamanan ke-{count}</h2><p>Jangan berpindah tab, keluar dari layar ujian, atau membuka aplikasi lain. Ujian akan dikunci saat mencapai {max} pelanggaran.</p><button className="primary-button" onClick={onDismiss}>Saya mengerti</button></div></div>
}

function ViolationLockedScreen({ count, onExit }) {
  return <div className="violation-locked-screen"><div className="violation-lock-icon">!</div><p className="eyebrow">AKSES UJIAN DIHENTIKAN</p><h1>Ujian terkunci</h1><p>Ujian ditutup karena batas pelanggaran keamanan telah tercapai.</p><span>Total pelanggaran: {count}</span><button className="primary-button" onClick={onExit}>Kembali ke dashboard <Icon name="arrow" size={16} /></button></div>
}

function ImageRichContent({ html, className = '' }) {
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef(null)
  const close = () => { setImage(null); setZoom(1); setPosition({ x: 0, y: 0 }); setDragging(false) }
  const updateZoom = (nextZoom) => {
    setZoom(nextZoom)
    if (nextZoom <= 1) setPosition({ x: 0, y: 0 })
  }
  const toggleZoom = () => updateZoom(zoom > 1 ? 1 : 2)
  const handlePointerDown = (event) => {
    if (zoom <= 1) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, position }
    setDragging(true)
  }
  const handlePointerMove = (event) => {
    if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) return
    setPosition({
      x: dragStart.current.position.x + event.clientX - dragStart.current.x,
      y: dragStart.current.position.y + event.clientY - dragStart.current.y,
    })
  }
  const stopDragging = (event) => {
    if (dragStart.current?.pointerId === event.pointerId) {
      dragStart.current = null
      setDragging(false)
    }
  }
  return <><div className={className} onClick={(event) => {
    const target = event.target.closest?.('img')
    if (target) { setImage({ src: target.currentSrc || target.src, alt: target.alt || 'Gambar soal' }); setZoom(1); setPosition({ x: 0, y: 0 }) }
  }} dangerouslySetInnerHTML={{ __html: html }} />{image && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Pratinjau gambar" onClick={close}><div className="image-lightbox-panel" onClick={(event) => event.stopPropagation()}><div className="image-lightbox-toolbar"><span>Pratinjau gambar</span><div><button type="button" onClick={() => updateZoom(Math.max(.5, zoom - .25))} aria-label="Perkecil gambar">−</button><strong>{Math.round(zoom * 100)}%</strong><button type="button" onClick={() => updateZoom(Math.min(3, zoom + .25))} aria-label="Perbesar gambar">+</button><button type="button" onClick={close} aria-label="Tutup pratinjau">×</button></div></div><div className={`image-lightbox-viewport ${dragging ? 'dragging' : ''}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={stopDragging} onPointerCancel={stopDragging} onDoubleClick={toggleZoom}><img src={image.src} alt={image.alt} draggable="false" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})` }} /></div></div></div>}</>
}

function QuestionAnswer({ type, question, value, onChange }) {
  if (['single_choice', 'tkp'].includes(type)) return <div className="answer-options">{(question.options || []).map((option, index) => { const selected = String(value) === String(option.id); return <button key={option.id} className={selected ? 'selected' : ''} onClick={() => onChange(option.id)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><span dangerouslySetInnerHTML={{ __html: option.option_text }} />{selected && <b>✓</b>}</button> })}</div>
  if (['multiple_choice', 'complex_choice'].includes(type)) return <div className="answer-options">{(question.options || []).map((option) => { const selected = Array.isArray(value) && value.some((id) => String(id) === String(option.id)); return <button key={option.id} className={selected ? 'selected' : ''} onClick={() => onChange(selected ? value.filter((id) => String(id) !== String(option.id)) : [...(Array.isArray(value) ? value : []), option.id])}><span className="choice-check">{selected ? '✓' : ''}</span><span dangerouslySetInnerHTML={{ __html: option.option_text }} /></button> })}</div>
  if (['true_false', 'true_false_multi'].includes(type)) return <div className="true-false-table"><div className="tf-head"><span>Pernyataan</span><b>Benar</b><b>Salah</b></div>{(question.options || []).map((option) => <div className="tf-row" key={option.id}><span dangerouslySetInnerHTML={{ __html: option.option_text }} /><label><input type="radio" name={`tf-${option.id}`} checked={value?.[option.id] === 'benar'} onChange={() => onChange({ ...(value || {}), [option.id]: 'benar' })} /></label><label><input type="radio" name={`tf-${option.id}`} checked={value?.[option.id] === 'salah'} onChange={() => onChange({ ...(value || {}), [option.id]: 'salah' })} /></label></div>)}</div>
  if (type === 'matching') return <MatchingAnswer question={question} value={value} onChange={onChange} />
  if (type === 'essay') return <EssayAnswer value={value} onChange={onChange} />
  return <div className="muted">Jenis soal belum didukung oleh tampilan ini.</div>
}

function EssayAnswer({ value, onChange }) {
  const [draft, setDraft] = useState(value || '')
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== (value || '')) onChange(draft)
    }, 700)
    return () => clearTimeout(timer)
  }, [draft, onChange, value])
  return <div className="essay-answer"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ketik jawaban singkat Anda di sini..." /><span>{draft.length} Karakter</span></div>
}

function MatchingAnswer({ question, value, onChange }) {
  const containerRef = useRef(null)
  const premiseRefs = useRef({})
  const targetRefs = useRef({})
  const [activePremise, setActivePremise] = useState(null)
  const [lines, setLines] = useState([])
  const matches = question.matches || []
  const targets = question.target_options || matches.map((item) => ({ id: item.id, text: item.target_text }))
  const current = useMemo(() => value || {}, [value])

  const lineFor = useCallback((premiseId, targetId) => {
    const root = containerRef.current?.getBoundingClientRect()
    const premise = premiseRefs.current[premiseId]?.getBoundingClientRect()
    const target = targetRefs.current[targetId]?.getBoundingClientRect()
    if (!root || !premise || !target) return null
    return {
      x1: premise.right - root.left,
      y1: premise.top + premise.height / 2 - root.top,
      x2: target.left - root.left,
      y2: target.top + target.height / 2 - root.top,
    }
  }, [])

  const buildLines = useCallback(() => {
    return Object.entries(current).map(([premiseId, targetId]) => lineFor(premiseId, targetId)).filter(Boolean)
  }, [current, lineFor])

  useEffect(() => {
    const update = () => setLines(buildLines())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [buildLines])

  useEffect(() => {
    const timer = setTimeout(() => setLines(buildLines()), 0)
    return () => clearTimeout(timer)
  }, [buildLines])

  function connect(targetId) {
    if (!activePremise) return
    onChange({ ...current, [activePremise]: targetId })
    setActivePremise(null)
  }

  return <div className="matching-answer line-matching" ref={containerRef}><svg className="matching-lines" aria-hidden="true">{lines.map((line, index) => <line key={index} {...line} />)}</svg><div className="matching-column"><span className="matching-heading">Pernyataan</span>{matches.map((item) => <button className={`match-item ${activePremise === item.id ? 'active' : ''} ${current[item.id] ? 'connected' : ''}`} ref={(node) => { premiseRefs.current[item.id] = node }} key={item.id} onClick={() => setActivePremise(item.id)}><span dangerouslySetInnerHTML={{ __html: item.premise_text }} /><i>{current[item.id] ? 'Terhubung' : 'Pilih'}</i></button>)}</div><div className="matching-column"><span className="matching-heading">Pilihan pasangan</span>{targets.map((target) => <button className={`target-item ${Object.values(current).some((id) => String(id) === String(target.id)) ? 'connected' : ''}`} ref={(node) => { targetRefs.current[target.id] = node }} key={target.id} onClick={() => connect(target.id)} dangerouslySetInnerHTML={{ __html: target.text }} />)}</div></div>
}

export default App

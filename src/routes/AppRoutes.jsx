import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../api/client'
import Icon from '../components/common/Icon'
import IntegrityModal from '../components/common/IntegrityModal'
import { authService } from '../services/authService'
import { dashboardService } from '../services/dashboardService'
import { examService } from '../services/examService'
import { getErrorMessage } from '../utils/api'
import { randomizeQuestion, shuffle } from '../utils/question'
import { examRequiresToken, getClassName, getSchoolName, isExamCompleted, isExamLocked } from '../utils/exam'
import { useExamAttempt } from '../hooks/useExamAttempt'
import { useExamAutosave } from '../hooks/useExamAutosave'
import { useExamTimer } from '../hooks/useExamTimer'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import ExamListPage from '../pages/ExamListPage'
import ExamDetailPage from '../pages/ExamDetailPage'
import ResultsPage from '../pages/ResultsPage'
import ProfilePage from '../pages/ProfilePage'
import TokenPage from '../pages/TokenPage'
import ExamAttemptPage from '../pages/ExamAttemptPage'
import QuestionDiscussionPage from '../pages/QuestionDiscussionPage'
import { attemptService } from '../services/attemptService'

function Logo() {
  return <div className="brand"><span className="brand-mark">C</span><span>kelas<span className="brand-accent">ku</span></span></div>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RouteEntry routeKind="login" />} />
      <Route path="/dashboard" element={<RouteEntry routeKind="dashboard" />} />
      <Route path="/exams" element={<RouteEntry routeKind="exams" />} />
      <Route path="/exams/:examId" element={<RouteEntry routeKind="exam-detail" />} />
      <Route path="/exams/:examId/token" element={<RouteEntry routeKind="exam-token" />} />
      <Route path="/exams/:examId/attempt" element={<RouteEntry routeKind="exam" />} />
      <Route path="/results" element={<RouteEntry routeKind="results" />} />
      <Route path="/results/discussion" element={<RouteEntry routeKind="discussion" />} />
      <Route path="/results/discussion/:questionId" element={<RouteEntry routeKind="discussion" />} />
      <Route path="/profile" element={<RouteEntry routeKind="profile" />} />
      <Route path="*" element={<RouteEntry routeKind="dashboard" />} />
    </Routes>
  )
}

function RouteEntry({ routeKind }) {
  const { examId, questionId } = useParams()
  return <AppContent routeKind={routeKind} examId={examId} questionId={questionId} />
}

function AppContent({ routeKind, examId, questionId }) {
  const navigate = useNavigate()

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
  const [integrityOpen, setIntegrityOpen] = useState(false)
  const [integritySeconds, setIntegritySeconds] = useState(10)
  const [integrityAction, setIntegrityAction] = useState(null)
  const [examResult, setExamResult] = useState(null)
  const [discussion, setDiscussion] = useState(null)
  const [examConfig, setExamConfig] = useState({ random_question: false, random_answer: false })
  const [violationState, setViolationState] = useState({ count: 0, max: 0, locked: false, warning: false })
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState(76 * 60 + 24)

  useEffect(() => {
    if (!integrityOpen) return undefined
    const timer = setInterval(() => {
      setIntegritySeconds((seconds) => {
        if (seconds <= 1) {
          clearInterval(timer)
          return 0
        }
        return seconds - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [integrityOpen])

  const examAttempt = useExamAttempt(null)
  const saveAnswerRequest = useExamAutosave(examAttempt.attempt?.id || selectedExam?.attempt?.id || selectedExam?.attempt_id)
  const { questionIds, setQuestionIds, activeQuestion, setActiveQuestion, questions, setQuestions, answers, setAnswers, doubtful, setDoubtful, attempt, setAttempt } = examAttempt
  const attemptId = attempt?.id || selectedExam?.attempt?.id || selectedExam?.attempt_id
  const currentQuestionId = questionIds[activeQuestion]
  const currentQuestion = currentQuestionId ? questions[currentQuestionId] : null
  const attemptStorageKey = examId ? `cbt_exam_attempt_${examId}` : ''
  const completed = useMemo(() => exams.filter(isExamCompleted), [exams])
  const answeredCount = Object.keys(answers).length

  useExamTimer({ timeLeft, setTimeLeft, enabled: routeKind === 'exam' })

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
    Promise.all([authService.profile(), dashboardService.get(), examService.list()])
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
  }, [authenticated, routeKind, examId])

  useEffect(() => {
    if (routeKind !== 'exam' || !examId || attemptId || !authenticated) return undefined
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
          .catch((error) => setDataError(getErrorMessage(error)))
      }, 0)
      return () => clearTimeout(recoveryTimer)
    } catch {
      localStorage.removeItem(`cbt_exam_attempt_${examId}`)
    }
    return undefined
  }, [routeKind, examId, attemptId, authenticated, setActiveQuestion, setAnswers, setAttempt, setDoubtful, setExamConfig, setQuestionIds, setViolationState])

  useEffect(() => {
    if (routeKind !== 'exam' || !attemptId || !currentQuestionId) return undefined
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
      .catch((error) => { if (!cancelled) setDataError(getErrorMessage(error)) })
    return () => { cancelled = true }
  }, [routeKind, attemptId, currentQuestionId, examConfig, questions, setAnswers, setDataError, setDoubtful, setQuestions, setTimeLeft])

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
    examService.detail(examId)
      .then((data) => { if (!cancelled) setSelectedExam(data) })
      .catch((error) => { if (!cancelled) setDataError(getErrorMessage(error)) })
    return () => { cancelled = true }
  }, [examId, authenticated])

  useEffect(() => {
    if (routeKind !== 'results' || !attemptId || !authenticated) return undefined
    let cancelled = false
    attemptService.result(attemptId)
      .then((result) => { if (!cancelled) setExamResult(result) })
      .catch((error) => { if (!cancelled) setDataError(getErrorMessage(error)) })
    return () => { cancelled = true }
  }, [routeKind, attemptId, authenticated])

  useEffect(() => {
    if (routeKind !== 'discussion' || !authenticated) return undefined
    let cancelled = false
    let discussionAttemptId = attemptId
    if (!discussionAttemptId) {
      try {
        discussionAttemptId = JSON.parse(localStorage.getItem('cbt_discussion_context') || '{}').attemptId
      } catch {
        discussionAttemptId = null
      }
    }
    if (!discussionAttemptId) return undefined
    attemptService.discussion(discussionAttemptId)
      .then((data) => { if (!cancelled) setDiscussion(data) })
      .catch((error) => { if (!cancelled) setDataError(getErrorMessage(error)) })
    return () => { cancelled = true }
  }, [routeKind, attemptId, authenticated])

  const handleLogin = useCallback(async (event) => {
    event.preventDefault()
    setLoginError('')
    setIsLoginLoading(true)
    try {
      const data = await authService.login(login)
      localStorage.setItem('cbt_token', data.token)
      setStudent(data.student)
      setAuthenticated(true)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setLoginError(getErrorMessage(error))
    } finally {
      setIsLoginLoading(false)
    }
  }, [login, navigate])

  const openExam = useCallback((exam) => {
    setSelectedExam({ ...exam })
    navigate(`/exams/${exam.id}`)
  }, [navigate])

  const openExplanation = useCallback((exam) => {
    try {
      const selected = exams.find((item) => String(item.id) === String(exam.id)) || exam
      const showExplanation = selected.show_explanation === true || selected.show_explanation === 1 || selected.show_explanation === '1' || selected.show_explanation === 'true'
      if (!showExplanation) {
        setDataError('Pembahasan belum diaktifkan untuk ujian ini.')
        return
      }
      const storedAttempt = localStorage.getItem(`cbt_completed_attempt_${exam.id}`)
      const cachedAttempt = storedAttempt ? JSON.parse(storedAttempt) : null
      const matchingAttempt = String(selectedExam?.id) === String(exam.id)
        ? selectedExam.attempt || selectedExam.attempt_id
        : exam.attempt || exam.attempt_id || cachedAttempt
      if (!matchingAttempt?.id && !matchingAttempt) {
        setDataError('Attempt selesai untuk pembahasan ujian ini tidak ditemukan.')
        return
      }
      setSelectedExam({ ...selected, attempt: matchingAttempt.id ? matchingAttempt : { id: matchingAttempt } })
      setExamResult(null)
      setDiscussion(null)
      localStorage.setItem('cbt_discussion_context', JSON.stringify({
        exam: selected,
        attemptId: matchingAttempt.id || matchingAttempt,
      }))
      navigate('/results/discussion')
    } catch (error) {
      setDataError(getErrorMessage(error))
    }
  }, [exams, navigate, selectedExam])

  const openTokenPage = useCallback(() => {
    setExamToken('')
    setTokenError('')
    navigate(`/exams/${selectedExam.id}/token`)
  }, [navigate, selectedExam])

  const startExam = useCallback(async (mode, token = '') => {
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
    let hasExistingAnswers
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
      hasExistingAnswers = Object.keys(data.existing_answers || {}).length > 0
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
    if (!hasExistingAnswers) {
      setIntegritySeconds(10)
      setIntegrityAction({ mode: 'attempt' })
      setIntegrityOpen(true)
      return
    }
    setActiveQuestion(0)
    navigate(`/exams/${selectedExam.id}/attempt`)
  }, [navigate, selectedExam, setActiveQuestion, setAnswers, setAttempt, setDoubtful, setExamConfig, setQuestionIds, setQuestions, setTimeLeft, setViolationState])

  const confirmIntegrity = useCallback(() => {
    if (integritySeconds > 0 || !integrityAction) return
    setIntegrityOpen(false)
    setIntegrityAction(null)
    setActiveQuestion(0)
    navigate(`/exams/${selectedExam.id}/attempt`)
  }, [integrityAction, integritySeconds, navigate, selectedExam, setActiveQuestion])

  const saveAnswer = useCallback(async (questionId, answer, isDoubtful = doubtful.includes(questionId)) => {
    if (!attemptId) return
    setAnswers((items) => ({ ...items, [questionId]: answer }))
    try {
      const data = await saveAnswerRequest(questionId, answer, isDoubtful)
      if (data?.is_doubtful) setDoubtful((items) => items.includes(questionId) ? items : [...items, questionId])
    } catch (error) {
      setDataError(getErrorMessage(error))
    }
  }, [attemptId, doubtful, saveAnswerRequest, setAnswers, setDoubtful])

  const toggleDoubtful = useCallback(async (questionId) => {
    const nextValue = !doubtful.includes(questionId)
    setDoubtful((items) => nextValue ? [...items, questionId] : items.filter((id) => id !== questionId))
    if (answers[questionId] !== undefined) await saveAnswer(questionId, answers[questionId], nextValue)
  }, [answers, doubtful, saveAnswer, setDoubtful])

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

  const finishExam = useCallback(async () => {
    if (!selectedExam || !attemptId || isFinishing) return
    setIsFinishing(true)
    try {
      const [result] = await Promise.all([
        apiRequest(`/attempts/${attemptId}/submit`, { method: 'POST', body: {} }),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ])
      setExamResult(result)
      localStorage.setItem(`cbt_completed_attempt_${selectedExam.id}`, JSON.stringify({ id: attemptId }))
      const [dashboardData, examData] = await Promise.all([dashboardService.get(), examService.list()])
      setDashboard(dashboardData)
      setExams(Array.isArray(examData) ? examData : [])
      localStorage.removeItem(`cbt_exam_attempt_${selectedExam.id}`)
      navigate('/results')
    } catch (error) {
      setDataError(getErrorMessage(error))
    } finally {
      setIsFinishing(false)
    }
  }, [attemptId, isFinishing, navigate, selectedExam])

  const currentExam = selectedExam?.id && String(selectedExam.id) === String(examId)
    ? selectedExam
    : exams.find((exam) => String(exam.id) === String(examId)) || selectedExam || null

  if (!authenticated) {
    if (routeKind === 'login') {
      return <LoginPage login={login} setLogin={setLogin} onSubmit={handleLogin} error={loginError} loading={isLoginLoading} />
    }
    return <Navigate to="/login" replace />
  }

  if (routeKind === 'login') return <Navigate to="/dashboard" replace />
  if (isLoading && !student) return <div className="loading-screen"><Logo /><p>Memuat data akun...</p></div>
  if (!student) return <div className="loading-screen"><Logo /><p>{dataError || 'Data akun tidak dapat dimuat.'}</p><button className="primary-button" onClick={() => { localStorage.removeItem('cbt_token'); setAuthenticated(false); navigate('/login') }}>Kembali ke login</button></div>

  const page = routeKind

  if (page === 'exam') {
    return (
      <ExamAttemptPage
        exam={currentExam}
        question={currentQuestion}
        questionIds={questionIds}
        activeQuestion={activeQuestion}
        setActiveQuestion={setActiveQuestion}
        answers={answers}
        doubtful={doubtful}
        answeredCount={answeredCount}
        timeLeft={timeLeft}
        questionError={dataError}
        enableViolation={Boolean(examConfig.enable_violation)}
        violationState={violationState}
        onViolation={reportViolation}
        onDismissViolation={dismissViolationWarning}
        onAnswer={saveAnswer}
        onToggleDoubtful={toggleDoubtful}
        onFinish={finishExam}
        isFinishing={isFinishing}
        onExit={() => navigate('/dashboard')}
      />
    )
  }

  if (page === 'discussion') {
    const questions = discussion?.questions || []
    const foundIndex = questionId ? questions.findIndex((question) => String(question.id) === String(questionId)) : 0
    const currentIndex = Math.max(0, foundIndex)
    return <QuestionDiscussionPage
      question={questions[currentIndex]}
      index={currentIndex}
      total={questions.length}
      onBack={() => navigate('/exams')}
      onPrevious={() => navigate(`/results/discussion/${questions[currentIndex - 1]?.id}`)}
      onNext={() => currentIndex === questions.length - 1 ? navigate('/exams') : navigate(`/results/discussion/${questions[currentIndex + 1]?.id}`)}
      isLast={currentIndex === questions.length - 1}
    />
  }

  if (page === 'exam-token') {
    return (
      <TokenPage
        exam={currentExam}
        token={examToken}
        setToken={setExamToken}
        error={tokenError}
        loading={isTokenLoading}
        onBack={() => navigate(`/exams/${examId}`)}
        onSubmit={() => startExam('start', examToken)}
        integrityOpen={integrityOpen}
        integritySeconds={integritySeconds}
        onIntegrityConfirm={confirmIntegrity}
      />
    )
  }

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
        <header className="topbar"><button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Buka menu"><span /><span /><span /></button><div className="mobile-logo"><Logo /></div><div className="breadcrumb"><span>Portal Siswa</span><b>/</b><strong>{page === 'dashboard' ? 'Ringkasan' : page === 'exams' ? 'Ujian saya' : page === 'results' ? 'Hasil ujian' : 'Profil saya'}</strong></div><div className="topbar-actions"><button className="icon-button notification"><Icon name="bell" /><i /></button><div className="profile-menu-wrap" ref={profileMenuRef}><button className="top-profile" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}><div className="avatar">{student?.name?.slice(0, 2).toUpperCase()}</div><div><strong>{student?.name}</strong><span>Siswa</span></div><Icon name="chevronDown" size={15} /></button>{profileOpen && <div className="profile-dropdown"><div className="profile-dropdown-header"><span className="profile-dropdown-label">AKUN SISWA</span><strong>{student?.name}</strong></div><button onClick={() => { setProfileOpen(false); navigate('/profile') }}><Icon name="user" size={16} /><span>Profil saya</span></button><button className="profile-logout" onClick={() => { setProfileOpen(false); localStorage.removeItem('cbt_token'); setAuthenticated(false); navigate('/login') }}><Icon name="logout" size={16} /><span>Keluar</span></button></div>}</div></div></header>
        {dataError && <div className="api-error">{dataError}</div>}
        {integrityOpen && page !== 'exam-token' && <IntegrityModal seconds={integritySeconds} onConfirm={confirmIntegrity} />}
        <div className="content-wrap">
          {page === 'dashboard' && <DashboardPage onExam={openExam} onPage={(target) => navigate(target === 'exams' ? '/exams' : '/results')} exams={exams} completed={completed} student={student} dashboard={dashboard} />}
          {page === 'exams' && <ExamListPage exams={exams} onExam={openExam} onExplanation={openExplanation} />}
          {page === 'exam-detail' && <ExamDetailPage exam={currentExam} onBack={() => navigate('/exams')} onStart={examRequiresToken(currentExam) ? openTokenPage : () => startExam('start')} />}
          {page === 'results' && <ResultsPage exams={completed} result={examResult} allowExplanation={false} />}
          {page === 'profile' && <ProfilePage student={student} />}
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, badge, onClick }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon name={icon} /><span>{label}</span>{badge && <em>{badge}</em>}</button>
}

import { useCallback, useEffect, useState } from "react"
import Icon from "../common/Icon"
import ImageRichContent from "../content/ImageRichContent"
import { answerExists, formatQuestionType } from "../../utils/question"
import QuestionAnswer from "./QuestionAnswer"

export default function ExamScreen({ exam, question, questionIds, activeQuestion, setActiveQuestion, answers, doubtful, answeredCount, timeLeft, questionError, enableViolation, violationState, onViolation, onDismissViolation, onAnswer, onToggleDoubtful, onFinish, isFinishing, onExit }) {
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0")
  const seconds = String(timeLeft % 60).padStart(2, "0")
  const totalQuestions = questionIds.length
  const questionId = questionIds[activeQuestion]
  const [questionListOpen, setQuestionListOpen] = useState(false)
  const [violationBusy, setViolationBusy] = useState(false)
  const [fontScale, setFontScale] = useState(1)
  const [finishConfirmationOpen, setFinishConfirmationOpen] = useState(false)
  const [finishConfirmed, setFinishConfirmed] = useState(false)
  const [finishConfirmationStep, setFinishConfirmationStep] = useState(1)

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
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("blur", onBlur)
    document.addEventListener("fullscreenchange", onFullscreenChange)
    requestExamFullscreen()
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("blur", onBlur)
      document.removeEventListener("fullscreenchange", onFullscreenChange)
    }
  }, [enableViolation, violationState.locked, violationBusy, onViolation, requestExamFullscreen])

  if (violationState.locked) return <ViolationLockedScreen count={violationState.count} onExit={onExit} />
  if (!question) return <div className="loading-screen"><Logo /><p>{questionError || "Memuat soal..."}</p><button className="secondary-button" onClick={onExit}>Keluar dari ujian</button></div>

  const answer = answers[questionId]
  const update = (value) => onAnswer(questionId, value)
  const questionList = <><div className="question-nav-summary"><span className="small-label">DAFTAR SOAL</span><strong>{answeredCount} <small>/ {totalQuestions}</small></strong><div className="thin-progress"><i style={{ width: totalQuestions ? (answeredCount / totalQuestions) * 100 + "%" : "0%" }} /></div></div><div className="question-grid">{questionIds.map((id, index) => <button key={id} className={(index === activeQuestion ? "current" : "") + " " + (answerExists(answers[id]) ? "answered" : "") + " " + (doubtful.includes(id) ? "doubtful" : "")} onClick={() => { setActiveQuestion(index); setQuestionListOpen(false) }}>{index + 1}</button>)}</div><div className="question-legend"><span><i className="legend-current" />Sedang dikerjakan</span><span><i className="legend-answered" />Sudah dijawab</span><span><i className="legend-doubtful" />Ragu-ragu</span></div><div className="exam-tip"><strong>Tips</strong><p>Kamu bisa menandai soal sebagai ragu-ragu untuk ditinjau kembali nanti.</p></div></>

  return <div className="exam-screen">{violationState.warning && <ViolationWarning count={violationState.count} max={violationState.max} onDismiss={() => { onDismissViolation(); requestExamFullscreen() }} />}<header className="exam-topbar"><Logo /><div className="exam-title"><span>SEDANG MENGERJAKAN</span><strong>{exam?.title}</strong></div><div className="exam-timer"><Icon name="clock" size={17} /><div><span>Sisa waktu</span><strong className={timeLeft < 300 ? "urgent" : ""}>{minutes}:{seconds}</strong></div></div><button className="exam-question-button" onClick={() => setQuestionListOpen(true)}><Icon name="grid" size={15} /> Soal</button><button className="exit-exam" onClick={() => { setFinishConfirmationOpen(true); setFinishConfirmed(false); setFinishConfirmationStep(1) }}>Selesai</button></header><div className="exam-body"><aside className="question-nav">{questionList}</aside><main className="question-area"><div className="question-toolbar"><div className="question-meta"><span className="question-number">NO. <b>{activeQuestion + 1}</b></span><span className="question-type">{formatQuestionType(question.type)}</span></div><div className="question-tools"><div className="zoom-control" aria-label="Ukuran teks soal"><button type="button" onClick={() => setFontScale((value) => Math.max(.85, value - .15))} disabled={fontScale <= .85}>A-</button><button type="button" onClick={() => setFontScale(1)} disabled={fontScale === 1}>A</button><button type="button" onClick={() => setFontScale((value) => Math.min(1.25, value + .15))} disabled={fontScale >= 1.25}>A+</button></div><button className={"doubtful-button " + (doubtful.includes(questionId) ? "selected" : "")} onClick={() => onToggleDoubtful(questionId)}>{String.fromCharCode(9873)} <span className="doubtful-label">{doubtful.includes(questionId) ? "Ditandai" : "Ragu-ragu"}</span></button></div></div><div className="question-card blade-question-card" style={{ "--question-font-scale": fontScale }}><ImageRichContent html={question.content} className="question-content" /><QuestionAnswer key={questionId} type={question.type} question={question} value={answer} onChange={update} /></div><div className="question-footer"><button className="secondary-button" disabled={activeQuestion === 0} onClick={() => setActiveQuestion((value) => value - 1)}>{String.fromCharCode(8592)} <span>Sebelumnya</span></button>{activeQuestion === totalQuestions - 1 ? <button type="button" className="primary-button" disabled={isFinishing} onClick={() => { setFinishConfirmationOpen(true); setFinishConfirmed(false); setFinishConfirmationStep(1) }}>{isFinishing ? <><span className="button-spinner" /> Menyimpan jawaban...</> : "Selesaikan ujian"} <Icon name="arrow" size={16} /></button> : <button type="button" className="primary-button" onClick={() => setActiveQuestion((value) => value + 1)}>Soal berikutnya <Icon name="arrow" size={16} /></button>}</div></main></div>{questionListOpen && <div className="question-modal-backdrop" onClick={() => setQuestionListOpen(false)}><div className="question-modal" onClick={(event) => event.stopPropagation()}><div className="question-modal-header"><div><span className="small-label">NAVIGASI UJIAN</span><h2>Daftar soal</h2></div><button onClick={() => setQuestionListOpen(false)}>×</button></div>{questionList}</div></div>}{finishConfirmationOpen && <div className="finish-confirmation-backdrop" onClick={() => setFinishConfirmationOpen(false)}><div className="finish-confirmation-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="finish-confirmation-icon">{finishConfirmationStep}</div><span className="eyebrow">KONFIRMASI {finishConfirmationStep} DARI 2</span><h2>{finishConfirmationStep === 1 ? "Selesaikan ujian?" : "Konfirmasi terakhir"}</h2><p>{finishConfirmationStep === 1 ? "Pastikan semua jawaban sudah diperiksa sebelum melanjutkan." : "Ini adalah konfirmasi terakhir. Setelah dikirim, jawaban tidak dapat diubah kembali."}</p><label className="finish-confirmation-check"><input type="checkbox" checked={finishConfirmed} onChange={(event) => setFinishConfirmed(event.target.checked)} /><span>Saya yakin ingin menyelesaikan ujian.</span></label><div className="finish-confirmation-actions"><button type="button" className="secondary-button" onClick={() => setFinishConfirmationOpen(false)}>Batal</button>{finishConfirmationStep === 1 ? <button type="button" className="primary-button" disabled={!finishConfirmed} onClick={() => { setFinishConfirmationStep(2); setFinishConfirmed(false) }}>Lanjutkan <Icon name="arrow" size={16} /></button> : <button type="button" className="primary-button" disabled={!finishConfirmed || isFinishing} onClick={() => { setFinishConfirmationOpen(false); onFinish() }}>{isFinishing ? <><span className="button-spinner" /> Menyimpan jawaban...</> : "Ya, selesaikan ujian"} <Icon name="arrow" size={16} /></button>}</div></div></div>}{isFinishing && <div className="finish-saving-overlay" role="status" aria-live="polite"><div className="finish-saving-spinner" /><strong>Menyimpan jawaban...</strong><span>Mohon tunggu sebentar</span></div>}</div>
}

function Logo() {
  return <div className="brand"><span className="brand-mark">C</span><span>kelas<span className="brand-accent">ku</span></span></div>
}

function ViolationWarning({ count, max, onDismiss }) {
  return <div className="violation-warning"><div className="violation-warning-card"><div className="violation-alert-icon">!</div><span className="eyebrow">PELANGGARAN TERDETEKSI</span><h2>Peringatan keamanan ke-{count}</h2><p>Jangan berpindah tab, keluar dari layar ujian, atau membuka aplikasi lain. Ujian akan dikunci saat mencapai {max} pelanggaran.</p><button className="primary-button" onClick={onDismiss}>Saya mengerti</button></div></div>
}

function ViolationLockedScreen({ count, onExit }) {
  return <div className="violation-locked-screen"><div className="violation-lock-icon">!</div><p className="eyebrow">AKSES UJIAN DIHENTIKAN</p><h1>Ujian terkunci</h1><p>Ujian ditutup karena batas pelanggaran keamanan telah tercapai.</p><span>Total pelanggaran: {count}</span><button className="primary-button" onClick={onExit}>Kembali ke dashboard <Icon name="arrow" size={16} /></button></div>
}

import { useEffect, useState } from 'react'
import Icon from '../components/common/Icon'
import { formatDate } from '../utils/date'
import { isExamCompleted, isExamOngoing } from '../utils/exam'


export default function DashboardPage({ onExam, onPage, exams, completed, student, dashboard }) {
  const upcoming = exams.filter((exam) => !isExamCompleted(exam))
  const stats = dashboard?.stats || {}
  const progress = exams.length ? Math.round((completed.length / exams.length) * 100) : 0
  const serverTime = dashboard?.server_time || dashboard?.current_time || exams.find((exam) => exam.server_time)?.server_time
  const [minuteTick, setMinuteTick] = useState(0)
  const currentTime = new Date(parseServerTime(serverTime).getTime() + minuteTick * 60000)

  useEffect(() => {
    const timer = setInterval(() => setMinuteTick((value) => value + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  return <div className="page-enter"><div className="welcome-row"><div><p className="eyebrow">{formatDashboardDate(currentTime)}</p><h1>Selamat datang, {student.name.split(' ')[0]} <span className="wave">?</span></h1><p className="muted">Siap menaklukkan tantangan hari ini?</p></div><button className="outline-button" onClick={() => onPage('exams')}>Lihat semua ujian <Icon name="arrow" size={16} /></button></div>
    <section className="stats-grid"><StatCard label="Total ujian" value={stats.total_ujian ?? exams.length} detail="ujian terdaftar" icon="clipboard" tone="violet" /><StatCard label="Ujian selesai" value={stats.ujian_selesai ?? completed.length} detail={`dari ${stats.total_ujian ?? exams.length} ujian`} icon="chart" tone="green" /><StatCard label="Sedang aktif" value={stats.ujian_aktif ?? exams.filter(isExamOngoing).length} detail="Ujian yang sedang aktif" icon="clock" tone="orange" /><StatCard label="Rata-rata nilai" value={stats.rata_nilai ?? '—'} detail="Berdasarkan hasil ujian" icon="chart" tone="blue" /></section>
    <div className="dashboard-grid"><section className="section-card upcoming-card"><div className="section-heading"><div><h2>Ujian mendatang</h2><p className="muted">Jangan sampai terlewat, ya!</p></div><button className="text-button" onClick={() => onPage('exams')}>Lihat semua <Icon name="arrow" size={15} /></button></div>{upcoming.length ? upcoming.slice(0, 2).map((exam) => <ExamRow key={exam.id} exam={exam} onClick={() => onExam(exam)} />) : <div className="dashboard-empty-state"><Icon name="calendar" size={24} /><strong>Tidak ada ujian mendatang.</strong><span>Belum ada jadwal ujian baru untuk saat ini.</span></div>}</section><section className="section-card progress-card"><div className="section-heading"><div><h2>Progress belajar</h2><p className="muted">Performa kamu berdasarkan ujian selesai</p></div><button className="more-button">•••</button></div><div className="progress-ring" style={{ background: `conic-gradient(#6c59d8 0 ${progress}%,#ecebf7 ${progress}% 100%)` }}><div><strong>{progress}%</strong><span>Selesai</span></div></div><div className="legend"><span><i className="dot violet" />Ujian selesai <b>{completed.length}</b></span><span><i className="dot pale" />Belum dikerjakan <b>{upcoming.length}</b></span></div></section></div>
    <section className="section-card recent-card"><div className="section-heading"><div><h2>Hasil terbaru</h2><p className="muted">Lihat pencapaian terbaikmu</p></div><button className="text-button" onClick={() => onPage('results')}>Lihat semua <Icon name="arrow" size={15} /></button></div>{completed.length ? completed.map((exam) => <ResultRow key={exam.id} exam={exam} />) : <div className="empty-state">Belum ada hasil ujian.</div>}</section>
  </div>
}

function parseServerTime(value) {
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function formatDashboardDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(value).toUpperCase()
}

function StatCard({ label, value, detail, icon, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function ExamRow({ exam, onClick }) {
  return <button className="exam-row" onClick={onClick}><div className={`subject-icon ${exam.color}`}><Icon name="clipboard" size={20} /></div><div className="row-main"><strong>{exam.title}</strong><span><span className="date-dot" />{formatDate(exam.start_time)} <i /> {exam.duration_minutes} menit <i /> {exam.total_questions} soal</span></div><span className={`status-pill ${isExamCompleted(exam) ? 'completed' : exam.status}`}>{isExamCompleted(exam) ? 'Selesai' : isExamOngoing(exam) ? 'Sedang dikerjakan' : 'Belum dimulai'}</span><Icon name="arrow" size={17} /></button>
}

function ResultRow({ exam }) {
  return <div className="result-row"><div className={`subject-icon ${exam.color}`}><Icon name="chart" size={20} /></div><div className="row-main"><strong>{exam.title}</strong><span>{formatDate(exam.end_time)} <i /> {exam.total_questions} soal</span></div><div className="score"><strong>{exam.final_score}</strong><span>/ 100</span></div><span className="score-label">Sangat baik</span></div>
}

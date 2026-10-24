import ExamScreen from '../components/exam/ExamScreen'

export default function ExamAttemptPage({ exam, studentName, ...props }) {
  const examWithStudentName = exam
    ? { ...exam, title: `Nama: ${studentName || 'Siswa'} — ${exam.title || 'Ujian'}` }
    : exam

  return <ExamScreen {...props} exam={examWithStudentName} />
}

import { useExamSecurity } from '../../hooks/useExamSecurity'

export default function ExamSecurity({ enabled, locked, onViolation }) {
  useExamSecurity({ enabled, locked, onViolation })
  return null
}

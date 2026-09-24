import EssayAnswer from './EssayAnswer'
import MultipleChoice from './MultipleChoice'
import SingleChoice from './SingleChoice'

export default function QuestionRenderer({ question, value, onChange }) {
  if (!question) return null
  if (['multiple_choice', 'complex_choice'].includes(question.type)) {
    return <MultipleChoice options={question.options} value={value} onChange={onChange} />
  }
  if (question.type === 'essay') return <EssayAnswer value={value} onChange={onChange} />
  return <SingleChoice options={question.options} value={value} onChange={onChange} />
}

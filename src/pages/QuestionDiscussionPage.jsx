import { useEffect, useRef, useState } from 'react'
import Icon from '../components/common/Icon'
import ImageRichContent from '../components/content/ImageRichContent'

export default function QuestionDiscussionPage({ question, index, total, onBack, onPrevious, onNext, isLast }) {
  if (!question) return <div className="empty-state">Pembahasan soal tidak ditemukan.</div>
  return <div className="page-enter discussion-page">
    <button className="back-button" onClick={onBack}><Icon name="arrow" size={15} /> Kembali ke hasil</button>
    <section className="section-card discussion-card">
      <div className="discussion-header"><div><span className="eyebrow">PEMBAHASAN SOAL {index + 1}</span><h1>Pembahasan soal</h1></div>{question.type !== 'tkp' && <span className={`discussion-result ${question.is_correct ? 'correct' : 'incorrect'}`}>{question.is_correct ? 'Benar' : 'Perlu dipelajari'}</span>}</div>
      <ImageRichContent html={question.content} className="rich-text discussion-question" />
      {question.type === 'matching'
        ? <MatchingDiscussion question={question} />
        : ['true_false', 'true_false_multi'].includes(question.type)
          ? <TrueFalseDiscussion question={question} />
          : question.type === 'tkp'
            ? <TkpDiscussion question={question} />
          : question.options?.length > 0 && <ChoiceDiscussion question={question} />}
      {question.explanation && <div className="discussion-explanation"><span className="small-label">PENJELASAN</span><ImageRichContent html={question.explanation} className="rich-text" /></div>}
      <div className="discussion-navigation"><button className="secondary-button" disabled={index === 0} onClick={onPrevious}>Soal sebelumnya</button><span>Soal {index + 1} dari {total}</span><button className="primary-button" onClick={onNext}>{isLast ? 'Kembali ke daftar ujian' : 'Soal berikutnya'} <Icon name="arrow" size={15} /></button></div>
    </section>
  </div>
}

function ChoiceDiscussion({ question }) {
  const answers = Array.isArray(question.answer) ? question.answer.map(String) : [String(question.answer)]
  return <div className="explanation-options">{question.options.map((option) => {
    const selected = answers.includes(String(option.id))
    return <div className={`${selected ? 'selected' : ''} ${option.is_correct ? 'correct' : ''}`} key={option.id}>
      <span dangerouslySetInnerHTML={{ __html: option.option_text || '' }} />
      {selected && <b>Jawaban siswa</b>}
      {option.is_correct && <b>Kunci jawaban</b>}
    </div>
  })}</div>
}

function TkpDiscussion({ question }) {
  const answers = Array.isArray(question.answer) ? question.answer.map(String) : [String(question.answer)]
  return <div className="explanation-options">{question.options.map((option) => {
    const selected = answers.includes(String(option.id))
    return <div className={selected ? 'selected' : ''} key={option.id}>
      <span dangerouslySetInnerHTML={{ __html: option.option_text || '' }} />
      <b className="tkp-score-weight">Bobot {option.score_weight ?? '—'}</b>
      {selected && <b>Jawaban siswa</b>}
    </div>
  })}</div>
}

function TrueFalseDiscussion({ question }) {
  const answer = parseAnswer(question.answer)
  return <div className="discussion-table-wrap"><table className="discussion-table"><thead><tr><th>Pernyataan</th><th>Kunci jawaban</th><th>Jawaban siswa</th><th>Status</th></tr></thead><tbody>{(question.options || []).map((option) => {
    const correct = option.is_correct ? 'benar' : 'salah'
    const student = String(answer[option.id] || '').toLowerCase() || '—'
    const correctMatch = student === correct
    return <tr key={option.id}><td dangerouslySetInnerHTML={{ __html: option.option_text || '' }} /><td>{correct}</td><td>{student}</td><td><span className={correctMatch ? 'discussion-status correct' : 'discussion-status incorrect'}>{correctMatch ? 'Benar' : 'Salah'}</span></td></tr>
  })}</tbody></table></div>
}

function MatchingDiscussion({ question }) {
  const containerRef = useRef(null)
  const premiseRefs = useRef({})
  const targetRefs = useRef({})
  const [lines, setLines] = useState([])
  const matches = question.matches || []
  const targets = question.target_options || matches.map((item) => ({ id: item.target_id || item.id, text: item.target_text }))
  const answer = parseAnswer(question.answer)
  useEffect(() => {
    const updateLines = () => {
      const root = containerRef.current?.getBoundingClientRect()
      if (!root) return
      setLines(Object.entries(answer).map(([premiseId, targetId]) => {
        const premise = premiseRefs.current[premiseId]?.getBoundingClientRect()
        const target = targetRefs.current[targetId]?.getBoundingClientRect()
        if (!premise || !target) return null
        return {
          x1: premise.right - root.left,
          y1: premise.top + premise.height / 2 - root.top,
          x2: target.left - root.left,
          y2: target.top + target.height / 2 - root.top,
        }
      }).filter(Boolean))
    }
    const timer = setTimeout(updateLines, 0)
    window.addEventListener('resize', updateLines)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateLines)
    }
  }, [answer, question.answer])

  const targetText = (targetId) => {
    const target = targets.find((item) => String(item.id) === String(targetId))
    return target?.text || target?.target_text || '—'
  }
  const correctTarget = (item) => item.correct_target_id ?? item.correctTargetId ?? item.target_id
  return <div>
    <div className="matching-answer line-matching discussion-matching" ref={containerRef}>
    <svg className="matching-lines" aria-hidden="true">{lines.map((line, index) => <line key={index} {...line} />)}</svg>
    <div className="matching-column"><span className="matching-heading">Pernyataan</span>{matches.map((item) => <div className="match-item connected" ref={(node) => { premiseRefs.current[item.id] = node }} key={item.id}><span dangerouslySetInnerHTML={{ __html: item.premise_text || item.text || '' }} /><i>Terhubung</i></div>)}</div>
    <div className="matching-column"><span className="matching-heading">Pilihan pasangan</span>{targets.map((target) => <div className="target-item connected" ref={(node) => { targetRefs.current[target.id] = node }} key={target.id} dangerouslySetInnerHTML={{ __html: target.text || target.target_text || '' }} />)}</div>
    </div>
    <div className="matching-result-table"><div className="matching-result-heading"><span>Pernyataan</span><span>Jawaban siswa</span><span>Kunci jawaban</span></div>{matches.map((item) => {
      const studentTarget = answer[item.id]
      const expectedTarget = correctTarget(item)
      const isCorrect = String(studentTarget) === String(expectedTarget)
      return <div className="matching-result-row" key={item.id}><span dangerouslySetInnerHTML={{ __html: item.premise_text || item.text || '' }} /><span dangerouslySetInnerHTML={{ __html: targetText(studentTarget) }} /><span dangerouslySetInnerHTML={{ __html: targetText(expectedTarget) }} /><b className={isCorrect ? 'correct' : 'incorrect'}>{isCorrect ? 'Benar' : 'Salah'}</b></div>
    })}</div>
  </div>
}

function parseAnswer(answer) {
  if (!answer) return {}
  if (typeof answer === 'object') return answer
  try {
    const parsed = JSON.parse(answer)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import MathContent from "../content/MathContent"

export default function QuestionAnswer({ type, question, value, onChange }) {
  if (["single_choice", "tkp"].includes(type)) return <SingleChoiceAnswer options={question.options || []} value={value} onChange={onChange} />
  if (["multiple_choice", "complex_choice"].includes(type)) return <MultipleChoiceAnswer options={question.options || []} value={value} onChange={onChange} />
  if (["true_false", "true_false_multi"].includes(type)) return <TrueFalseAnswer options={question.options || []} value={value} onChange={onChange} />
  if (type === "matching") return <MatchingAnswer question={question} value={value} onChange={onChange} />
  if (type === "essay") return <EssayAnswer value={value} onChange={onChange} />
  return <div className="muted">Jenis soal belum didukung oleh tampilan ini.</div>
}

function SingleChoiceAnswer({ options = [], value, onChange }) {
  return <div className="answer-options">{options.map((option, index) => { const selected = String(value) === String(option.id); return <button key={option.id} className={selected ? "selected" : ""} onClick={() => onChange(option.id)}><span className="choice-letter">{String.fromCharCode(65 + index)}</span><MathContent html={option.option_text || option.text || option.label || ""} />{selected && <b>{String.fromCharCode(10003)}</b>}</button> })}</div>
}

function MultipleChoiceAnswer({ options = [], value = [], onChange }) {
  return <div className="answer-options">{options.map((option) => { const selected = Array.isArray(value) && value.some((id) => String(id) === String(option.id)); return <button key={option.id} className={selected ? "selected" : ""} onClick={() => onChange(selected ? value.filter((id) => String(id) !== String(option.id)) : [...(Array.isArray(value) ? value : []), option.id])}><span className="choice-check">{selected ? String.fromCharCode(10003) : ""}</span><MathContent html={option.option_text || option.text || option.label || ""} /></button> })}</div>
}

function TrueFalseAnswer({ options = [], value, onChange }) {
  return <div className="true-false-table"><div className="tf-head"><span>Pernyataan</span><b>Benar</b><b>Salah</b></div>{options.map((option) => <div className="tf-row" key={option.id}><MathContent html={option.option_text || option.text || option.label || ""} /><label><input type="radio" name={"tf-" + option.id} checked={value?.[option.id] === "benar"} onChange={() => onChange({ ...(value || {}), [option.id]: "benar" })} /></label><label><input type="radio" name={"tf-" + option.id} checked={value?.[option.id] === "salah"} onChange={() => onChange({ ...(value || {}), [option.id]: "salah" })} /></label></div>)}</div>
}

function EssayAnswer({ value, onChange }) {
  const [draft, setDraft] = useState(value || "")
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== (value || "")) onChange(draft)
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

  const buildLines = useCallback(() => Object.entries(current).map(([premiseId, targetId]) => lineFor(premiseId, targetId)).filter(Boolean), [current, lineFor])

  useEffect(() => {
    const update = () => setLines(buildLines())
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
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

  return <div className="matching-answer line-matching" ref={containerRef}><svg className="matching-lines" aria-hidden="true">{lines.map((line, index) => <line key={index} {...line} />)}</svg><div className="matching-column"><span className="matching-heading">Pernyataan</span>{matches.map((item) => <button className={"match-item " + (activePremise === item.id ? "active" : "") + " " + (current[item.id] ? "connected" : "")} ref={(node) => { premiseRefs.current[item.id] = node }} key={item.id} onClick={() => setActivePremise(item.id)}><MathContent html={item.premise_text} /><i>{current[item.id] ? "Terhubung" : "Pilih"}</i></button>)}</div><div className="matching-column"><span className="matching-heading">Pilihan pasangan</span>{targets.map((target) => <button className={"target-item " + (Object.values(current).some((id) => String(id) === String(target.id)) ? "connected" : "")} ref={(node) => { targetRefs.current[target.id] = node }} key={target.id} onClick={() => connect(target.id)}><MathContent html={target.text} /></button>)}</div></div>
}

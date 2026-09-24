export default function EssayAnswer({ value = '', onChange }) {
  return <textarea className="essay-answer" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Tulis jawabanmu..." />
}

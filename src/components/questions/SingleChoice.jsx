export default function SingleChoice({ options = [], value, onChange }) {
  return <div className="choice-list">{options.map((option) => <label className="choice-option" key={option.id}><input type="radio" checked={String(value) === String(option.id)} onChange={() => onChange(option.id)} /><span dangerouslySetInnerHTML={{ __html: option.text || option.label || '' }} /></label>)}</div>
}

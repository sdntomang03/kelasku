export default function MultipleChoice({ options = [], value = [], onChange }) {
  const selected = Array.isArray(value) ? value : []
  return <div className="choice-list">{options.map((option) => <label className="choice-option" key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={() => onChange(selected.includes(option.id) ? selected.filter((id) => id !== option.id) : [...selected, option.id])} /><span dangerouslySetInnerHTML={{ __html: option.text || option.label || '' }} /></label>)}</div>
}

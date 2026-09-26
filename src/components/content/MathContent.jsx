import 'katex/dist/katex.min.css'
import { renderMathHtml } from '../../utils/renderMath'

export default function MathContent({ html = '', className = '' }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderMathHtml(html) }} />
}

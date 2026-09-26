import katex from 'katex'

const mathPattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\$)\$[^$\n]+?\$(?!\$))/g

export function renderMathHtml(html = '') {
  return String(html).replace(mathPattern, (match) => {
    const display = match.startsWith('$$') || match.startsWith('\\[')
    const formula = display
      ? match.slice(2, -2)
      : match.startsWith('\\(') ? match.slice(2, -2) : match.slice(1, -1)
    try {
      return katex.renderToString(formula, {
        displayMode: display,
        throwOnError: false,
        strict: 'ignore',
      })
    } catch {
      return match
    }
  })
}

export function renderMathInElement(element) {
  if (!element) return
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const textNodes = []
  let node = walker.nextNode()
  while (node) {
    if (!node.parentElement?.closest('.katex')) textNodes.push(node)
    node = walker.nextNode()
  }

  textNodes.forEach((textNode) => {
    if (!mathPattern.test(textNode.nodeValue)) {
      mathPattern.lastIndex = 0
      return
    }
    mathPattern.lastIndex = 0
    const fragment = document.createDocumentFragment()
    let lastIndex = 0
    textNode.nodeValue.replace(mathPattern, (match, _formula, offset) => {
      fragment.append(document.createTextNode(textNode.nodeValue.slice(lastIndex, offset)))
      const display = match.startsWith('$$') || match.startsWith('\\[')
      const formula = display
        ? match.slice(2, -2)
        : match.startsWith('\\(') ? match.slice(2, -2) : match.slice(1, -1)
      const wrapper = document.createElement(display ? 'div' : 'span')
      wrapper.className = display ? 'katex-display' : 'katex-inline'
      try {
        wrapper.innerHTML = katex.renderToString(formula, { displayMode: display, throwOnError: false, strict: 'ignore' })
      } catch {
        wrapper.textContent = match
      }
      fragment.append(wrapper)
      lastIndex = offset + match.length
      return match
    })
    fragment.append(document.createTextNode(textNode.nodeValue.slice(lastIndex)))
    textNode.parentNode.replaceChild(fragment, textNode)
  })
}

export function resolvePublicImages(html = '') {
  if (!html || typeof DOMParser === 'undefined') return html

  const documentFragment = new DOMParser().parseFromString(String(html), 'text/html')
  documentFragment.querySelectorAll('img[src]').forEach((image) => {
    const source = image.getAttribute('src')?.trim()
    if (!source || source.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(source)) return

    const publicPath = source.replace(/^\/+/, '').replace(/^public\//i, '')
    const publicBase = new URL(import.meta.env.BASE_URL, document.baseURI)
    image.setAttribute('src', new URL(publicPath, publicBase).href)
  })

  return documentFragment.body.innerHTML
}

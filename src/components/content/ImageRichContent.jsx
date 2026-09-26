import { useRef, useState } from 'react'
import 'katex/dist/katex.min.css'
import { renderMathHtml } from '../../utils/renderMath'

function ImageRichContent({ html, className = '' }) {
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const contentRef = useRef(null)
  const dragStart = useRef(null)
  const close = () => { setImage(null); setZoom(1); setPosition({ x: 0, y: 0 }); setDragging(false) }
  const updateZoom = (nextZoom) => {
    setZoom(nextZoom)
    if (nextZoom <= 1) setPosition({ x: 0, y: 0 })
  }
  const toggleZoom = () => updateZoom(zoom > 1 ? 1 : 2)
  const handlePointerDown = (event) => {
    if (zoom <= 1) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, position }
    setDragging(true)
  }
  const handlePointerMove = (event) => {
    if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) return
    setPosition({
      x: dragStart.current.position.x + event.clientX - dragStart.current.x,
      y: dragStart.current.position.y + event.clientY - dragStart.current.y,
    })
  }
  const stopDragging = (event) => {
    if (dragStart.current?.pointerId === event.pointerId) {
      dragStart.current = null
      setDragging(false)
    }
  }
  return <><div ref={contentRef} className={className} onClick={(event) => {
    const target = event.target.closest?.('img')
    if (target) { setImage({ src: target.currentSrc || target.src, alt: target.alt || 'Gambar soal' }); setZoom(1); setPosition({ x: 0, y: 0 }) }
  }} dangerouslySetInnerHTML={{ __html: renderMathHtml(html) }} />{image && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Pratinjau gambar" onClick={close}><div className="image-lightbox-panel" onClick={(event) => event.stopPropagation()}><div className="image-lightbox-toolbar"><span>Pratinjau gambar</span><div><button type="button" onClick={() => updateZoom(Math.max(.5, zoom - .25))} aria-label="Perkecil gambar">−</button><strong>{Math.round(zoom * 100)}%</strong><button type="button" onClick={() => updateZoom(Math.min(3, zoom + .25))} aria-label="Perbesar gambar">+</button><button type="button" onClick={close} aria-label="Tutup pratinjau">×</button></div></div><div className={`image-lightbox-viewport ${dragging ? 'dragging' : ''}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={stopDragging} onPointerCancel={stopDragging} onDoubleClick={toggleZoom}><img src={image.src} alt={image.alt} draggable="false" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})` }} /></div></div></div>}</>
}

export default ImageRichContent

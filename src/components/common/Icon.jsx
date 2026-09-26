const iconPaths = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  clipboard: 'M9 4h6m-7 3h8M7 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2M8 4a2 2 0 0 1 4 0v1H8V4z',
  chart: 'M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8',
  user: 'M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  arrowLeft: 'M19 12H5m7 7-7-7 7-7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v5l3 2',
  logout: 'M10 17l5-5-5-5m5 5H3m11-9h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-3',
  chevronDown: 'm6 9 6 6 6-6',
  filter: 'M4 6h16M7 12h10M10 18h4',
  book: 'M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2V5zm0 0v16a2 2 0 0 1 2-2h12',
}

export default function Icon({ name, size = 19 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconPaths[name]} /></svg>
}

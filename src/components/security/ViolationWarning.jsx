export default function ViolationWarning({ count, max, onDismiss }) {
  return <div className="violation-warning" role="alert"><strong>Peringatan keamanan</strong><p>Aktivitas meninggalkan halaman terdeteksi ({count}{max ? `/${max}` : ''}).</p><button className="primary-button small" onClick={onDismiss}>Kembali ke ujian</button></div>
}

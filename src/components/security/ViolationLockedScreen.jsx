export default function ViolationLockedScreen({ count, onExit }) {
  return <div className="loading-screen"><h2>Ujian terkunci</h2><p>Batas pelanggaran keamanan telah tercapai ({count}).</p><button className="secondary-button" onClick={onExit}>Keluar dari ujian</button></div>
}

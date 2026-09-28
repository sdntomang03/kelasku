import Icon from './Icon'

export default function PremiumGate({ navigate, title = 'Konten Premium', checking = false }) {
  return <section className="premium-gate" role="status">
    <span className="premium-gate-icon"><Icon name="lock" size={22} /></span>
    <p className="eyebrow">KHUSUS PREMIUM</p>
    <h2>{title}</h2>
    <p>{checking ? 'Sedang memeriksa status keanggotaan akun Anda.' : 'Materi dan latihan ini tersedia untuk akun dengan keanggotaan Premium aktif.'}</p>
    {!checking && <button className="primary-button" onClick={() => navigate('/premium')}>Lihat Premium <Icon name="arrow" size={15} /></button>}
  </section>
}

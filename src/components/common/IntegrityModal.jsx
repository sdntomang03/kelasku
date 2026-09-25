import Icon from './Icon'

export default function IntegrityModal({ seconds, onConfirm }) {
  return <div className="integrity-backdrop" role="presentation"><div className="integrity-modal" role="dialog" aria-modal="true" aria-labelledby="integrity-title"><div className="integrity-badge">✓</div><span className="eyebrow">INTEGRITAS UJIAN</span><h2 id="integrity-title">Komitmen kejujuran</h2><p>Saya mengerjakan ujian ini secara mandiri, jujur, dan tidak menggunakan bantuan atau sumber yang tidak diizinkan.</p><div className="integrity-points"><span>✓ Mengerjakan dengan kemampuan sendiri</span><span>✓ Menjaga ketertiban selama ujian</span><span>✓ Menerima hasil sesuai usaha saya</span></div><button className="primary-button wide" disabled={seconds > 0} onClick={onConfirm}>{seconds > 0 ? `Saya setuju (${seconds})` : 'Saya setuju dan mulai ujian'} <Icon name="arrow" size={16} /></button></div></div>
}

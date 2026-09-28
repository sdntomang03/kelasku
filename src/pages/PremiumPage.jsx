import { useEffect, useState } from 'react'
import { premiumService } from '../services/premiumService'
import Icon from '../components/common/Icon'

export default function PremiumPage({ status, statusLoading, statusError, onRefreshStatus }) {
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutPlan, setCheckoutPlan] = useState('')

  useEffect(() => {
    let cancelled = false
    premiumService.plans()
      .then((data) => {
        if (!cancelled) setPlans(Array.isArray(data?.plans) ? data.plans : [])
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Paket Premium tidak dapat dimuat.')
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const startCheckout = async (planCode) => {
    setCheckoutPlan(planCode)
    setError('')
    try {
      const result = await premiumService.checkout(planCode)
      const redirectUrl = new URL(result?.redirect_url)
      if (redirectUrl.protocol !== 'https:') throw new Error('Tautan pembayaran tidak valid.')
      window.location.assign(redirectUrl.href)
    } catch (checkoutError) {
      setError(checkoutError.message || 'Checkout Premium gagal dimulai.')
      setCheckoutPlan('')
    }
  }

  return <div className="page-enter premium-page">
    <section className="premium-hero">
      <span className="premium-hero-icon"><Icon name="star" size={24} /></span>
      <p className="eyebrow">KELASKU PREMIUM</p>
      <h1>Belajar lebih lengkap</h1>
      <p>Akses materi pilihan dan paket latihan khusus Premium.</p>
      <div className="premium-status" aria-live="polite">
        {statusLoading ? <span>Memeriksa status keanggotaan...</span>
          : statusError ? <><span role="alert">{statusError}</span><button onClick={onRefreshStatus}>Coba lagi</button></>
            : status?.is_premium ? <><strong>Premium aktif</strong>{status.premium_until && <span>Berlaku sampai {new Date(status.premium_until).toLocaleDateString('id-ID')}</span>}</>
              : <><strong>Belum berlangganan</strong><span>Pilih paket untuk membuka konten Premium.</span></>}
      </div>
    </section>

    {error && <div className="practice-inline-error" role="alert">{error}</div>}
    <section className="premium-plans">
      <div className="premium-section-heading"><div><p className="eyebrow">PILIH KEANGGOTAAN</p><h2>Paket Premium</h2></div></div>
      {plansLoading ? <div className="practice-state">Memuat paket Premium...</div>
        : plans.length ? <div className="premium-plan-grid">{plans.map((plan) => <article className="premium-plan-card" key={plan.code}>
          <span className="premium-plan-duration">{plan.duration_months >= 1200 ? 'Jangka panjang' : `${plan.duration_months} bulan`}</span>
          <h3>{plan.name}</h3>
          <strong>{plan.available ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: plan.currency || 'IDR', maximumFractionDigits: 0 }).format(plan.amount) : 'Belum tersedia'}</strong>
          <button className={plan.available ? 'primary-button' : 'secondary-button'} disabled={!plan.available || Boolean(checkoutPlan) || statusLoading || Boolean(statusError)} onClick={() => startCheckout(plan.code)}>
            {checkoutPlan === plan.code ? 'Menyiapkan pembayaran...' : plan.available ? 'Pilih paket' : 'Tidak tersedia'}
          </button>
        </article>)}</div>
          : <div className="practice-empty"><h2>Paket Premium belum tersedia</h2><p>Coba lagi nanti atau hubungi pengelola.</p></div>}
    </section>
    <p className="premium-security-note">Status dan pembayaran diverifikasi oleh server. Premium hanya aktif setelah pembayaran dikonfirmasi oleh penyedia pembayaran.</p>
  </div>
}

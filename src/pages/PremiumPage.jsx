import { useCallback, useEffect, useMemo, useState } from 'react'
import { PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui'
import { apiRequest } from '../api/client'
import Icon from '../components/common/Icon'
import {
  configureRevenueCat,
  getCurrentRevenueCatOffering,
  getRevenueCatCustomerInfo,
  hasPremiumEntitlement,
  isRevenueCatAvailable,
  isRevenueCatPurchaseCancelled,
  presentRevenueCatCustomerCenter,
  presentRevenueCatPaywall,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from '../services/revenueCatService'
import { getErrorMessage } from '../utils/api'

const premiumStatusPath = '/premium/status'
const revenueCatSyncPath = '/premium/revenuecat/sync'

export default function PremiumPage({ student }) {
  const [status, setStatus] = useState(null)
  const [customerInfo, setCustomerInfo] = useState(null)
  const [offering, setOffering] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const nativeAvailable = isRevenueCatAvailable()

  const refreshBackendStatus = useCallback(async (syncPurchase = false, updateState = true) => {
    if (syncPurchase) {
      await apiRequest(revenueCatSyncPath, { method: 'POST', body: {} })
    }
    const latestStatus = await apiRequest(premiumStatusPath)
    if (updateState) setStatus(latestStatus)
    return latestStatus
  }, [])

  const refreshRevenueCatData = useCallback(async (updateState = true) => {
    await configureRevenueCat(student.id)
    const [latestCustomerInfo, latestOffering] = await Promise.all([
      getRevenueCatCustomerInfo(),
      getCurrentRevenueCatOffering(),
    ])
    if (updateState) {
      setCustomerInfo(latestCustomerInfo)
      setOffering(latestOffering)
    }
    return { customerInfo: latestCustomerInfo, offering: latestOffering }
  }, [student.id])

  useEffect(() => {
    let active = true
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const latestStatus = await refreshBackendStatus(false, false)
        if (active) setStatus(latestStatus)
      } catch (loadError) {
        if (active) setError(`Status premium tidak dapat dimuat: ${getErrorMessage(loadError)}`)
      }

      if (nativeAvailable) {
        try {
          const revenueCatData = await refreshRevenueCatData(false)
          if (active) {
            setCustomerInfo(revenueCatData.customerInfo)
            setOffering(revenueCatData.offering)
          }
        } catch (loadError) {
          if (active) setError((current) => [
            current,
            `RevenueCat tidak dapat dimuat: ${getErrorMessage(loadError)}`,
          ].filter(Boolean).join(' '))
        }
      }
      if (active) setIsLoading(false)
    }

    void load()
    return () => { active = false }
  }, [nativeAvailable, refreshBackendStatus, refreshRevenueCatData])

  const plans = useMemo(() => {
    const availablePackages = offering?.availablePackages || []
    return [
      {
        key: 'monthly',
        title: 'Bulanan',
        match: (item) => item.packageType === 'MONTHLY' || item.identifier?.toLowerCase() === 'monthly',
      },
      {
        key: 'yearly',
        title: 'Tahunan',
        match: (item) => item.packageType === 'ANNUAL'
          || ['yearly', 'annual'].includes(item.identifier?.toLowerCase()),
      },
    ].map((plan) => ({
      ...plan,
      aPackage: availablePackages.find(plan.match),
    })).filter((plan) => plan.aPackage)
  }, [offering])

  const syncAfterPurchase = useCallback(async () => {
    try {
      const latestStatus = await refreshBackendStatus(true)
      setMessage(latestStatus.is_premium
        ? 'Langganan aktif. Fitur premium telah diverifikasi oleh server.'
        : 'Pembelian diterima, tetapi status premium belum aktif di server. Coba perbarui status beberapa saat lagi.')
    } catch (syncError) {
      setError(`Pembelian diproses, tetapi verifikasi server gagal: ${getErrorMessage(syncError)}. Gunakan tombol perbarui status untuk mencoba lagi.`)
    }
  }, [refreshBackendStatus])

  const handlePurchase = useCallback(async (aPackage) => {
    setIsBusy(true)
    setError('')
    setMessage('')
    try {
      const latestCustomerInfo = await purchaseRevenueCatPackage(aPackage)
      setCustomerInfo(latestCustomerInfo)
      await syncAfterPurchase()
    } catch (purchaseError) {
      if (!isRevenueCatPurchaseCancelled(purchaseError)) {
        setError(`Pembelian gagal: ${getErrorMessage(purchaseError)}`)
      }
    } finally {
      setIsBusy(false)
    }
  }, [syncAfterPurchase])

  const handlePaywall = useCallback(async () => {
    if (!offering) {
      setError('Offering belum tersedia. Periksa konfigurasi produk dan offering di RevenueCat Dashboard.')
      return
    }
    setIsBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await presentRevenueCatPaywall(offering)
      if (result.result === PAYWALL_RESULT.PURCHASED || result.result === PAYWALL_RESULT.RESTORED) {
        setCustomerInfo(await getRevenueCatCustomerInfo())
        await syncAfterPurchase()
      } else if (result.result === PAYWALL_RESULT.ERROR) {
        setError('Paywall tidak dapat diselesaikan. Periksa produk dan konfigurasi RevenueCat, lalu coba lagi.')
      }
    } catch (paywallError) {
      setError(`Paywall tidak dapat dibuka: ${getErrorMessage(paywallError)}`)
    } finally {
      setIsBusy(false)
    }
  }, [offering, syncAfterPurchase])

  const handleRestore = useCallback(async () => {
    setIsBusy(true)
    setError('')
    setMessage('')
    try {
      const latestCustomerInfo = await restoreRevenueCatPurchases()
      setCustomerInfo(latestCustomerInfo)
      await syncAfterPurchase()
    } catch (restoreError) {
      setError(`Pembelian sebelumnya tidak dapat dipulihkan: ${getErrorMessage(restoreError)}`)
    } finally {
      setIsBusy(false)
    }
  }, [syncAfterPurchase])

  const handleCustomerCenter = useCallback(async () => {
    setIsBusy(true)
    setError('')
    try {
      await presentRevenueCatCustomerCenter()
      await refreshBackendStatus(true)
      setCustomerInfo(await getRevenueCatCustomerInfo())
    } catch (centerError) {
      setError(`Pusat langganan tidak dapat dibuka: ${getErrorMessage(centerError)}`)
    } finally {
      setIsBusy(false)
    }
  }, [refreshBackendStatus])

  const handleRefresh = useCallback(async () => {
    setIsBusy(true)
    setError('')
    setMessage('')
    try {
      if (nativeAvailable) await refreshRevenueCatData()
      await refreshBackendStatus(nativeAvailable)
      setMessage('Status langganan berhasil diperbarui.')
    } catch (refreshError) {
      setError(`Status langganan gagal diperbarui: ${getErrorMessage(refreshError)}`)
    } finally {
      setIsBusy(false)
    }
  }, [nativeAvailable, refreshBackendStatus, refreshRevenueCatData])

  const isPremium = Boolean(status?.is_premium)
  const hasClientEntitlement = hasPremiumEntitlement(customerInfo)

  return (
    <div className="page-enter premium-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">LANGGANAN KELASKU</p>
          <h1>Kelasku Premium</h1>
          <p className="muted">Akses materi dan latihan premium dengan langganan yang dikelola melalui Google Play.</p>
        </div>
        <span className={`premium-status ${isPremium ? 'active' : ''}`} role="status">
          {isLoading ? 'Memeriksa status…' : isPremium ? 'Premium aktif' : 'Paket gratis'}
        </span>
      </div>

      <section className="section-card premium-status-card">
        <div className="premium-status-icon"><Icon name="book" size={21} /></div>
        <div className="premium-status-copy">
          <h2>{isPremium ? 'Langganan premium aktif' : 'Belajar lebih lengkap bersama Kelasku'}</h2>
          <p>
            {isPremium
              ? status?.is_permanent
                ? 'Akun ini memiliki akses premium permanen.'
                : `Akses premium${status?.premium_until ? ` berlaku sampai ${new Date(status.premium_until).toLocaleDateString('id-ID')}` : ' telah diverifikasi server'}.`
              : 'Pilih paket bulanan atau tahunan. Harga ditampilkan langsung dari Google Play.'}
          </p>
          {status?.status && <small>Status server: {status.status}</small>}
        </div>
      </section>

      {error && <div className="premium-feedback error" role="alert">{error}</div>}
      {message && <div className="premium-feedback success" role="status">{message}</div>}

      {!nativeAvailable ? (
        <div className="premium-feedback notice" role="status">
          Pembelian, Paywall, dan Customer Center tersedia di aplikasi Android/iOS. Gunakan aplikasi Kelasku untuk berlangganan atau memulihkan pembelian.
        </div>
      ) : (
        <>
          {plans.length > 0 && (
            <section className="premium-plans" aria-label="Pilihan paket premium">
              {plans.map(({ key, title, aPackage }) => (
                <article className="section-card premium-plan-card" key={key}>
                  <div className="premium-plan-heading">
                    <span>{title}</span>
                    {key === 'yearly' && <em>HEMAT</em>}
                  </div>
                  <strong className="premium-plan-price">{aPackage.product.priceString}</strong>
                  <span className="premium-plan-product">{aPackage.product.title || aPackage.product.identifier}</span>
                  <button className="primary-button" disabled={isBusy || isPremium} onClick={() => void handlePurchase(aPackage)}>
                    {isPremium ? 'Premium aktif' : isBusy ? 'Memproses…' : `Pilih paket ${title.toLowerCase()}`}
                  </button>
                </article>
              ))}
            </section>
          )}

          <section className="section-card premium-actions-card">
            <div>
              <h2>{plans.length ? 'Lihat penawaran lengkap' : 'Pilih paket Premium'}</h2>
              <p className="muted">
                Paywall aman RevenueCat menampilkan paket dan harga lokal yang sudah dikonfigurasi untuk akun ini.
              </p>
              {!offering && !isLoading && <p className="premium-setup-hint">Belum ada offering aktif. Atur offering “default” dan Paywall di RevenueCat Dashboard.</p>}
            </div>
            <button className="primary-button" disabled={isBusy || !offering || isPremium} onClick={() => void handlePaywall()}>
              {isBusy ? 'Memproses…' : 'Lihat Paywall'}
            </button>
          </section>
        </>
      )}

      <section className="section-card premium-management-card">
        <div>
          <h2>Kelola langganan</h2>
          <p className="muted">
            Pulihkan pembelian sebelumnya atau buka pengaturan langganan dan bantuan pelanggan.
            {hasClientEntitlement && !isPremium ? ' RevenueCat mendeteksi entitlement; status server dapat membutuhkan sinkronisasi.' : ''}
          </p>
        </div>
        <div className="premium-management-actions">
          <button className="outline-button" disabled={isBusy || !nativeAvailable} onClick={() => void handleRestore()}>Pulihkan pembelian</button>
          <button className="outline-button" disabled={isBusy || !nativeAvailable} onClick={() => void handleCustomerCenter()}>Pusat langganan</button>
          <button className="outline-button" disabled={isBusy} onClick={() => void handleRefresh()}>Perbarui status</button>
        </div>
      </section>

      <p className="premium-disclaimer">
        Status akses premium ditentukan oleh server setelah verifikasi RevenueCat. Pembatalan langganan dikelola melalui Google Play dan tidak langsung menghapus akses yang masih aktif.
      </p>
    </div>
  )
}

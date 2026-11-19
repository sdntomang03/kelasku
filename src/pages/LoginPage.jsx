import { useEffect, useState } from 'react'
import Icon from '../components/common/Icon'
import { getSupportWhatsAppUrl } from '../utils/whatsapp'
import './LoginPage.css'

const motivationMessages = [
  'Gantungkan cita-citamu setinggi langit; bermimpilah di siang hari, lalu wujudkan lewat ketekunan. — Soekarno',
  'Keberhasilan tidak datang dari menunggu, melainkan dari keberanian melangkah dan bekerja keras. — B.J. Habibie',
  'Di mana pun engkau berada, jadilah bagian terbaik yang memberi manfaat bagi sesama. — Ki Hajar Dewantara',
  'Teruslah melangkah ke depan dan jangan mudah menyerah menghadapi setiap tantangan. — R.A. Kartini',
  'Perjuangan besar selalu menuntut ketabahan, kejujuran, dan keyakinan penuh pada proses. — Mohammad Hatta',
  'Keberanian sejati tampak ketika kita tetap berdiri teguh membela kebenaran dan integritas. — Jenderal Sudirman',
  'Selama semangat belajar masih menyala, selalu ada jalan untuk memahami hal yang sulit. — Tan Malaka',
  'Kemenangan diraih oleh mereka yang mampu menjaga fokus dan ketenangan saat situasi genting. — Cut Nyak Dhien',
  'Disiplin dan kerja keras hari ini adalah fondasi kokoh bagi masa depan yang lebih baik. — Sutan Sjahrir',
  'Jadikan setiap soal sebagai ajang pembuktian diri bahwa kamu sudah berusaha maksimal. — Ki Hajar Dewantara',
];

function Logo() {
  return <div className="brand"><span className="brand-mark">C</span><span>TKA<span className="brand-accent">SD</span></span></div>
}

function fieldError(errors, name) {
  const value = errors?.[name]
  return Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : ''
}

export default function LoginPage({
  login,
  setLogin,
  onSubmit,
  error,
  loading,
  onLoginIdentityChange,
  unverifiedLoginAttempts,
  onRegister,
  registerError,
  registerFieldErrors,
  registerLoading,
  registeredEmail,
  resendMessage,
  onResendVerification,
  resendLoading,
}) {
  const [mode, setMode] = useState('login')
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [registration, setRegistration] = useState({
    name: '',
    username: '',
    email: '',
    sekolah: '',
    password: '',
    password_confirmation: '',
  })
  const [passwordMismatch, setPasswordMismatch] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const whatsappUrl = getSupportWhatsAppUrl()

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer
    const updateRotation = () => {
      if (motionPreference.matches) {
        window.clearInterval(timer)
        timer = undefined
      } else if (timer === undefined) {
        timer = window.setInterval(() => {
          setQuoteIndex((index) => (index + 1) % motivationMessages.length)
        }, 6000)
      }
    }

    updateRotation()
    motionPreference.addEventListener('change', updateRotation)
    return () => {
      window.clearInterval(timer)
      motionPreference.removeEventListener('change', updateRotation)
    }
  }, [])

  const updateRegistration = (event) => {
    const { name, value } = event.target
    setRegistration((current) => ({ ...current, [name]: value }))
  }
  const submitRegistration = (event) => {
    if (registration.password !== registration.password_confirmation) {
      event.preventDefault()
      setPasswordMismatch('Konfirmasi password belum sama.')
      return
    }
    setPasswordMismatch('')
    onRegister(event, registration)
  }

  return <div className="login-page">
    <div className="login-decoration decor-one" />
    <div className="login-decoration decor-two" />
    <div className="login-panel">
      <Logo />
      <div className="login-cosmos" aria-hidden="true">
        <span className="login-cosmos__star star-one" />
        <span className="login-cosmos__star star-two" />
        <span className="login-cosmos__star star-three" />
        <span className="login-cosmos__star star-four" />
        <span className="login-cosmos__star star-five" />
        <span className="login-cosmos__orbit" />
        <span className="login-cosmos__orbit login-cosmos__orbit--tilted" />
        <span className="login-cosmos__planet" />
        <span className="login-cosmos__satellite-track"><span className="login-cosmos__satellite" /></span>
      </div>
      <div className="login-copy">
        <span className="eyebrow">UJIAN BERBASIS KOMPUTER</span>
        <h1>
   <span className="login-copy-line">
  <span className="login-copy-word">Jujur</span>{' '}
  <span className="login-copy-word">pada</span>{' '}
  <span className="login-copy-word">proses,</span>
</span>
<em className="login-copy-line login-copy-line--accent">
  <span className="login-copy-word">yakin</span>{' '}
  <span className="login-copy-word">pada</span>{' '}
  <span className="login-copy-word">kemampuan</span>{' '}
  <span className="login-copy-word">sendiri.</span>
</em>
        </h1>
        <p>Kerjakan ujian, tinjau hasil, dan pantau perkembangan belajarmu melalui satu portal.</p>
      </div>
      <div className="login-quote"><span>“</span><p key={quoteIndex}>{motivationMessages[quoteIndex]}</p></div>
    </div>
    <div className={`login-form-wrap ${mode === 'register' ? 'registration-wrap' : ''}`}>
      <div className={`login-form ${mode === 'register' ? 'registration-form' : ''}`}>
        <div className="mobile-login-logo"><Logo /></div>
        {mode === 'login' ? <>
          <span className="eyebrow">MASUK KE AKUN</span>
          <h2>Selamat datang kembali</h2>
          <form onSubmit={onSubmit}>
            <label htmlFor="username">NISN (Nomor Induk Siswa Nasional)<input id="username" value={login.username} onChange={(event) => { onLoginIdentityChange(); setLogin((current) => ({ ...current, username: event.target.value })) }} placeholder="Masukkan NISN" autoComplete="username" disabled={loading} required /></label>
            <label htmlFor="password">Password<div className="password-input-wrap"><input id="password" type={showPassword ? 'text' : 'password'} value={login.password} onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))} placeholder="Masukkan password" autoComplete="current-password" disabled={loading} required /><button type="button" className="password-visibility-toggle" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} disabled={loading}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={19} /></button></div></label>
            {error && <div className="field-error" role="alert"><span aria-hidden="true">!</span><p>{error}</p></div>}
            <button type="submit" className="primary-button wide login-submit-button" disabled={loading}>
              <span>{loading ? 'Memproses...' : 'Masuk'}</span>
            </button>
          </form>
          {unverifiedLoginAttempts >= 3 && <section className="login-verification-prompt" aria-live="polite">
            <strong>Akun belum terverifikasi?</strong>
            <p>Setelah tiga kali percobaan login ditolak, kamu dapat meminta tautan aktivasi dikirim ulang ke email.</p>
            <label htmlFor="resend-login-verification-email">Email akun
              <input id="resend-login-verification-email" type="email" value={verificationEmail} onChange={(event) => setVerificationEmail(event.target.value)} placeholder="nama@email.com" autoComplete="email" required />
            </label>
            {resendMessage && <p className="verification-feedback" role="status">{resendMessage}</p>}
            <button type="button" className="secondary-button wide" onClick={() => onResendVerification(verificationEmail)} disabled={resendLoading || !verificationEmail.trim()}>{resendLoading ? 'Mengirim...' : 'Kirim ulang email verifikasi'}</button>
          </section>}
          <p className="auth-switch">Belum punya akun? <button type="button" onClick={() => setMode('register')}>Daftar siswa</button></p>
          <div className="login-footer"><span>Butuh bantuan?</span>{whatsappUrl ? <a className="text-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Hubungi kami via WhatsApp<span aria-hidden="true">↗</span></a> : <span className="login-contact-unavailable">Kontak WhatsApp belum tersedia</span>}</div>
        </> : registeredEmail ? <section className="registration-success" aria-live="polite">
          <span className="eyebrow">PENDAFTARAN BERHASIL</span>
          <h2>Periksa email kamu</h2>
          <p>Akun dibuat untuk <strong>{registeredEmail}</strong>. Buka tautan verifikasi yang dikirim ke email tersebut untuk mengaktifkan akun sebelum masuk.</p>
          <p className="verification-note">Jika tautan tidak terlihat, periksa folder spam atau minta email verifikasi dikirim ulang.</p>
          {resendMessage && <p className="verification-feedback" role="status">{resendMessage}</p>}
          <button type="button" className="primary-button wide" onClick={onResendVerification} disabled={resendLoading}>{resendLoading ? 'Mengirim...' : 'Kirim ulang email verifikasi'}</button>
          <button type="button" className="auth-secondary-link" onClick={() => setMode('login')}>Kembali ke halaman masuk</button>
        </section> : <>
          <span className="eyebrow">AKUN BARU</span>
          <h2>Daftar sebagai siswa</h2>
          <p className="registration-intro">Isi data berikut. Tautan aktivasi akan dikirim ke email kamu.</p>
          <form onSubmit={submitRegistration}>
            <label htmlFor="register-name">Nama lengkap<input id="register-name" name="name" value={registration.name} onChange={updateRegistration} placeholder="Nama sesuai identitas" autoComplete="name" disabled={registerLoading} required />{fieldError(registerFieldErrors, 'name') && <small className="registration-field-error">{fieldError(registerFieldErrors, 'name')}</small>}</label>
            <label htmlFor="register-email">Email<input id="register-email" name="email" type="email" value={registration.email} onChange={updateRegistration} placeholder="nama@email.com" autoComplete="email" disabled={registerLoading} required />{fieldError(registerFieldErrors, 'email') && <small className="registration-field-error">{fieldError(registerFieldErrors, 'email')}</small>}</label>
            <label htmlFor="register-username">Username <span className="optional-label">Opsional</span><input id="register-username" name="username" value={registration.username} onChange={updateRegistration} placeholder="Dibuat otomatis dari email jika kosong" autoComplete="username" disabled={registerLoading} />{fieldError(registerFieldErrors, 'username') && <small className="registration-field-error">{fieldError(registerFieldErrors, 'username')}</small>}</label>
            <label htmlFor="register-school">Sekolah <span className="optional-label">Opsional</span><input id="register-school" name="sekolah" value={registration.sekolah} onChange={updateRegistration} placeholder="Nama sekolah" autoComplete="organization" disabled={registerLoading} />{fieldError(registerFieldErrors, 'sekolah') && <small className="registration-field-error">{fieldError(registerFieldErrors, 'sekolah')}</small>}</label>
            <label htmlFor="register-password">Password<input id="register-password" name="password" type="password" value={registration.password} onChange={updateRegistration} placeholder="Buat password" autoComplete="new-password" disabled={registerLoading} required />{fieldError(registerFieldErrors, 'password') && <small className="registration-field-error">{fieldError(registerFieldErrors, 'password')}</small>}</label>
            <label htmlFor="register-password-confirmation">Konfirmasi password<input id="register-password-confirmation" name="password_confirmation" type="password" value={registration.password_confirmation} onChange={updateRegistration} placeholder="Ulangi password" autoComplete="new-password" disabled={registerLoading} required />{(passwordMismatch || fieldError(registerFieldErrors, 'password_confirmation')) && <small className="registration-field-error">{passwordMismatch || fieldError(registerFieldErrors, 'password_confirmation')}</small>}</label>
            <label className="privacy-consent" htmlFor="register-privacy">
              <input id="register-privacy" type="checkbox" required disabled={registerLoading} />
              <span>Saya telah membaca dan memahami <a href={`${import.meta.env.BASE_URL}privacy-policy.html`}>Kebijakan Privasi</a>.</span>
            </label>
            {registerError && <div className="field-error" role="alert"><span aria-hidden="true">!</span><p>{registerError}</p></div>}
            <button type="submit" className="primary-button wide" disabled={registerLoading}>{registerLoading ? 'Mendaftarkan...' : 'Buat akun siswa'}</button>
          </form>
          <p className="auth-switch">Sudah punya akun? <button type="button" onClick={() => setMode('login')}>Masuk</button></p>
        </>}
      </div>
    </div>
  </div>
}

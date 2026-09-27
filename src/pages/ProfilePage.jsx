import { getSchoolName, getClassName } from '../utils/exam'

export default function ProfilePage({ student }) {
  const initials = student?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return <div className="page-enter"><div className="page-title-row"><div><p className="eyebrow">AKUN</p><h1>Profil saya</h1><p className="muted">Informasi siswa yang terdaftar pada akunmu.</p></div></div><section className="section-card profile-card"><div className="profile-cover" /><div className="profile-body"><div className="profile-avatar">{initials}</div><h2>{student.name}</h2><p className="muted">Siswa terdaftar</p><div className="profile-fields"><InfoItem label="ID siswa" value={student.id} /><InfoItem label="Username / NIS" value={student.username} /><InfoItem label="Sekolah" value={getSchoolName(student)} /><InfoItem label="Kelas" value={getClassName(student)} /></div></div></section><section className="section-card profile-privacy-actions"><h2>Privasi dan data akun</h2><p>Baca cara data akun dikelola atau hubungi pengelola untuk meminta penghapusan akun dan data terkait.</p><div><a href={`${import.meta.env.BASE_URL}privacy-policy.html`}>Baca Kebijakan Privasi</a><a href="mailto:admin@ujianpro.com?subject=Permintaan%20penghapusan%20akun%20Kelasku">Minta penghapusan akun</a></div></section></div>
}

function InfoItem({ label, value }) {
  return <div className="info-item"><span>{label}</span><strong>{value}</strong></div>
}

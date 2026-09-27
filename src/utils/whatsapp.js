export function getSupportWhatsAppUrl(message = 'Halo Admin Kelasku, saya membutuhkan bantuan.') {
  const number = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  if (!/^\d{8,15}$/.test(number)) return ''
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

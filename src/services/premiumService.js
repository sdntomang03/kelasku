import { apiRequest } from '../api/client'

async function status() {
  const data = await apiRequest('/premium/status')
  if (!data || typeof data.is_premium !== 'boolean' || !['active', 'expired', 'inactive'].includes(data.status)) {
    throw new Error('Format respons status Premium dari server tidak valid.')
  }
  return data
}

async function plans() {
  const data = await apiRequest('/premium/plans')
  if (!Array.isArray(data?.plans) || data.plans.some((plan) => (
    typeof plan.code !== 'string'
    || typeof plan.name !== 'string'
    || typeof plan.available !== 'boolean'
    || typeof plan.amount !== 'number'
    || !Number.isFinite(plan.amount)
    || typeof plan.duration_months !== 'number'
    || !Number.isFinite(plan.duration_months)
  ))) {
    throw new Error('Format daftar paket Premium dari server tidak valid.')
  }
  return data
}

async function checkout(planCode) {
  const data = await apiRequest('/premium/checkout', {
    method: 'POST',
    body: { plan_code: planCode },
  })
  if (typeof data?.redirect_url !== 'string' || !data.redirect_url) {
    throw new Error('Server tidak memberikan tautan pembayaran yang valid.')
  }
  return data
}

export const premiumService = {
  status,
  plans,
  checkout,
}

import { Capacitor } from '@capacitor/core'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { RevenueCatUI } from '@revenuecat/purchases-capacitor-ui'

export const PREMIUM_ENTITLEMENT_ID = 'kelasku_belajar_latihan_tka_sd_pro'

const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY?.trim()
let configurationPromise
let configuredAppUserId = null

export function isRevenueCatAvailable() {
  return Capacitor.isNativePlatform()
}

export async function configureRevenueCat(userId) {
  if (!isRevenueCatAvailable()) {
    throw new Error('Pembelian premium hanya tersedia di aplikasi Android atau iOS.')
  }
  if (!apiKey) {
    throw new Error('Kunci RevenueCat belum dikonfigurasi. Tambahkan VITE_REVENUECAT_API_KEY lalu build ulang aplikasi.')
  }

  const appUserID = String(userId || '').trim()
  if (!appUserID) {
    throw new Error('ID akun siswa tidak tersedia untuk menghubungkan RevenueCat.')
  }

  if (!configurationPromise) {
    configurationPromise = Purchases.configure({ apiKey, appUserID })
      .then(() => {
        configuredAppUserId = appUserID
      })
      .catch((error) => {
        configurationPromise = null
        throw error
      })
  }

  await configurationPromise
  if (configuredAppUserId !== appUserID) {
    await Purchases.logIn({ appUserID })
    configuredAppUserId = appUserID
  }
}

export async function logOutRevenueCat() {
  if (!configurationPromise) return
  await configurationPromise
  if (configuredAppUserId === null) return
  await Purchases.logOut()
  configuredAppUserId = null
}

export async function getRevenueCatCustomerInfo() {
  const { customerInfo } = await Purchases.getCustomerInfo()
  return customerInfo
}

export async function getCurrentRevenueCatOffering() {
  const offerings = await Purchases.getOfferings()
  return offerings.current || null
}

export async function purchaseRevenueCatPackage(aPackage) {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage })
  return customerInfo
}

export async function restoreRevenueCatPurchases() {
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo
}

export async function presentRevenueCatPaywall(offering) {
  return RevenueCatUI.presentPaywall({ offering, displayCloseButton: true })
}

export async function presentRevenueCatCustomerCenter() {
  return RevenueCatUI.presentCustomerCenter()
}

export function hasPremiumEntitlement(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID])
}

export function isRevenueCatPurchaseCancelled(error) {
  const code = String(error?.code || '').toUpperCase()
  return error?.userCancelled === true
    || code === '1'
    || code === 'PURCHASE_CANCELLED_ERROR'
}

import type {
  UserInfo,
  AccessItem,
  MenuItem,
} from '@/services/auth.service'
import { patchHrdMonitoringMenu } from '@/utils/hrdMenuPatch'

// ---------- SAFE CHECK ----------
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// ---------- USER ----------
export function getAuthUser(): UserInfo | null {
  if (!isBrowser()) return null

  const raw = localStorage.getItem('auth_user')
  return raw ? JSON.parse(raw) : null
}

// ---------- CABANG ----------
export function getCabang(): string | null {
  if (!isBrowser()) return null

  return getAuthUser()?.cabang ?? null
}

// ---------- ROLE ----------
export function hasRole(role: string): boolean {
  if (!isBrowser()) return false
  return getAuthUser()?.role === role
}

export function inGroup(group: string): boolean {
  if (!isBrowser()) return false
  return getAuthUser()?.group?.includes(group) ?? false
}

// ---------- ACCESS ----------
export function getAuthAccess(): AccessItem[] {
  if (!isBrowser()) return []

  const raw = localStorage.getItem('auth_access')
  return raw ? JSON.parse(raw) : []
}

export function hasAccess(subject: string, action: string): boolean {
  if (!isBrowser()) return false

  return getAuthAccess().some(
    (a) => a.subject === subject && a.action === action
  )
}

export function hasAnyAccess(subject: string): boolean {
  if (!isBrowser()) return false

  return getAuthAccess().some((a) => a.subject === subject)
}

// ---------- MENU ----------
export function getAuthMenu(): MenuItem[] {
  if (!isBrowser()) return []

  const raw = localStorage.getItem('auth_menu')
  const menu: MenuItem[] = raw ? JSON.parse(raw) : []
  return patchHrdMonitoringMenu(menu)
}

/** Simpan menu auth + patch submenu Monitoring (Karyawan Tetap di atas). */
export function setAuthMenu(menu: MenuItem[]) {
  if (!isBrowser()) return
  localStorage.setItem(
    'auth_menu',
    JSON.stringify(patchHrdMonitoringMenu(menu))
  )
}

// ---------- LOGOUT ----------
export function clearAuth() {
  if (!isBrowser()) return

  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('token_exp')

  localStorage.removeItem('auth_user')
  localStorage.removeItem('auth_access')
  localStorage.removeItem('auth_menu')
  localStorage.removeItem('login_at')
}

import type { MenuItem } from '@/services/auth.service'

const KARYAWAN_TETAP_HREF = '/hrd/karyawan-tetap'
const USER_AKUN_HREF = '/hrd/user-akun'

const karyawanTetapMenuItem: MenuItem = {
  id: 'hrd-karyawan-tetap',
  title: 'Karyawan Tetap',
  icon: 'IconUserCheck',
  href: KARYAWAN_TETAP_HREF,
}

function isMonitoringMenu(item: MenuItem): boolean {
  const title = (item.title ?? '').trim().toLowerCase()
  return title === 'monitoring' || title.includes('monitoring')
}

function isUserAkunMenu(item: MenuItem): boolean {
  const title = (item.title ?? '').trim().toLowerCase()
  const id = (item.id ?? '').trim()
  return (
    title === 'user akun' ||
    id === 'HrdUserAkun' ||
    id === 'hrd-user-akun'
  )
}

function fixMenuHref(item: MenuItem): MenuItem {
  let next = { ...item }

  if (isUserAkunMenu(next)) {
    next = {
      ...next,
      id: next.id ?? 'HrdUserAkun',
      title: next.title ?? 'User Akun',
      icon: next.icon ?? 'IconUsers',
      href: USER_AKUN_HREF,
    }
  }

  if (Array.isArray(next.children) && next.children.length > 0) {
    next.children = patchHrdMonitoringMenu(next.children)
  }

  return next
}

function hasKaryawanTetapItem(children: MenuItem[]): boolean {
  return children.some(
    (c) =>
      c.href === KARYAWAN_TETAP_HREF ||
      (c.title ?? '').trim().toLowerCase() === 'karyawan tetap'
  )
}

/**
 * Patch menu HRD setelah Auth/me:
 * - Karyawan Tetap di submenu Monitoring
 * - href User Akun → /hrd/user-akun
 */
export function patchHrdMonitoringMenu(menu: MenuItem[]): MenuItem[] {
  if (!Array.isArray(menu) || menu.length === 0) return menu

  return menu.map((item) => {
    if (!Array.isArray(item.children) || item.children.length === 0) {
      return fixMenuHref(item)
    }

    if (!isMonitoringMenu(item)) {
      return fixMenuHref({
        ...item,
        children: patchHrdMonitoringMenu(item.children),
      })
    }

    const children = [...item.children]
    if (!hasKaryawanTetapItem(children)) {
      children.unshift({ ...karyawanTetapMenuItem })
    } else {
      const idx = children.findIndex(
        (c) =>
          c.href === KARYAWAN_TETAP_HREF ||
          (c.title ?? '').trim().toLowerCase() === 'karyawan tetap'
      )
      if (idx > 0) {
        const [found] = children.splice(idx, 1)
        children.unshift(found)
      }
    }

    return fixMenuHref({ ...item, children })
  })
}

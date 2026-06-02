import type { MenuItem } from '@/services/auth.service'

const KARYAWAN_TETAP_HREF = '/hrd/karyawan-tetap'

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

function hasKaryawanTetapItem(children: MenuItem[]): boolean {
  return children.some(
    (c) =>
      c.href === KARYAWAN_TETAP_HREF ||
      (c.title ?? '').trim().toLowerCase() === 'karyawan tetap'
  )
}

/**
 * Sisipkan menu Karyawan Tetap di posisi paling atas submenu Monitoring.
 * Dipakai setelah menu dari Auth/me disimpan ke localStorage.
 */
export function patchHrdMonitoringMenu(menu: MenuItem[]): MenuItem[] {
  if (!Array.isArray(menu) || menu.length === 0) return menu

  return menu.map((item) => {
    if (!Array.isArray(item.children) || item.children.length === 0) {
      return item
    }

    if (!isMonitoringMenu(item)) {
      return {
        ...item,
        children: patchHrdMonitoringMenu(item.children),
      }
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

    return { ...item, children }
  })
}

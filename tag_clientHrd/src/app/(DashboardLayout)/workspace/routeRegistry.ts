import type { ComponentType } from "react";

export type RouteLoader = () => Promise<{ default: ComponentType }>;

export const routeRegistry: Record<string, RouteLoader> = {
  "/": () => import("@/app/(DashboardLayout)/page"),
  "/berita": () => import("@/app/(DashboardLayout)/berita/page"),
  "/my-profil": () => import("@/app/(DashboardLayout)/my-profil/page"),
  "/master-data/master-ktp": () =>
    import("@/app/(DashboardLayout)/master-data/master-ktp/page"),
  "/hrd/group-akun": () =>
    import("@/app/(DashboardLayout)/hrd/group-akun/page"),
  "/hrd/user-akun": () =>
    import("@/app/(DashboardLayout)/hrd/user-akun/page"),
  "/hrd/karyawan-tetap": () =>
    import("@/app/(DashboardLayout)/hrd/karyawan-tetap/page"),
  "/hrd/cuti-karyawan": () =>
    import("@/app/(DashboardLayout)/hrd/cuti-karyawan/page"),
  "/hrd/kontrak-karyawan": () =>
    import("@/app/(DashboardLayout)/hrd/kontrak-karyawan/page"),
  "/hrd/kontrak-pkwt": () =>
    import("@/app/(DashboardLayout)/hrd/kontrak-pkwt/page"),
  "/hrd/packlaring-kerja": () =>
    import("@/app/(DashboardLayout)/hrd/packlaring-kerja/page"),
  "/hrd/penilaian-karyawan": () =>
    import("@/app/(DashboardLayout)/hrd/penilaian-karyawan/page"),
  "/hrd/history-kontrak-karyawan": () =>
    import("@/app/(DashboardLayout)/hrd/history-kontrak-karyawan/page"),
  "/hrd/monitoring-cuti-karyawan": () =>
    import("@/app/(DashboardLayout)/hrd/monitoring-cuti-karyawan/page"),
  "/hrd/aproval-evaluasi": () =>
    import("@/app/(DashboardLayout)/hrd/aproval-evaluasi/page"),
  "/utilities/typography": () =>
    import("@/app/(DashboardLayout)/utilities/typography/page"),
  "/utilities/shadow": () =>
    import("@/app/(DashboardLayout)/utilities/shadow/page"),
};

export const MAX_TABS = 15;
export const STORAGE_KEY = "hrd_tab_workspace";

/** Tab dashboard — selalu ada dan tidak bisa ditutup */
export const HOME_HREF = "/";

export function isPinnedTab(href: string): boolean {
  return normalizeHref(href) === HOME_HREF;
}

export function normalizeHref(href: string): string {
  if (!href) return "/";
  let path = href.split("?")[0].split("#")[0];
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

/** Resolve lazy loader — href dari menu/tab dinormalisasi (trailing slash, dll.) */
export function getRouteLoader(href: string): RouteLoader | undefined {
  const normalized = normalizeHref(href);
  return routeRegistry[normalized];
}

export function isWorkspaceRoute(href?: string): href is string {
  if (!href) return false;
  return getRouteLoader(href) !== undefined;
}

const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/my-profil": "My Profil",
  "/hrd/user-akun": "User Akun",
  "/hrd/group-akun": "Group Akun",
};

export function titleFromHref(href: string): string {
  const normalized = normalizeHref(href);
  if (ROUTE_TITLES[normalized]) return ROUTE_TITLES[normalized];
  const segment = normalized.split("/").filter(Boolean).pop() ?? "Page";
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

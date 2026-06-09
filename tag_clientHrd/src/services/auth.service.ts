// src/services/auth.service.ts

import { clearToken, getAccessToken } from "@/helpers/token.helper"
import { authFetch } from "@/utils/fetcher"

interface LoginPayload {
  username: string
  password: string
}

interface ApiResponse<T> {
  metadata: {
    code: string
    message: string
  }
  response: T
}

interface LoginSuccess {
  token: string
  refreshToken: string
  expiresIn: number
}

// ===== TAMBAHAN UNTUK AUTH/ME =====

export interface UserInfo {
  fullName: string
  username: string
  avatar?: string
  cabang?: string
  niksistag?: string
  group: string[]
  role: string
}

export interface AccessItem {
  subject: string
  action: string
}

export interface MenuItem {
  id?: string
  title?: string
  icon?: string
  href?: string
  navlabel?: boolean
  subheader?: string
  children?: MenuItem[]
}

export interface MeResponse {
  user: UserInfo
  acces: AccessItem[]
  Menu: MenuItem[]
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_AUT

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL_AUT belum diset')
}

export async function login(
  payload: LoginPayload
): Promise<LoginSuccess> {
  let res: Response

  try {
    res = await fetch(`${BASE_URL}Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Modul': 'HRD', // 🔥 TAMBAH INI
      },
      body: JSON.stringify(payload),
    })
  } catch {
    // ❌ server mati / network error
    throw new Error('Server tidak dapat dihubungi')
  }

  let data: ApiResponse<LoginSuccess | ''>

  try {
    data = await res.json()
  } catch {
    // ❌ API tidak balikin JSON (HTML error, proxy error, dll)
    throw new Error('Respon server tidak valid')
  }

  /**
   * 🔴 ATURAN UTAMA
   * Backend adalah source of truth
   */
  if (!res.ok) {
    // contoh: 400, 401, 403, 500
    throw new Error(data?.metadata?.message || 'Terjadi kesalahan')
  }

  if (data.metadata.code !== '200') {
    throw new Error(data.metadata.message)
  }

  if (!data.response || !('token' in data.response)) {
    throw new Error('Token tidak ditemukan')
  }

  return data.response
}

export async function getMe(): Promise<MeResponse> {
  let res: Response;

  try {
    res = await authFetch(`${BASE_URL}Auth/me`, {
      method: "GET",
    });
  } catch (err) {
    throw new Error("Gagal mengambil data user");
  }

  let data: ApiResponse<MeResponse>;

  try {
    data = await res.json();
  } catch {
    throw new Error("Respon server tidak valid");
  }

  if (!res.ok || data.metadata.code !== "200") {
    throw new Error(data.metadata.message);
  }

  return data.response;
}

export async function refreshToken(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) {
    throw new Error("No refresh token");
  }

  let res: Response;

  try {
    res = await fetch(
      `${BASE_URL}Auth/refresh`,
      {
        method: "POST",
       headers: {
          "X-Refresh-Token": refresh, // ✅ WAJIB
          "X-Modul": "HRD", 
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    throw new Error("Server tidak dapat dihubungi");
  }

  if (!res.ok) {
    throw new Error("Refresh token expired");
  }

  const data = await res.json();

  if (data.metadata.code !== "200") {
    throw new Error(data.metadata.message);
  }

  /**
   * 🔁 ROTATE TOKEN
   * refresh lama → MATI
   * refresh baru → SIMPAN
   */
  localStorage.setItem("refresh_token", data.response.refreshToken);

  return data.response;
}

export async function logout(): Promise<void> {
  const accessToken = getAccessToken();

  try {
    if (accessToken) {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}Auth/logout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch {
    // ❗ tidak perlu throw
    // logout tetap jalan walau server error
  } finally {
    // 🔥 WAJIB: bersihkan client
    clearToken();
  }
}

type ChangePasswordPayload = {
  CurrentPassword: string
  NewPassword: string
  ConfimrNewPassword: string
}

type ChangePasswordResponse = {
  metadata?: { code?: string; message?: string }
  Metadata?: { Code?: string; Message?: string }
  response?: any
  Response?: any
  data?: any
  Data?: any
  message?: string
}

function pickErrorMessage(json: any, fallback: string) {
  return (
    json?.metadata?.message ||
    json?.Metadata?.Message ||
    json?.message ||
    json?.Message ||
    fallback
  )
}

export async function changePassword(payload: ChangePasswordPayload) {
  if (!payload?.CurrentPassword?.trim()) throw new Error('Password lama wajib diisi')
  if (!payload?.NewPassword?.trim()) throw new Error('Password baru wajib diisi')
  if (!payload?.ConfimrNewPassword?.trim()) throw new Error('Konfirmasi password wajib diisi')

  const endpoints = [
    `${BASE_URL}Profile/change-password`,
    `${BASE_URL}Auth/ChangePassword`,
    `${BASE_URL}Auth/change-password`,
    `${BASE_URL}Auth/Change-Password`,
  ]

  let lastErr: unknown = null

  for (const url of endpoints) {
    try {
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Modul': 'HRD' },
        body: JSON.stringify(payload),
      })

      // kalau endpoint tidak ada, coba endpoint lain
      if (res.status === 404) continue

      let json: ChangePasswordResponse | any = null
      try {
        json = await res.json()
      } catch {
        json = null
      }

      if (!res.ok) {
        throw new Error(pickErrorMessage(json, 'Gagal mengubah password'))
      }

      // some auth APIs return { metadata: { code, message } }
      const code = String(json?.metadata?.code ?? json?.Metadata?.Code ?? '').trim()
      if (code && code !== '200') {
        throw new Error(pickErrorMessage(json, 'Gagal mengubah password'))
      }

      return json
    } catch (e) {
      lastErr = e
      // coba endpoint berikutnya bila route belum ada
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.toLowerCase().includes('404')) {
        continue
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('Gagal mengubah password')
}

type UploadAvatarResponse = {
  metadata?: { code?: string; message?: string }
  Metadata?: { Code?: string; Message?: string }
  response?: any
  Response?: any
  data?: any
  Data?: any
  message?: string
}

function pickAvatarUrl(json: any): string | null {
  const cand =
    json?.response?.avatar ||
    json?.Response?.Avatar ||
    json?.response?.Avatar ||
    json?.data?.avatar ||
    json?.Data?.Avatar ||
    json?.Data?.avatar ||
    json?.avatar ||
    json?.Avatar ||
    null
  if (!cand) return null
  return String(cand).trim() || null
}

export async function uploadProfilePhoto(file: File) {
  if (!file) throw new Error('File wajib dipilih')

  const endpoints = [
    `${BASE_URL}Auth/UploadPhoto`,
    `${BASE_URL}Auth/UploadAvatar`,
    `${BASE_URL}Auth/UploadProfilePhoto`,
    `${BASE_URL}Auth/UpdateAvatar`,
    `${BASE_URL}Auth/UpdatePhoto`,
  ]

  const fieldNames = ['file', 'photo', 'avatar', 'image']

  let lastErr: unknown = null

  for (const url of endpoints) {
    for (const field of fieldNames) {
      try {
        const form = new FormData()
        form.append(field, file)

        const res = await authFetch(url, {
          method: 'POST',
          headers: { 'X-Modul': 'HRD' }, // jangan set content-type, biar browser set boundary
          body: form,
        })

        if (res.status === 404) continue

        let json: UploadAvatarResponse | any = null
        try {
          json = await res.json()
        } catch {
          json = null
        }

        if (!res.ok) {
          throw new Error(pickErrorMessage(json, 'Gagal upload photo profil'))
        }

        const code = String(json?.metadata?.code ?? json?.Metadata?.Code ?? '').trim()
        if (code && code !== '200') {
          throw new Error(pickErrorMessage(json, 'Gagal upload photo profil'))
        }

        return {
          raw: json,
          avatarUrl: pickAvatarUrl(json),
        }
      } catch (e) {
        lastErr = e
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('Gagal upload photo profil')
}

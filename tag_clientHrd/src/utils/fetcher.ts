// src/utils/fetcher.ts
import {
  clearToken,
  getAccessToken,
  isTokenExpired,
  setAuthToken,
} from "@/helpers/token.helper";
import { refreshToken } from "@/services/auth.service";

let isRefreshing = false;
let queue: ((token: string) => void)[] = [];

function processQueue(token: string) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

function forceLogout() {
  clearToken();
  window.location.href = "/auth/auth1/login";
}

export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();

  // 🔁 TOKEN EXPIRED → REFRESH
  if (token && isTokenExpired()) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const res = await refreshToken();

        setAuthToken(
          res.accessToken,
          res.refreshToken,
          res.expiresIn
        );

        token = res.accessToken;
        processQueue(token);
      } catch {
        clearToken();
        window.location.href = "/auth/auth1/login";
        throw new Error("Session expired");
      } finally {
        isRefreshing = false;
      }
    }

    // ⏳ tunggu refresh selesai
    return new Promise<Response>((resolve) => {
      queue.push((newToken) => {
        resolve(
          authFetch(input, {
            ...init,
            headers: {
              ...(init.headers || {}),
              Authorization: `Bearer ${newToken}`,
              "X-Modul": "HRD", // 🔥 TAMBAH DI SINI JUGA
            },
          })
        );
      });
    });
  }

  // ✅ REQUEST NORMAL
  let response = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
      "X-Modul": "HRD", // 🔥 TAMBAH DI SINI JUGA
    },
  });

  // ==========================================
  // 🔥 401 → COBA REFRESH SEKALI, LALU RETRY
  // ==========================================
  if (response.status === 401) {
    // kalau tidak ada token, ya memang belum login
    if (!token) {
      forceLogout();
      throw new Error("Session invalidated");
    }

    // avoid infinite loop: refresh sekali lalu retry
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        const res = await refreshToken();
        setAuthToken(res.accessToken, res.refreshToken, res.expiresIn);
        token = res.accessToken;
        processQueue(token);
      } else {
        // tunggu refresh in-flight (queue callback wajib terima token)
        token = await new Promise<string>((resolve) => {
          queue.push((newToken) => resolve(newToken));
        });
      }
    } catch {
      forceLogout();
      throw new Error("Session invalidated");
    } finally {
      // NOTE: isRefreshing di-reset oleh "leader" refresh
      // di blok token-expired refresh (atau leader 401 refresh).
      // Follower cukup menunggu via queue.
      if (!queue.length) {
        isRefreshing = false;
      }
    }

    // retry request with fresh token
    response = await fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
        "X-Modul": "HRD",
      },
    });

    if (response.status === 401) {
      forceLogout();
      throw new Error("Session invalidated");
    }
  }

  // 🚫 FORBIDDEN → redirect
  if (response.status === 403) {
    window.location.href = "/forbidden"; // atau /403
    throw new Error("Forbidden");
  }

  return response;
}

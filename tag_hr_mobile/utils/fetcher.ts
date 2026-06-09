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

async function forceLogout(reason: string) {
  console.warn("[authFetch] forceLogout:", reason);
  await clearToken();
}

export async function authFetch(
  url: string,
  options: RequestInit = {},
  retryOn401: boolean = true,
): Promise<Response> {
  let token: string | null = await getAccessToken();
  token = typeof token === "string" ? token.trim() : token;

  // =====================================
  // TOKEN EXPIRED → REFRESH
  // =====================================
  if (token && (await isTokenExpired())) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const res = await refreshToken();

        await setAuthToken(
          res?.Data.Token,
          res?.Data.RefreshToken,
          res?.Data.ExpiredAt,
        );

        token = typeof res?.Data?.Token === "string" ? res.Data.Token.trim() : null;

        if (!token) {
          await forceLogout("refresh sukses tapi token kosong");
          throw new Error("Token kosong");
        }

        processQueue(token);
      } catch (err: any) {
        console.log("REFRESH ERROR FULL:", err);
        console.log(err);
        let message =
          err?.message ||
          err?.response?.data?.message ||
          err?.Metadata?.Message ||
          "Session expired";

        await forceLogout("refresh token gagal");

        throw new Error(message);
      } finally {
        isRefreshing = false;
      }
    }

    // request lain menunggu refresh selesai
    return new Promise<Response>((resolve) => {
      queue.push((newToken) => {
        resolve(
          authFetch(url, {
            ...options,
            headers: {
              ...(options.headers || {}),
              Authorization: `Bearer ${newToken}`,
            },
          }),
        );
      });
    });
  }

  // =====================================
  // REQUEST NORMAL
  // =====================================
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  // =====================================
  // SESSION INVALID
  // =====================================
  if (response.status === 401) {
    let serverMsg = "";
    try {
      const text = await response.clone().text();
      serverMsg = text ? ` - ${text}` : "";
    } catch {
      // ignore
    }

    // Token bisa dianggap valid di client tapi server sudah invalidate.
    // Coba refresh sekali lalu retry request (tanpa memicu loop).
    if (token && retryOn401) {
      console.warn("[authFetch] 401, mencoba refresh lalu retry:", url);
      try {
        const res = await refreshToken();
        await setAuthToken(
          res?.Data.Token,
          res?.Data.RefreshToken,
          res?.Data.ExpiredAt,
        );

        const newToken =
          typeof res?.Data?.Token === "string" ? res.Data.Token.trim() : null;

        if (!newToken) {
          await forceLogout("retry-401 refresh sukses tapi token kosong");
          throw new Error("Token kosong");
        }

        return authFetch(url, options, false);
      } catch (err: any) {
        const msg =
          err?.message ||
          err?.response?.data?.message ||
          err?.Metadata?.Message ||
          "Session expired";
        await forceLogout(`401 + refresh gagal (${url})`);
        throw new Error(msg);
      }
    }

    await forceLogout(`401 dari server (${url})${serverMsg}`);
    throw new Error("Session invalidated");
  }

  if (response.status === 403) {
    throw new Error("Forbidden");
  }

  return response;
}

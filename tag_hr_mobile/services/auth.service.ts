import { AUTH_API_BASE_URL, AUTH_API_ENDPOINT } from "@/constants/api";
import { getRefreshToken } from "@/helpers/token.helper";
import { authFetch } from "@/utils/fetcher";

export async function login(username: string, password: string) {
  const res = await fetch(`${AUTH_API_BASE_URL}${AUTH_API_ENDPOINT.LOGIN}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Username: username,
      Password: password,
    }),
  });

  const json = await res.json();

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Login gagal");
  }

  return json;
}

export async function refreshToken() {
  const refreshToken = await getRefreshToken();
  console.log(`Refresh Token : ${refreshToken}`);

  const cleanToken = (refreshToken ?? "")
    .replace(/\s+/g, "") // 🔥 hapus semua whitespace
    .trim();

  const res = await fetch(`${AUTH_API_BASE_URL}${AUTH_API_ENDPOINT.REFRESH}`, {
    method: "POST",
    headers: {
      "X-Refresh-Token": cleanToken ?? "",
    },
  });

  const json = await res.json();

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Refresh token gagal");
  }

  return json;
}

export async function getRiwayatLogin() {
  const res = await authFetch(
    `${AUTH_API_BASE_URL}${AUTH_API_ENDPOINT.GET_RIWAYAT_LOGIN}`,
  );
  const json = await res.json();
  console.log(`${AUTH_API_BASE_URL}${AUTH_API_ENDPOINT.GET_RIWAYAT_LOGIN}`);
  console.log(json);
  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal mengambil riwayat login");
  }

  return json?.Data ?? [];
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  const res = await authFetch(`${AUTH_API_BASE_URL}${AUTH_API_ENDPOINT.CHANGE_PASSWORD}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      CurrentPassword: currentPassword,
      NewPassword: newPassword,
      ConfimrNewPassword: confirmPassword,
    }),
  });

  const json = await res.json();

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal mengubah password");
  }

  return json;
}

export async function updatePhoto(photoBase64: string) {
  const res = await authFetch(`${AUTH_API_BASE_URL}${AUTH_API_ENDPOINT.UPDATE_PHOTO}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ PhotoBase64: photoBase64 }),
  });

  const json = await res.json();

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal mengubah foto profil");
  }

  return json;
}

export async function logout() {
  const res = await authFetch(
    `${AUTH_API_BASE_URL}${AUTH_API_ENDPOINT.LOGOUT}`,
    {
      method: "POST",
    },
  );

  console.log(res);

  const text = await res.text();

  if (!text) return true;

  try {
    return JSON.parse(text);
  } catch {
    return true;
  }
}

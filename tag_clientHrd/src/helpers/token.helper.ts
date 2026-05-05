// src/helpers/token.helper.ts

export function setAuthToken(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const exp = Math.floor(Date.now() / 1000) + expiresIn;

  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  localStorage.setItem("token_exp", exp.toString());
}

export function setAccessToken(
  accessToken: string,
  expiresIn: number
) {
  const exp = Math.floor(Date.now() / 1000) + expiresIn;

  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("token_exp", exp.toString());
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function isTokenExpired(): boolean {
  const exp = localStorage.getItem("token_exp");
  if (!exp) return true;

  return Date.now() / 1000 > Number(exp) - 30; // buffer 30 detik
}

export function clearToken() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_exp");
}

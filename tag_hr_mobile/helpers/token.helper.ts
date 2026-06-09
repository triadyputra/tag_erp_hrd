import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getAccessToken() {
  return await AsyncStorage.getItem("token");
}

export async function getRefreshToken() {
  return await AsyncStorage.getItem("refreshToken");
}

export async function getExpiredAt() {
  return await AsyncStorage.getItem("expiredAt");
}

export async function setAuthToken(
  token: string,
  refreshToken: string,
  expiredAt: string,
) {
  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("refreshToken", refreshToken);
  await AsyncStorage.setItem("expiredAt", expiredAt);
}

export async function clearToken() {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("refreshToken");
  await AsyncStorage.removeItem("expiredAt");
  await AsyncStorage.removeItem("user");
}

/* export async function isTokenExpired() {
  const expired = await AsyncStorage.getItem("expiredAt");

  if (!expired) return true;

  return new Date(expired) < new Date();
} */

export async function isTokenExpired(): Promise<boolean> {
  const expired = await AsyncStorage.getItem("expiredAt");

  //console.log("RAW EXPIRED:", expired);

  if (!expired) return true;

  const now = Date.now();

  let expTime = 0;

  if (!isNaN(Number(expired))) {
    expTime = Number(expired);
  } else {
    // 🔥 FIX MICROSECOND
    const clean = expired.replace(/\.\d+Z$/, "Z");

    expTime = new Date(clean).getTime();
  }

  //console.log("NOW:", now);
  //console.log("EXP TIME:", expTime);

  if (!expTime || isNaN(expTime)) return true;

  // 🔥 BUFFER DIPERBESAR (PENTING)
  return expTime - now < 2 * 60 * 1000; // 2 menit
}

export async function getUser() {
  const data = await AsyncStorage.getItem("user");
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    // data korup / format berubah → bersihkan biar tidak error terus
    await AsyncStorage.removeItem("user");
    return null;
  }
}

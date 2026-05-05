// src/utils/swrFetcher.ts
import { authFetch } from "@/utils/fetcher";

export const swrFetcher = async (url: string) => {
  const res = await authFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  // kalau 401 → authFetch akan refresh sendiri sebelum sampai sini
  // kalau masih gagal (refresh expired) → authFetch akan redirect login
  if (!res.ok) {
    let msg = "Gagal mengambil data";
    try {
      const j = await res.json();
      msg = j?.message || j?.metadata?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
};

import { DATA_API_BASE_URL, DATA_API_ENDPOINT } from "@/constants/api";
import { authFetch } from "@/utils/fetcher";

export async function getDetailKaryawan(noktp: string) {
  if (!noktp) {
    throw new Error("No KTP wajib diisi");
  }

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.GET_DETAIL_KARYAWAN}?noktp=${encodeURIComponent(noktp)}`;

  const res = await authFetch(url, {
    method: "GET",
  });

  console.log("RAW RESPONSE:", res);
  // console.log(res);
  // handle response text (biar aman kayak logout)
  const text = await res.text();

  console.log("RAW RESPONSE:", text);
  if (!text) {
    throw new Error("Response kosong dari server");
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Format response tidak valid");
  }

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal mengambil data karyawan");
  }

  return json?.Data;
}

export async function getDetailKontrakMobile(noKontrak: string) {
  if (!noKontrak) {
    throw new Error("No kontrak wajib diisi");
  }

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.GET_DETAIL_KONTRAK_MOBILE}?noKontrak=${encodeURIComponent(noKontrak)}`;

  const res = await authFetch(url, {
    method: "GET",
  });

  console.log("RAW RESPONSE:", res);

  const text = await res.text();

  if (!text) {
    throw new Error("Response kosong dari server");
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Format response tidak valid");
  }

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal mengambil data kontrak");
  }

  return json?.Data; // { Detail, PdfBase64 }
}

export async function signKontrak(noKontrak: string, signature: string) {
  if (!noKontrak) {
    throw new Error("No kontrak wajib diisi");
  }

  if (!signature) {
    throw new Error("Signature wajib diisi");
  }

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.SIGN_KONTRAK}`;

  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      NoKontrak: noKontrak,
      Signature: signature,
    }),
  });

  console.log("RAW RESPONSE SIGN:", res);

  const text = await res.text();

  if (!text) {
    throw new Error("Response kosong dari server");
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Format response tidak valid");
  }

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal kirim tanda tangan");
  }

  return json?.Data;
}

import { DATA_API_BASE_URL, DATA_API_ENDPOINT } from "@/constants/api";
import { authFetch } from "@/utils/fetcher";

export type PaklaringItem = {
  Id?: string;
  Tanggal?: string;
  Nomor?: string;
  NoKtp?: string;
  Nik?: string;
  NamaKaryawan?: string;
  Divisi?: string;
  Masuk?: string;
  Keluar?: string;
  Hrd?: string;
  KdCabang?: string;
  NmCabang?: string;
  Keperluan?: string;
  Jenis?: string;
  Status?: number;
};

export type PengajuanPacklaringRequest = {
  NoKtp?: string;
  Jenis?: string;
  Keperluan?: string;
};

export async function getListPaklaringByNik(noKtp: string) {
  if (!noKtp) throw new Error("No KTP wajib diisi");

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.GET_LIST_PAKLARING_BY_NIK}?NoKtp=${encodeURIComponent(noKtp)}`;

  const res = await authFetch(url, { method: "GET" });

  const text = await res.text();
  if (!text) throw new Error("Response kosong dari server");

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Format response tidak valid");
  }

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal mengambil data paklaring");
  }

  return (json?.Data ?? []) as PaklaringItem[];
}

export async function printPaklaringMobile(id: string) {
  if (!id) throw new Error("Id paklaring wajib diisi");

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.PRINT_PAKLARING_MOBILE}?id=${encodeURIComponent(id)}`;

  const res = await authFetch(url, { method: "GET" });

  const text = await res.text();
  if (!text) throw new Error("Response kosong dari server");

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Format response tidak valid");
  }

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal cetak paklaring");
  }

  const pdfBase64 = json?.Data?.PdfBase64 as string | undefined;
  if (!pdfBase64) throw new Error("PdfBase64 tidak ditemukan");

  return {
    detail: json?.Data?.Detail,
    pdfBase64,
  };
}

export async function savePacklaringMobile(payload: PengajuanPacklaringRequest) {
  const noKtp = payload?.NoKtp?.trim();
  const jenis = payload?.Jenis?.trim();
  const keperluan = payload?.Keperluan?.trim();

  if (!noKtp) throw new Error("No KTP wajib diisi");
  if (!jenis) throw new Error("Jenis wajib diisi");
  if (!keperluan) throw new Error("Keperluan wajib diisi");

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.SAVE_PAKLARING_MOBILE}`;

  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      NoKtp: noKtp,
      Jenis: jenis,
      Keperluan: keperluan,
    }),
  });

  const text = await res.text();
  if (!text) throw new Error("Response kosong dari server");

  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Format response tidak valid");
  }

  if (!json?.Metadata?.Success) {
    throw new Error(json?.Metadata?.Message || "Gagal mengajukan paklaring");
  }

  return json?.Data;
}


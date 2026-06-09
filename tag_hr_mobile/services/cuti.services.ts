import { DATA_API_BASE_URL, DATA_API_ENDPOINT } from "@/constants/api";
import { authFetch } from "@/utils/fetcher";

export async function getDetailCuti(noktp: string, tahun?: number) {
  if (!noktp) {
    throw new Error("No KTP wajib diisi");
  }

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.GET_DETAIL_CUTI}?noktp=${encodeURIComponent(noktp)}&tahun=${tahun ?? ""}`;

  const res = await authFetch(url, {
    method: "GET",
  });

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
    throw new Error(json?.Metadata?.Message || "Gagal mengambil saldo cuti");
  }
  console.log(json?.Data);
  return json?.Data;
}

export async function saveCutiKaryawanMobile(
  nik: string,
  jnsCuti: string,
  Keperluan: string,
  tanggalCuti: string[],
) {
  if (!nik) {
    throw new Error("NIK wajib diisi");
  }

  if (!jnsCuti) {
    throw new Error("Jenis cuti wajib diisi");
  }

  if (!tanggalCuti || tanggalCuti.length === 0) {
    throw new Error("Tanggal cuti wajib diisi");
  }

  if (!Keperluan || Keperluan.length === 0) {
    throw new Error("Keperluan wajib diisi");
  }

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.SAVE_CUTI_MOBILE}`;

  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      NIK: nik,
      JnsCuti: jnsCuti,
      Keperluan: Keperluan,
      TanggalCuti: tanggalCuti,
    }),
  });

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
    throw new Error(json?.Metadata?.Message || "Gagal menyimpan cuti");
  }

  return json?.Data; // { NoCuti }
}

export async function deleteCutiKaryawanMobile(noCuti: string) {
  if (!noCuti) {
    throw new Error("NoCuti wajib diisi");
  }

  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.DELETE_CUTI_MOBILE}/${encodeURIComponent(noCuti)}`;

  const res = await authFetch(url, {
    method: "DELETE",
  });

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
    throw new Error(json?.Metadata?.Message || "Gagal menghapus cuti");
  }

  return true;
}

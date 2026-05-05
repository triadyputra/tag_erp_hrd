"use client";

import { authFetch } from "@/utils/fetcher";
import { useEffect, useState } from "react";

interface ComboItem {
  value: string;
  title: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function useComboGroup() {
  const [groups, setGroups] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchGroup() {
      try {
        const res = await authFetch(
          `${BASE_URL}Combo/ComboGroup`
        );
        const json = await res.json();
        console.log(json)
        if (active && json) {
          setGroups(json);
        }
      } catch (err) {
        console.error("Gagal load combo group", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchGroup();

    return () => {
      active = false;
    };
  }, []);

  return { groups, loading };
}


export function useComboCabang() {
  const [cabang, setCabang] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchCabang() {
      try {
        const res = await authFetch(`${BASE_URL}Combo/ComboCabang`);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          // 🔑 NORMALISASI DATA DI SINI
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Id,
            title: x.Name,
          }));

          setCabang(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo cabang", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchCabang();

    return () => {
      active = false;
    };
  }, []);

  return { cabang, loading };
}

export function useComboCabangWith() {
  const [cabang, setCabang] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchCabang() {
      try {
        const res = await authFetch(`${BASE_URL}Combo/ComboCabangWithPusat`);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          // 🔑 NORMALISASI DATA DI SINI
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Id,
            title: x.Name,
          }));

          setCabang(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo cabang", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchCabang();

    return () => {
      active = false;
    };
  }, []);

  return { cabang, loading };
}

export function useComboBank() {
  const [bank, setBank] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchBank() {
      try {
        const res = await authFetch(`${BASE_URL}Combo/ComboBank`);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          // 🔑 NORMALISASI DATA DI SINI
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Id,
            title: x.Name,
          }));

          setBank(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo bank", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchBank();

    return () => {
      active = false;
    };
  }, []);

  return { bank, loading };
}

export function useComboMerek() {
  const [merek, setMerek] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchMerek() {
      try {
        const res = await authFetch(`${BASE_URL}Combo/ComboMerekKaset`);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          // 🔑 NORMALISASI DATA DI SINI
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Id,
            title: x.Name,
          }));

          setMerek(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo merek", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMerek();

    return () => {
      active = false;
    };
  }, []);

  return { merek, loading };
}

export function useComboTipe() {
  const [tipe, setTipe] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchTipe() {
      try {
        const res = await authFetch(`${BASE_URL}Combo/ComboTipeKaset`);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          // 🔑 NORMALISASI DATA DI SINI
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Id,
            title: x.Name,
          }));

          setTipe(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo tipe", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchTipe();

    return () => {
      active = false;
    };
  }, []);

  return { tipe, loading };
}

export function useComboJenis() {
  const [jenis, setJenis] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchJenis() {
      try {
        const res = await authFetch(`${BASE_URL}Combo/ComboJenisKaset`);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          // 🔑 NORMALISASI DATA DI SINI
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Id,
            title: x.Name,
          }));

          setJenis(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo jenis", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchJenis();

    return () => {
      active = false;
    };
  }, []);

  return { jenis, loading };
}

export function useComboStatus() {
  const [status, setStatus] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      try {
        const res = await authFetch(`${BASE_URL}Combo/ComboStatusKaset`);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          // 🔑 NORMALISASI DATA DI SINI
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Id,
            title: x.Name,
          }));

          setStatus(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo jenis", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchStatus();

    return () => {
      active = false;
    };
  }, []);

  return { status, loading };
}

export function useComboKasetByCab(kdcab: string, bank: string) {
  const [kaset, setKaset] = useState<ComboItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // ⛔ jangan fetch kalau filter belum lengkap
    if (!kdcab || !bank) {
      setKaset([])
      return
    }

    let active = true
    setLoading(true)

    async function fetchKaset() {
      try {
        const res = await authFetch(
          `${BASE_URL}Combo/ComboKasetByCab?kdcab=${kdcab}&bank=${bank}`
        )

        const json = await res.json()

        if (active && Array.isArray(json)) {
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Id,
            title: x.Name,
          }))

          setKaset(mapped)
        }
      } catch (err) {
        console.error('Gagal load combo kaset', err)
        if (active) setKaset([])
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchKaset()

    return () => {
      active = false
    }
  }, [kdcab, bank]) // 🔥 PENTING

  return { kaset, loading }
}


export async function checkKasetByKode(kode: string) {
  const res = await authFetch(
    `${BASE_URL}Combo/CheckReadyByKode/${kode}`,
    {
      method: 'GET',
    }
  )

  const rawText = await res.text()

  let json: any
  try {
    json = rawText ? JSON.parse(rawText) : null
  } catch {
    throw new Error('Response tidak valid')
  }

  // ❗ pola SAMA persis dengan CPC lain
  if (!res.ok || json?.Metadata?.Success === false) {
    throw new Error(
      json?.Metadata?.Message || 'Kaset tidak tersedia atau tidak READY'
    )
  }

  // 🔥 KONSISTEN: kembalikan Data saja
  return json.Data
}

export function useComboVendorByNama() {
  const [vendor, setVendor] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchVendor() {
      try {
        const res = await authFetch(`${BASE_URL}Combo/ComboVendor`);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          const mapped: ComboItem[] = json.map((x: any) => ({
            value: x.Name,
            title: x.Name,
          }));

          setVendor(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo vendor", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchVendor();

    return () => {
      active = false;
    };
  }, []);

  return { vendor, loading };
}


/* HRD */
export async function getFilterMasterKtp(nama?: string, cabang?: string) {
  const params = new URLSearchParams()

  if (nama) params.append("nama", nama)
  if (cabang) params.append("cabang", cabang)

  const res = await authFetch(
    `${BASE_URL}Combo/GetFilterMasterKtp?${params.toString()}`,
    { method: "GET" }
  )

  const rawText = await res.text()

  let json: any
  try {
    json = rawText ? JSON.parse(rawText) : null
  } catch {
    throw new Error("Response tidak valid")
  }

  if (!res.ok || json?.Metadata?.Success === false) {
    throw new Error(json?.Metadata?.Message || "Gagal ambil data karyawan")
  }

  return json.Data
}

// ===============================
// GET MASTER KTP
// ===============================
export async function getDetailMasterKtp(noktp?: string) {
  const params = new URLSearchParams()

  if (noktp) params.append("noktp", noktp)

  const res = await authFetch(
    `${BASE_URL}Combo/GetDetailMasterKtp?${params.toString()}`,
    { method: "GET" }
  )

  const rawText = await res.text()

  let json: any
  try {
    json = rawText ? JSON.parse(rawText) : null
  } catch {
    throw new Error("Response tidak valid")
  }

  if (!res.ok || json?.Metadata?.Success === false) {
    throw new Error(json?.Metadata?.Message || "Gagal ambil data karyawan")
  }

  return json.Data
}

/** Detail pegawai + kontrak berdasarkan NIK sistem (`cniksistag`) — Combo/GetDetailPegawaiWithKontrakNik */
export async function getDetailPegawaiWithKontrakNik(cniksistag: string) {
  if (!cniksistag?.trim()) throw new Error("NIK wajib diisi")

  const params = new URLSearchParams({ cniksistag: cniksistag.trim() })

  const res = await authFetch(
    `${BASE_URL}Combo/GetDetailPegawaiWithKontrakNik?${params.toString()}`,
    { method: "GET" }
  )

  const rawText = await res.text()

  let json: any
  try {
    json = rawText ? JSON.parse(rawText) : null
  } catch {
    throw new Error("Response tidak valid")
  }

  if (!res.ok || json?.Metadata?.Success === false) {
    throw new Error(
      json?.Metadata?.Message || "Gagal ambil detail pegawai dengan kontrak"
    )
  }

  return json.Data
}

export async function getFilterKaryawan(nama?: string, cabang?: string) {
  const params = new URLSearchParams()

  if (nama) params.append("nama", nama)
  if (cabang) params.append("cabang", cabang)

  const res = await authFetch(
    `${BASE_URL}Combo/GetFilterKaryawan?${params.toString()}`,
    { method: "GET" }
  )

  const rawText = await res.text()

  let json: any
  try {
    json = rawText ? JSON.parse(rawText) : null
  } catch {
    throw new Error("Response tidak valid")
  }

  if (!res.ok || json?.Metadata?.Success === false) {
    throw new Error(json?.Metadata?.Message || "Gagal ambil data karyawan")
  }

  return json.Data
}

export async function getDetailKaryawan(noktp?: string) {
  const params = new URLSearchParams()

  if (noktp) params.append("noktp", noktp)

  const res = await authFetch(
    `${BASE_URL}Combo/GetDetailKaryawan?${params.toString()}`,
    { method: "GET" }
  )

  const rawText = await res.text()

  let json: any
  try {
    json = rawText ? JSON.parse(rawText) : null
  } catch {
    throw new Error("Response tidak valid")
  }

  if (!res.ok || json?.Metadata?.Success === false) {
    throw new Error(json?.Metadata?.Message || "Gagal ambil data karyawan")
  }

  return json.Data
}



export function useComboGeneric(
  url: string,
  enabled: boolean = true, // 🔥 tambahan
  mapFn?: (x: any) => ComboItem
) {
  const [data, setData] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    // 🔥 STOP kalau tidak enabled
    if (!enabled) {
      setData([]);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const res = await authFetch(url);
        const json = await res.json();

        if (active && Array.isArray(json)) {
          const mapped = mapFn
            ? json.map(mapFn)
            : json.map((x: any) => ({
                value: x.value ?? x.Id ?? x.KODE,
                title: x.title ?? x.Name ?? x.NAMA,
              }));

          setData(mapped);
        }
      } catch (err) {
        console.error("Gagal load combo:", url, err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [url, enabled]);

  return { data, loading };
}

/* DIVISI */
export function useComboDivisi() {
  return useComboGeneric(`${BASE_URL}Combo/ComboDivisi`);
}

/* BAGIAN */
export function useComboBagian(divisi?: string) {
  return useComboGeneric(
    `${BASE_URL}Combo/ComboBagian?divisi=${divisi}`,
    !!divisi // 🔥 hanya jalan kalau ada divisi
  );
}

/* SUB BAGIAN */
export function useComboSubBagian(bagian?: string) {
  return useComboGeneric(
    `${BASE_URL}Combo/ComboSubBagian?bagian=${bagian}`,
    !!bagian // 🔥 hanya jalan kalau ada bagian
  );
}

/* JABATAN */
export function useComboJabatan() {
  return useComboGeneric(`${BASE_URL}Combo/ComboJabatan`);
}

/* KATEGORI */
export function useComboKategoriGaji() {
  return useComboGeneric(`${BASE_URL}Combo/ComboKategoriGaji`);
}

/* JENIS GAJI */
export function useComboJenisGaji() {
  return useComboGeneric(`${BASE_URL}Combo/ComboJenisGaji`);
}

/* PERIODE BULAN */
export function useComboPeriodeBulan() {
  return useComboGeneric(`${BASE_URL}Combo/ComboPeriodeBulan`);
}

/* STATUS PAJAK */
export function useComboStatusPajak() {
  return useComboGeneric(`${BASE_URL}Combo/ComboStatusPajak`);
}

/* JENIS KONTEAK */
export function useComboJenisKontrak() {
  return useComboGeneric(`${BASE_URL}Combo/ComboJenisKontrak`);
}
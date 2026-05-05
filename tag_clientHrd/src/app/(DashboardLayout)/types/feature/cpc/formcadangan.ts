export type formCadangan = {
  id: string;
  bank: string;
  tanggal: string;
  jenisUang: 'Rekondisi' | 'CIT';
  denominasi: string;
  noDvr: string;
  meja: string;
  jamAwal: string;
  jamAkhir: string;
  namaPetugas: string;
  jabatan: string;
};


export type Kotak = {
  noKotak: string
  noSeal: string
  jumlah: string
  jenis: string
}

export type SetKotak = {
  id: string
  kotak: Kotak[]
}


/* export type ProsesPersiapanUangPayload = {
  kodeBank: string
  tanggalProses: string
  jamMulai: string
  jenisProses: number

  nomorDvr: string
  meja: string
  jamSelesai: string

  namaPetugas: string
  jabatanPetugas: string

  daftarSet: SetKotak[]
} */
export interface ProsesPersiapanUangCpcListParams {
  filter?: string
  bank?: string
  status?: string
  page: number
  pageSize: number
}

export interface ViewProsesPersiapanUangCpcDto {
  Id: string;                 // Guid

  KodeBank: string;
  TanggalProses: string;      // DateOnly → yyyy-MM-dd

  NomorDvr: string;
  Meja: string;

  NamaPetugas: string;
  JabatanPetugas: string;

  JenisProses: number;        // enum JenisProsesCpc
  Status: number;             // enum StatusProsesCpc

  JumlahSet: number;
  TanggalDibuat: string;      // DateTime → ISO string
}

export interface ProsesPersiapanUangCpcForm {
  Id?: string

  // ======================
  // INFORMASI BANK & JADWAL
  // ======================
  KodeBank: string
  TanggalProses: string        // DateOnly → yyyy-MM-dd
  JamMulai: string             // TimeOnly → HH:mm
  JenisProses: number          // enum JenisProsesCpc

  // ======================
  // INFORMASI DVR & PETUGAS
  // ======================
  NomorDvr: string
  Meja: string
  JamSelesai: string           // TimeOnly → HH:mm

  NamaPetugas: string
  JabatanPetugas: string
  PathTtdPetugas?: string | null

  KdCabang: string
  // ======================
  // RELASI
  // ======================
  DaftarSet: ProsesSetPersiapanUangCpcForm[]
}

export interface ProsesSetPersiapanUangCpcForm {
  Id?: string

  SetKe: number
  DaftarKotakUang: ProsesKotakUangCpcForm[]
}

export interface ProsesKotakUangCpcForm {
  Id?: string

  UrutanKolom: number

  NomorKotakUang?: string | null
  NomorSeal?: string | null
  JumlahLembar?: number | null
  JenisUang?: number | null
}
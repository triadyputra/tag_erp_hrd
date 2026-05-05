// types/hrd/cuti-karyawan.type.ts

export interface CutiKaryawanItem {
  nocuti: string
  tanggal: string
  nik: string
  namakaryawan: string
  keperluan: string
  validuser: string
  status: number
  jmlHari: number
}

export interface CutiKaryawanParams {
  tanggalAwal?: string | null
  tanggalAkhir?: string | null
  namaKaryawan?: string
  kdCabang?: string
  pageNumber: number
  pageSize: number
}

export interface PagedResult<T> {
  data: T[]
  totalData: number
}

export interface DetailCutiResponse {
  Summary: {
    Saldo: number
    Terpakai: number
    Sisa: number
    JumlahPengajuan: number
  }
  Detail: {
    TglCuti: string
    Nhari: number
    Keterangan: string
    Status: number
  }[]
}
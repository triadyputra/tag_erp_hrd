export type OrderPengisianKasetList = {
    Id: string;
    NOWO: string;
    TANGGAL: string;
    NOTRIP: string;
    WSID: string;
    LOKASI: string;
    MESIN: string;
    NMBANK: string;
    DNM1: number;
    LBR1: number;
    DNM2: number;
    LBR2: number;
    DNM3: number;
    LBR3: number;
    DNM4: number;
    LBR4: number;
    DNM5: number;
    LBR5: number;
    JMLUANG: number;
    KDBANK: string;
    KDCABANG: string;
    STATUS: string;
};

export interface OrderPengisianKasetDetail {
  Kaset: number;
  KodeKaset: string;   // ✅ BARU
  NoSeal: string;
  Denom: number;
  Lembar: number;
}

export interface OrderPengisianKasetForm {
  Id: string; // wajib
  NomorMesin: string;
  Lokasi: string;
  MerekMesin: string;
  Denom: number;
  Jumlah: number;
  KDBANK: string;
  KDCABANG: string;

  TanggalOrder: string   // ✅ TAMBAH INI
  Status: string 
  Details: OrderPengisianKasetDetail[];
}

export interface PrintLaporanRplParams {
  // filter?: string;
  // tglAwal: string;     // YYYY-MM-DD
  // tglAkhir: string;   // YYYY-MM-DD
  // status?: string;
  // cabang?: string;


  nowo?: string | null;
  cabang?: string;
  bank?: string;
  tanggalawal?: string;
  tanggalakhir?: string;
  format?: 'pdf' | 'excel' | 'xlsx';
}
// export interface OrderPengisianKasetLookup {
//   Id: string;
//   NomorMesin: string;
//   Lokasi: string;
//   MerekMesin: string;
//   KDBANK: string;
//   KDCABANG: string;
// }

// export interface OrderPengisianKasetForPengembalian {
//   Id: string;
//   NomorMesin: string;
//   Lokasi: string;
//   MerekMesin: string;
//   KDBANK: string;
//   KDCABANG: string;
//   Jumlah: number;
//   Details: OrderPengisianKasetForPengembalianDetail[];
// }
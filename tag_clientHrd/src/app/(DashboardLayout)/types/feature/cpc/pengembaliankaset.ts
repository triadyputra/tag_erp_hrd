export interface PengembalianKasetLis {
  Id: string;
  NomorMesin: string;
  Lokasi: string;
  KDBANK: string;
  KDCABANG: string;
  Jumlah: number;        // decimal → number
  TanggalTerima: string; // DateTime → ISO string
}

export interface PengembalianKasetRequest {
  Id?: string | null; // null = create, ada = update
  OrderPengisianId: string;
  NomorMesin: string;
  Lokasi: string;
  MerekMesin: string;
  KDBANK: string;
  KDCABANG: string;
  TanggalTerima: string; // ISO string (YYYY-MM-DD / ISO)
  DiterimaOleh?: string | null;
  Catatan?: string | null;
  Details: PengembalianKasetDetailRequest[];
}

export interface PengembalianKasetDetailRequest {
  Kaset: number;
  KodeKaset: string;
  NoSeal?: string | null;
  Denom: number;
  Lembar: number;
}

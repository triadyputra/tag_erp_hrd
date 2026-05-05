/* =====================================================
   DTO RESPONSE
===================================================== */

export interface StokVaultDto {
  kdCabang: string
  KdBank: string
  nominal: number
  saldo: number
  lastUpdate: string
}

/* =====================================================
   REQUEST PAYLOADS
===================================================== */

export interface MutasiVaultPayload {
  kdCabang: string
  KdBank: string
  nominal: number
  qtyLembar: number
  tipeMutasi: string
  referenceNo?: string
}

export interface TransferVaultPayload {
  kdCabangAsal: string
  kdCabangTujuan: string
  KdBank: string
  nominal: number
  qtyLembar: number
  referenceNo?: string
}

export interface OpnameVaultPayload {
  kdCabang: string
  KdBank: string
  nominal: number
  saldoFisik: number
}

// /* =====================================================
//    FETCH PARAMS
// ===================================================== */

// export interface FetchStokVaultParams {
//   kdCabang?: string
//   nominal?: number
//   page: number
//   pageSize: number
// }
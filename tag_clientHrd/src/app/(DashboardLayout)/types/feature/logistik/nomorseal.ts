/* =====================================================
 * TYPES / DTO
 * ===================================================== */
export interface RegisterSealView {
  NomorSeal: string
  Status: string
  Active: boolean
}

export interface RegisterSealListParams {
  filter?: string
  active?: boolean
  page: number
  pageSize: number
}

export interface RegisterSealRangeForm {
  NomorAwal: number
  NomorAkhir: number
  Active: boolean
}

export interface RegisterSealUpdateForm {
  Active: boolean
}
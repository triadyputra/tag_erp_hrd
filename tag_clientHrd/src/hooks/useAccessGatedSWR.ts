import useSWR, { type SWRConfiguration, type SWRResponse } from 'swr'
import { hasAccess, hasAnyAccess } from '@/helpers/auth.helper'

type AccessGate =
  | { subject: string; action: string }
  | { subject: string; any: true }

function isAllowed(gate: AccessGate): boolean {
  if ('any' in gate) return hasAnyAccess(gate.subject)
  return hasAccess(gate.subject, gate.action)
}

/**
 * SWR yang tidak fetch jika user tidak punya hak akses (hindari 403 dari ApiKeyAuthorize).
 */
export function useAccessGatedSWR<Data = unknown, Error = unknown>(
  gate: AccessGate,
  key: unknown[] | string | null | undefined,
  fetcher: () => Promise<Data>,
  config?: SWRConfiguration<Data, Error>
): SWRResponse<Data, Error> {
  const allowed = isAllowed(gate)
  const swrKey = allowed && key != null ? key : null
  return useSWR<Data, Error>(swrKey, fetcher, config)
}

export type AppUpdateManualCheckResult =
  | { status: "up_to_date" }
  | { status: "update_shown" }
  | { status: "error"; message: string }
  | { status: "unsupported" };

type ManualCheckFn = () => Promise<AppUpdateManualCheckResult>;

let manualCheckFn: ManualCheckFn | null = null;

export function registerAppUpdateManualCheck(fn: ManualCheckFn | null): void {
  manualCheckFn = fn;
}

export async function requestAppUpdateManualCheck(): Promise<AppUpdateManualCheckResult> {
  if (!manualCheckFn) {
    return {
      status: "error",
      message: "Pemeriksaan pembaruan belum siap. Buka ulang aplikasi lalu coba lagi.",
    };
  }
  return manualCheckFn();
}

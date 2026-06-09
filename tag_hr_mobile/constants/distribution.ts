import Constants from "expo-constants";

type DistributionExtra = {
  androidUpdateViaStore?: boolean;
  playStoreUrl?: string;
};

function getDistributionExtra(): DistributionExtra {
  return (Constants.expoConfig?.extra ?? {}) as DistributionExtra;
}

/** Build Play Store — pembaruan via Play Store, bukan sideload APK. */
export function isAndroidStoreUpdatePreferred(): boolean {
  return getDistributionExtra().androidUpdateViaStore === true;
}

/** URL listing Play Store (diisi setelah app dipublish). */
export function getConfiguredPlayStoreUrl(): string | null {
  const url = getDistributionExtra().playStoreUrl?.trim();
  return url || null;
}

export function resolveAndroidStoreUrl(apiStoreUrl: string | null | undefined): string | null {
  const fromApi = apiStoreUrl?.trim();
  if (fromApi) return fromApi;
  return getConfiguredPlayStoreUrl();
}

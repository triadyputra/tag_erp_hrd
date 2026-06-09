import { getNativeBuildNumber, getNativeVersionName } from "@/services/app-update.service";
import Constants from "expo-constants";

function normalizeVersionLabel(v: string): string {
  return v.trim().replace(/^v/i, "").toLowerCase();
}

type AppExtra = {
  /** Teks setelah versi, mis. `(Trial)` atau `Beta`. Kosongkan string untuk tanpa sufiks. */
  versionSuffix?: string;
  /** Jika diisi, dipakai apa adanya (mengabaikan `version` + `versionSuffix`). */
  appVersionLabel?: string;
};

/**
 * Label versi untuk UI (login, tentang app, dll.).
 * - Utama: `version` dari app.json (bundel JS saat ini).
 * - Bila APK terpasang lebih lama, tambah catatan "terpasang …" (nama/build native).
 * - Cek update tetap memakai versi native di app-update.service.
 */
export function getAppVersionLabel(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

  if (typeof extra.appVersionLabel === "string" && extra.appVersionLabel.trim()) {
    return extra.appVersionLabel.trim();
  }

  const configVersion = Constants.expoConfig?.version ?? "0.0.0";
  const nativeName = getNativeVersionName();
  const raw = configVersion;
  const core =
    raw.startsWith("V") || raw.startsWith("v") ? raw : `V${raw}`;

  let suf: string;
  if (extra.versionSuffix === "") {
    suf = "";
  } else if (typeof extra.versionSuffix === "string") {
    suf = extra.versionSuffix.trim();
  } else {
    suf = "";
  }

  const configBuild =
    typeof Constants.expoConfig?.android?.versionCode === "number"
      ? Constants.expoConfig.android.versionCode
      : 0;
  const nativeBuild = getNativeBuildNumber();
  const buildForLabel = configBuild > 0 ? configBuild : nativeBuild;
  const buildSuffix = buildForLabel > 0 ? ` · build ${buildForLabel}` : "";

  const installedNote =
    nativeName &&
    normalizeVersionLabel(nativeName) !== normalizeVersionLabel(configVersion)
      ? ` · terpasang ${nativeName}${nativeBuild > 0 && nativeBuild !== buildForLabel ? ` (build ${nativeBuild})` : ""}`
      : nativeBuild > 0 && configBuild > 0 && nativeBuild !== configBuild
        ? ` · terpasang build ${nativeBuild}`
        : "";

  const body = `${core}${buildSuffix}${installedNote}`;

  if (suf) {
    return `${body} ${suf}`;
  }

  return body;
}

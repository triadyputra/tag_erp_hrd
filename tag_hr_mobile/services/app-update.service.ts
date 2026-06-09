import { DATA_API_BASE_URL, DATA_API_ENDPOINT } from "@/constants/api";
import {
  isAndroidStoreUpdatePreferred,
  resolveAndroidStoreUrl,
} from "@/constants/distribution";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";
import { InteractionManager, Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";

/** Ukuran APK pembaruan di server (HR-TAG ~115 MB). */
export const APK_TYPICAL_SIZE_BYTES = 115 * 1024 * 1024;
/** Batas minimal file terunduh (gagal jika lebih kecil — biasanya unduhan putus/HTML error). */
export const APK_MIN_VALID_BYTES = 90 * 1024 * 1024;
/** Ruang kosong minimal di perangkat sebelum mulai unduh. */
export const APK_STORAGE_HEADROOM_BYTES = APK_TYPICAL_SIZE_BYTES + 40 * 1024 * 1024;
/** Timeout unduh: ~115 MB butuh waktu lama di jaringan lambat (50 menit). */
export const APK_DOWNLOAD_TIMEOUT_MS = 50 * 60 * 1000;

export type AppUpdateInfo = {
  latestVersionCode: number;
  latestVersionName: string;
  minVersionCode: number;
  downloadUrl: string;
  sha256: string | null;
  releaseNotes: string | null;
  storeUrl: string | null;
  updateAvailable: boolean;
  forceUpdate: boolean;
  platform: string;
};

const APK_FILE_NAME = "hr-mobile-update.apk";

/** Jeda setelah native selesai menulis file besar — kurangi crash saat bridge masih sibuk. */
const POST_DOWNLOAD_SETTLE_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toFileUri(absolutePath: string): string {
  const norm = normalizeLocalPath(absolutePath);
  return norm.startsWith("file://") ? norm : `file://${norm}`;
}

/** Path absolut tanpa `file://` — format yang dibutuhkan react-native-blob-util. */
export function normalizeLocalPath(uri: string): string {
  return uri.trim().replace(/^file:\/\//, "").replace(/^file:/, "");
}

function getApkDownloadCandidatePaths(): string[] {
  const dirs = ReactNativeBlobUtil.fs.dirs;
  return [
    `${dirs.DocumentDir}/${APK_FILE_NAME}`,
    `${dirs.DownloadDir}/${APK_FILE_NAME}`,
    `${dirs.CacheDir}/${APK_FILE_NAME}`,
  ];
}

/**
 * Path unduhan APK — gunakan DocumentDir agar stabil untuk file besar (115MB+).
 * CacheDir berisiko di-clean Android saat memory rendah.
 */
export function getAndroidApkDownloadPath(): string {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${APK_FILE_NAME}`;
}

export function getApkUpdateSizeLabel(): string {
  return formatBytes(APK_TYPICAL_SIZE_BYTES).replace(/ /g, " ");
}

/** Cek ruang penyimpanan cukup untuk unduh + pasang (~115 MB + cadangan). */
export async function assertStorageForApkDownload(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const free = await FileSystem.getFreeDiskStorageAsync();
    if (free > 0 && free < APK_STORAGE_HEADROOM_BYTES) {
      throw new Error(
        `Penyimpanan hampir penuh (tersisa ${formatBytes(free)}). Kosongkan ruang minimal ${getApkUpdateSizeLabel()} lalu coba lagi.`,
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Penyimpanan")) throw e;
    /* abaikan jika API tidak tersedia */
  }
}

/** Hapus sisa unduhan rusak agar retry tidak memicu "Unexpected FileStorage response file: null". */
export async function purgeApkDownloadArtifacts(): Promise<void> {
  if (Platform.OS !== "android") return;
  const seen = new Set<string>();
  for (const dest of getApkDownloadCandidatePaths()) {
    const path = normalizeLocalPath(dest);
    if (seen.has(path)) continue;
    seen.add(path);
    try {
      if (await ReactNativeBlobUtil.fs.exists(path)) {
        await ReactNativeBlobUtil.fs.unlink(path);
      }
    } catch {
      /* abaikan */
    }
  }
}

/** APK yang sudah terunduh dan masih valid (tanpa unduh ulang). */
export async function findExistingDownloadedApkPath(): Promise<string | null> {
  if (Platform.OS !== "android") return null;

  const seen = new Set<string>();

  for (const dest of getApkDownloadCandidatePaths()) {
    const path = normalizeLocalPath(dest);
    if (seen.has(path)) continue;
    seen.add(path);
    if (!(await ReactNativeBlobUtil.fs.exists(path))) continue;
    try {
      await assertApkDownloadComplete(path);
      return path;
    } catch {
      /* file rusak / bukan APK */
    }
  }
  return null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function getMetadata(root: Record<string, unknown>) {
  return asRecord(root.Metadata) ?? asRecord(root.metadata);
}

function metadataSuccess(meta: Record<string, unknown> | null): boolean {
  if (!meta) return false;
  const s = meta.Success ?? meta.success;
  if (s === true || s === "true" || s === 1) return true;
  const code = meta.Code ?? meta.code;
  return code === 200 || code === "200";
}

function metadataMessage(meta: Record<string, unknown> | null): string {
  if (!meta) return "";
  const m = meta.Message ?? meta.message;
  return typeof m === "string" ? m : "";
}

function num(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function normalizeVersionLabel(v: string): string {
  return v.trim().replace(/^v/i, "").toLowerCase();
}

/** Konvensi proyek: versionName 1.05 → versionCode 105. */
export function versionNameToVersionCode(versionName: string): number | null {
  const n = normalizeVersionLabel(versionName);
  const m = n.match(/^(\d+)\.(\d+)$/);
  if (!m) return null;
  const major = parseInt(m[1], 10);
  const minor = parseInt(m[2], 10);
  if (!Number.isFinite(major) || !Number.isFinite(minor) || minor < 0 || minor > 99) {
    return null;
  }
  return major * 100 + minor;
}

function bool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function mapAppUpdatePayload(block: unknown): AppUpdateInfo | null {
  const o = asRecord(block);
  if (!o) return null;

  return {
    latestVersionCode: num(o.LatestVersionCode ?? o.latestVersionCode, 0),
    latestVersionName: str(o.LatestVersionName ?? o.latestVersionName),
    minVersionCode: num(o.MinVersionCode ?? o.minVersionCode, 0),
    downloadUrl: str(o.DownloadUrl ?? o.downloadUrl),
    sha256: (() => {
      const s = str(o.Sha256 ?? o.sha256);
      return s ? s : null;
    })(),
    releaseNotes: (() => {
      const s = str(o.ReleaseNotes ?? o.releaseNotes);
      return s ? s : null;
    })(),
    storeUrl: (() => {
      const s = str(o.StoreUrl ?? o.storeUrl);
      return s ? s : null;
    })(),
    updateAvailable: bool(o.UpdateAvailable ?? o.updateAvailable),
    forceUpdate: bool(o.ForceUpdate ?? o.forceUpdate),
    platform: str(o.Platform ?? o.platform) || "android",
  };
}

/**
 * Hanya terima string seluruhnya angka (versionCode Android).
 * Hindari parseInt("1.02") → 1 yang membuat server mengira build sangat lama.
 */
function parseStrictPositiveInt(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!/^\d+$/.test(s)) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * versionCode terpasang di perangkat (APK/native), bukan app.json dari bundel Metro.
 */
export function getNativeBuildNumber(): number {
  if (Platform.OS === "android") {
    const fromNative = parseStrictPositiveInt(Application.nativeBuildVersion);
    const versionName = Application.nativeApplicationVersion?.trim() ?? "";

    if (fromNative != null && fromNative >= 100) {
      return fromNative;
    }

    if (versionName) {
      const fromName = versionNameToVersionCode(versionName);
      if (fromName != null) return fromName;
    }

    if (fromNative != null) return fromNative;

    if (__DEV__) {
      const fromConfig = Constants.expoConfig?.android?.versionCode;
      if (typeof fromConfig === "number" && Number.isFinite(fromConfig) && fromConfig > 0) {
        return Math.trunc(fromConfig);
      }
    }

    return 0;
  }

  if (Platform.OS === "ios") {
    const fromNative = parseStrictPositiveInt(Application.nativeBuildVersion);
    if (fromNative != null) return fromNative;
    const iosBuild = Constants.expoConfig?.ios?.buildNumber;
    const fromCfg = parseStrictPositiveInt(
      iosBuild == null || iosBuild === "" ? null : String(iosBuild),
    );
    if (fromCfg != null) return fromCfg;
  }

  return 0;
}

/** Nama versi terpasang di perangkat (mis. 1.05), bukan dari app.json bundel. */
export function getNativeVersionName(): string {
  return Application.nativeApplicationVersion?.trim() ?? "";
}

/**
 * Apakah app sudah setara versi server (bandingkan versionCode dan versionName).
 */
export function isAppUpdateUpToDate(
  latestVersionCode: number,
  latestVersionName: string,
): boolean {
  const latestCode = Math.trunc(latestVersionCode);
  if (latestCode <= 0) return true;

  const current = getNativeBuildNumber();
  if (current > 0 && current >= latestCode) return true;

  const installedName = getNativeVersionName();
  const latestName = latestVersionName.trim();
  if (
    installedName &&
    latestName &&
    normalizeVersionLabel(installedName) === normalizeVersionLabel(latestName)
  ) {
    return true;
  }

  return false;
}

export async function fetchAppUpdateCheck(
  platform: "android" | "ios",
): Promise<AppUpdateInfo> {
  const current = getNativeBuildNumber();
  const qs = new URLSearchParams({ platform });
  if (current > 0) {
    qs.set("currentVersionCode", String(current));
  }
  if (platform === "android" && isAndroidStoreUpdatePreferred()) {
    qs.set("distribution", "playstore");
  }
  const url = `${DATA_API_BASE_URL}${DATA_API_ENDPOINT.CHECK_APP_UPDATE}?${qs.toString()}`;

  const res = await fetch(url, { method: "GET" });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Respons pembaruan tidak valid.");
  }

  const root = asRecord(json);
  if (!root) throw new Error("Respons pembaruan kosong.");

  const meta = getMetadata(root);
  if (!metadataSuccess(meta)) {
    throw new Error(metadataMessage(meta) || "Gagal memeriksa pembaruan.");
  }

  const dataRaw = root.Data ?? root.data;
  const info = mapAppUpdatePayload(dataRaw);
  if (!info) throw new Error("Data pembaruan tidak ditemukan.");

  const latestCode = Math.trunc(info.latestVersionCode);
  const upToDate = isAppUpdateUpToDate(latestCode, info.latestVersionName);

  const normalizeForPlatform = (payload: AppUpdateInfo): AppUpdateInfo => {
    if (platform !== "android" || !isAndroidStoreUpdatePreferred()) {
      return payload;
    }
    return {
      ...payload,
      storeUrl: resolveAndroidStoreUrl(payload.storeUrl),
      downloadUrl: "",
    };
  };

  if (current <= 0 && !upToDate) {
    return normalizeForPlatform({
      ...info,
      updateAvailable: latestCode > 0,
      forceUpdate:
        info.minVersionCode > 0 ||
        (Boolean(info.forceUpdate) && latestCode > 0),
    });
  }

  const updateAvailable = !upToDate && latestCode > 0 && current > 0;
  const belowMin =
    current > 0 && info.minVersionCode > 0 && current < info.minVersionCode;
  const forceUpdate = belowMin || (Boolean(info.forceUpdate) && updateAvailable);

  return normalizeForPlatform({
    ...info,
    latestVersionCode: latestCode,
    updateAvailable,
    forceUpdate,
  });
}

export type DownloadProgress = {
  percent: number | null;
  receivedBytes: number;
  totalBytes: number | null;
};

function parseProgressChunk(
  received: string | number,
  total: string | number,
): { received: number; total: number } {
  const r = typeof received === "number" ? received : parseInt(String(received), 10);
  const t = typeof total === "number" ? total : parseInt(String(total), 10);
  return {
    received: Number.isFinite(r) ? r : 0,
    total: Number.isFinite(t) ? t : -1,
  };
}

export type ApkDownloadHandle = {
  done: Promise<string>;
  cancel: () => void;
};

/**
 * Mulai unduh APK. Gunakan `cancel()` untuk membatalkan (mis. tombol Batal).
 */
export function startAndroidApkDownload(
  downloadUrl: string,
  onProgress: (p: DownloadProgress) => void,
  options?: { wifiOnly?: boolean; timeoutMs?: number },
): ApkDownloadHandle {
  if (!downloadUrl) {
    return {
      done: Promise.reject(new Error("URL unduhan kosong.")),
      cancel: () => {},
    };
  }

  const dest = getAndroidApkDownloadPath();
  let fetchTask: ReturnType<
    ReturnType<typeof ReactNativeBlobUtil.config>["fetch"]
  > | null = null;

  const attachProgress = (
    task: ReturnType<ReturnType<typeof ReactNativeBlobUtil.config>["fetch"]>,
  ) => {
    let lastEmitAt = 0;
    task.progress((received, total) => {
      const { received: rx, total: tx } = parseProgressChunk(received, total);
      const now = Date.now();
      const pct = tx > 0 ? Math.min(99, Math.round((rx / tx) * 100)) : null;
      if (now - lastEmitAt < 450 && pct != null && pct > 0 && pct < 99) {
        return;
      }
      lastEmitAt = now;
      if (tx > 0) {
        onProgress({
          percent: pct,
          receivedBytes: rx,
          totalBytes: tx,
        });
      } else {
        onProgress({
          percent: null,
          receivedBytes: rx,
          totalBytes: null,
        });
      }
    });
    return task;
  };

  /**
   * Selesai unduh — tanpa result.info()/result.path() (sering crash pada APK ~115 MB).
   * Hanya cek file di path target setelah jeda singkat.
   */
  const finalizeDownload = async (targetPath: string) => {
    await delay(POST_DOWNLOAD_SETTLE_MS);
    const written = normalizeLocalPath(targetPath);
    await assertApkDownloadComplete(written);
    await delay(200);
    onProgress({
      percent: 100,
      receivedBytes: 0,
      totalBytes: 0,
    });
    return written;
  };

  const releaseFetchTask = () => {
    fetchTask = null;
  };

  const timeoutMs = options?.timeoutMs ?? APK_DOWNLOAD_TIMEOUT_MS;

  const runDirectDownloadWithTimeout = () => {
    fetchTask = ReactNativeBlobUtil.config({
      path: dest,
      timeout: timeoutMs,
      wifiOnly: options?.wifiOnly === true,
    }).fetch("GET", downloadUrl);
    attachProgress(fetchTask);
    return fetchTask
      .then(() => finalizeDownload(dest))
      .finally(releaseFetchTask);
  };

  /** Fallback tanpa fileCache — hindari salin ulang 115 MB (cp) yang bisa membuat app keluar. */
  const runAlternateDirectDownloadWithTimeout = () => {
    const altDest = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${APK_FILE_NAME}`;
    fetchTask = ReactNativeBlobUtil.config({
      path: altDest,
      timeout: timeoutMs,
      wifiOnly: options?.wifiOnly === true,
    }).fetch("GET", downloadUrl);
    attachProgress(fetchTask);
    return fetchTask
      .then(() => finalizeDownload(altDest))
      .finally(releaseFetchTask);
  };

  const done = purgeApkDownloadArtifacts()
    .then(() => assertStorageForApkDownload())
    .then(() => runDirectDownloadWithTimeout())
    .catch(async (directErr: unknown) => {
      const directMsg =
        directErr instanceof Error ? directErr.message : String(directErr);
      if (
        directMsg.includes("Unexpected FileStorage") ||
        directMsg.includes("FileStorage")
      ) {
        await purgeApkDownloadArtifacts();
        return runAlternateDirectDownloadWithTimeout();
      }
      throw directErr;
    })
    .catch(async (e: unknown) => {
      await purgeApkDownloadArtifacts();
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.includes("Unexpected FileStorage response file")) {
        throw new Error(
          "Unduhan gagal di perangkat. Ketuk Unduh lagi dengan koneksi Wi‑Fi stabil.",
        );
      }
      if (/timed?\s*out|timeout/i.test(raw)) {
        throw new Error(
          `Unduhan ${getApkUpdateSizeLabel()} terlalu lama (batas waktu). Gunakan Wi‑Fi lalu unduh lagi.`,
        );
      }
      throw e instanceof Error ? e : new Error(raw);
    })
    .finally(releaseFetchTask);

  return {
    done,
    cancel: () => {
      try {
        fetchTask?.cancel(() => {});
      } catch {
        /* abaikan */
      }
    },
  };
}

const FLAG_GRANT_READ_URI_PERMISSION = 1;
const FLAG_ACTIVITY_NEW_TASK = 268435456;
const APK_MIME = "application/vnd.android.package-archive";

/**
 * URI content:// untuk FileProvider react-native-blob-util.
 * Name harus match dengan provider_paths.xml di react-native-blob-util.
 */
function buildApkContentUri(absolutePath: string): string {
  const pkg = Application.applicationId ?? "id.co.tag.hrmobile";
  const norm = normalizeLocalPath(absolutePath);
  const cacheRoot = normalizeLocalPath(ReactNativeBlobUtil.fs.dirs.CacheDir);
  const downloadRoot = normalizeLocalPath(ReactNativeBlobUtil.fs.dirs.DownloadDir);
  const documentRoot = normalizeLocalPath(ReactNativeBlobUtil.fs.dirs.DocumentDir);

  let basePath: string;
  let relative: string;

  if (norm.startsWith(documentRoot)) {
    basePath = "files-path";
    relative = norm.slice(documentRoot.length).replace(/^\//, "");
  } else if (norm.startsWith(downloadRoot)) {
    basePath = "external_files";
    relative = norm.slice(downloadRoot.length).replace(/^\//, "");
  } else if (norm.startsWith(cacheRoot)) {
    basePath = "cache-path";
    relative = norm.slice(cacheRoot.length).replace(/^\//, "");
  } else {
    relative = norm.split("/").pop() ?? APK_FILE_NAME;
    basePath = "files-path";
  }

  if (!relative) relative = APK_FILE_NAME;
  return `content://${pkg}.provider/${basePath}/${relative}`;
}

/** Ukuran file APK tanpa readFile — aman untuk file ~115 MB. */
async function getApkFileSizeBytes(localPath: string): Promise<number> {
  const path = normalizeLocalPath(localPath);
  try {
    const info = await FileSystem.getInfoAsync(toFileUri(path));
    if (info.exists && typeof info.size === "number" && info.size > 0) {
      return info.size;
    }
  } catch {
    /* fallback blob stat */
  }
  try {
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    return stat?.size ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Validasi setelah unduh — HANYA cek ukuran file.
 * Jangan readFile/base64: pada APK ~115 MB itu bisa memuat seluruh file ke RAM dan app langsung keluar.
 */
export async function assertApkDownloadComplete(localPath: string): Promise<void> {
  const path = normalizeLocalPath(localPath);
  if (!(await ReactNativeBlobUtil.fs.exists(path))) {
    throw new Error("File APK tidak ditemukan setelah unduhan.");
  }
  const size = await getApkFileSizeBytes(path);
  if (size < APK_MIN_VALID_BYTES) {
    throw new Error(
      `File unduhan tidak lengkap (${formatBytes(size)}, minimal ~${getApkUpdateSizeLabel()}). Unduh ulang dengan Wi‑Fi stabil.`,
    );
  }
}

/** Jeda aman sebelum update UI React setelah unduh besar selesai. */
export async function waitAfterApkDownloadSettle(): Promise<void> {
  await delay(POST_DOWNLOAD_SETTLE_MS);
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
  await delay(200);
}

/** Validasi path APK untuk pemasang — tanpa salin ulang 115 MB. */
async function ensureApkReadyForInstall(localPath: string): Promise<string> {
  const norm = normalizeLocalPath(localPath);
  await assertApkDownloadComplete(norm);
  return norm;
}

function waitForUiReady(): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, 500);
    });
  });
}

export function buildUpdateStuckMessage(latestVersionName: string): string {
  const label = latestVersionName.trim() || "pembaruan";
  return (
    `Pembaruan ke ${label} belum terpasang di perangkat.\n\n` +
    "Ketuk Pasang sekarang. Pada layar Android pilih Pasang / Update dan tunggu sampai selesai. " +
    "Jika layar pasang tidak muncul, buka Pengaturan → izinkan pasang aplikasi untuk HR-TAG, lalu coba lagi."
  );
}

/** URI content:// via Expo FileProvider (lebih andal daripada blob-util di beberapa perangkat). */
async function buildExpoApkContentUri(absolutePath: string): Promise<string | null> {
  try {
    const norm = normalizeLocalPath(absolutePath);
    const fileUri = norm.startsWith("file://") ? norm : `file://${norm}`;
    return await FileSystem.getContentUriAsync(fileUri);
  } catch {
    return null;
  }
}

/** Buka layar pasang APK sistem. Jangan pakai blob actionViewIntent — bisa menutup/crash app. */
export async function installDownloadedApk(localPath: string): Promise<void> {
  if (Platform.OS !== "android") return;

  await waitForUiReady();

  const path = await ensureApkReadyForInstall(localPath);
  const blobContentUri = buildApkContentUri(path);
  const expoContentUri = await buildExpoApkContentUri(path);
  const intentFlags = FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK;

  const attempts: Array<() => Promise<void>> = [
    async () => {
      if (!expoContentUri) throw new Error("URI Expo tidak tersedia.");
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: expoContentUri,
        type: APK_MIME,
        flags: intentFlags,
      });
    },
    async () => {
      if (!expoContentUri) throw new Error("URI Expo tidak tersedia.");
      const canOpen = await Linking.canOpenURL(expoContentUri);
      if (!canOpen) throw new Error("Tidak dapat membuka URI pemasang.");
      await Linking.openURL(expoContentUri);
    },
    async () => {
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: blobContentUri,
        type: APK_MIME,
        flags: intentFlags,
      });
    },
    async () => {
      const canOpen = await Linking.canOpenURL(blobContentUri);
      if (!canOpen) throw new Error("Tidak dapat membuka URI pemasang.");
      await Linking.openURL(blobContentUri);
    },
  ];

  let lastErr = "";
  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }

  const needsPermission =
    /unknown|install|permission|security|denied|not allowed|provider/i.test(lastErr);

  throw new Error(
    needsPermission
      ? "Izin pasang aplikasi belum aktif. Buka Pengaturan → aktifkan pasang dari sumber tidak dikenal untuk HR-TAG, lalu ketuk Pasang sekarang lagi."
      : lastErr
        ? `Gagal membuka pemasang (${lastErr}). Ketuk Pasang sekarang lagi.`
        : "Gagal membuka pemasang. Ketuk Pasang sekarang lagi.",
  );
}

/** @deprecated Gunakan installDownloadedApk */
export async function openAndroidApkInstaller(localPath: string): Promise<void> {
  return installDownloadedApk(localPath);
}

/** Buka pengaturan izin pasang APK dari sumber tidak dikenal (Android 8+). */
export async function openUnknownSourcesSettings(): Promise<void> {
  if (Platform.OS !== "android") return;
  const pkg = Application.applicationId;
  if (!pkg) return;
  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.MANAGE_UNKNOWN_APP_SOURCES",
      {
        data: `package:${pkg}`,
      },
    );
  } catch {
    await IntentLauncher.startActivityAsync("android.settings.APPLICATION_DETAILS_SETTINGS", {
      data: `package:${pkg}`,
    });
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${u[i]}`;
}

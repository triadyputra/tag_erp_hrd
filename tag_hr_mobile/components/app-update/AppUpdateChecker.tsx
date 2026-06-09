import { Colors } from "@/constants/theme";
import { isAndroidStoreUpdatePreferred } from "@/constants/distribution";
import {
  APK_DOWNLOAD_TIMEOUT_MS,
  assertStorageForApkDownload,
  buildUpdateStuckMessage,
  fetchAppUpdateCheck,
  findExistingDownloadedApkPath,
  formatBytes,
  getApkUpdateSizeLabel,
  getNativeBuildNumber,
  installDownloadedApk,
  isAppUpdateUpToDate,
  openUnknownSourcesSettings,
  startAndroidApkDownload,
  waitAfterApkDownloadSettle,
  type AppUpdateInfo,
  type DownloadProgress,
} from "@/services/app-update.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { DownloadCloud } from "lucide-react-native";
import {
  registerAppUpdateManualCheck,
  type AppUpdateManualCheckResult,
} from "@/components/app-update/app-update-bridge";
import { activateKeepAwakeAsync, deactivateKeepAwakeAsync } from "expo-keep-awake";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SKIP_STORAGE_KEY = "@hr_tag_skipped_update_build";
const KEEP_AWAKE_TAG = "hr-tag-apk-download";

type Phase =
  | "idle"
  | "prompt"
  | "downloading"
  | "ready_install"
  | "installing"
  | "error";

export function AppUpdateChecker() {
  const insets = useSafeAreaInsets();
  const ranRef = useRef(false);
  const downloadRef = useRef<{ cancel: () => void } | null>(null);
  const pendingInstallBuildRef = useRef<number | null>(null);
  const autoDownloadStartedRef = useRef(false);
  const lastApkPathRef = useRef<string | null>(null);
  const openedSettingsForInstallRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [info, setInfo] = useState<AppUpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress>({
    percent: 0,
    receivedBytes: 0,
    totalBytes: null,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isCellular, setIsCellular] = useState(false);
  const [localApkReady, setLocalApkReady] = useState(false);

  const visible = phase !== "idle";

  const refreshLocalApkReady = useCallback(async () => {
    if (Platform.OS !== "android") {
      setLocalApkReady(false);
      return false;
    }
    const path =
      lastApkPathRef.current ?? (await findExistingDownloadedApkPath());
    const ready = Boolean(path);
    setLocalApkReady(ready);
    if (path) lastApkPathRef.current = path;
    return ready;
  }, []);

  const closeToIdle = useCallback(() => {
    downloadRef.current?.cancel();
    downloadRef.current = null;
    pendingInstallBuildRef.current = null;
    openedSettingsForInstallRef.current = false;
    setPhase("idle");
    setInfo(null);
    setErrorMessage("");
    setLocalApkReady(false);
    setProgress({
      percent: 0,
      receivedBytes: 0,
      totalBytes: null,
    });
  }, []);

  /** APK sudah diunduh — tampilkan Pasang sekarang, bukan dialog "belum terpasang" berulang. */
  const showReadyToInstall = useCallback((data: AppUpdateInfo, apkPath: string) => {
    lastApkPathRef.current = apkPath;
    setInfo(data);
    setLocalApkReady(true);
    setErrorMessage("");
    setPhase("ready_install");
  }, []);

  const runCheck = useCallback(
    async (options?: { force?: boolean; manual?: boolean }): Promise<AppUpdateManualCheckResult | void> => {
      const force = options?.force === true;
      const manual = options?.manual === true;

      if (Platform.OS === "web") {
        return manual ? { status: "unsupported" } : undefined;
      }
      if (!force && !manual && ranRef.current) return;
      if (!force && !manual) ranRef.current = true;

      await new Promise((r) => setTimeout(r, force || manual ? 200 : 1600));

      try {
        const net = await NetInfo.fetch();
        setIsCellular(net.type === "cellular");

        const platform = Platform.OS === "ios" ? "ios" : "android";
        const data = await fetchAppUpdateCheck(platform);
        const installedBuild = getNativeBuildNumber();

        if (isAppUpdateUpToDate(data.latestVersionCode, data.latestVersionName)) {
          pendingInstallBuildRef.current = null;
          if (force && phase !== "idle") closeToIdle();
          return manual ? { status: "up_to_date" } : undefined;
        }

        if (!data.updateAvailable) {
          pendingInstallBuildRef.current = null;
          if (force && phase !== "idle") closeToIdle();
          return manual ? { status: "up_to_date" } : undefined;
        }

        if (
          pendingInstallBuildRef.current != null &&
          pendingInstallBuildRef.current === data.latestVersionCode &&
          installedBuild > 0 &&
          installedBuild < data.latestVersionCode
        ) {
          const existingApk = await findExistingDownloadedApkPath();
          if (existingApk) {
            showReadyToInstall(data, existingApk);
            return manual ? { status: "update_shown" } : undefined;
          }
          if (manual) {
            setInfo(data);
            setPhase("error");
            setErrorMessage(buildUpdateStuckMessage(data.latestVersionName));
            return { status: "update_shown" };
          }
          pendingInstallBuildRef.current = null;
        }

        if (platform === "android" && isAndroidStoreUpdatePreferred()) {
          if (!data.storeUrl?.trim()) {
            return manual
              ? { status: "error", message: "Tautan Play Store belum tersedia." }
              : undefined;
          }
        } else if (platform === "android" && !data.downloadUrl?.trim()) {
          return manual
            ? { status: "error", message: "File pembaruan belum tersedia di server." }
            : undefined;
        }
        if (
          platform === "ios" &&
          !data.storeUrl?.trim() &&
          !data.downloadUrl?.trim()
        ) {
          return manual
            ? { status: "error", message: "Tautan pembaruan belum tersedia." }
            : undefined;
        }

        if (!data.forceUpdate && !manual) {
          const skipped = await AsyncStorage.getItem(SKIP_STORAGE_KEY);
          if (skipped === String(data.latestVersionCode)) return;
        }

        if (
          platform === "android" &&
          !isAndroidStoreUpdatePreferred() &&
          data.downloadUrl?.trim()
        ) {
          const existingApk = await findExistingDownloadedApkPath();
          if (existingApk) {
            showReadyToInstall(data, existingApk);
            return manual ? { status: "update_shown" } : undefined;
          }
        }

        setInfo(data);
        setPhase("prompt");
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          /* abaikan */
        }
        return manual ? { status: "update_shown" } : undefined;
      } catch (e: unknown) {
        if (manual) {
          const msg =
            e instanceof Error
              ? e.message
              : "Gagal memeriksa pembaruan. Periksa koneksi internet.";
          return { status: "error", message: msg };
        }
      }
    },
    [closeToIdle, phase, showReadyToInstall],
  );

  const runManualCheck = useCallback(async (): Promise<AppUpdateManualCheckResult> => {
    const result = await runCheck({ force: true, manual: true });
    return result ?? { status: "up_to_date" };
  }, [runCheck]);

  useEffect(() => {
    registerAppUpdateManualCheck(runManualCheck);
    return () => registerAppUpdateManualCheck(null);
  }, [runManualCheck]);

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  const openInstaller = useCallback(
    async (path: string) => {
      lastApkPathRef.current = path;
      setErrorMessage("");
      setLocalApkReady(true);

      // Tutup modal dulu agar Activity tidak bentrok saat membuka layar pasang sistem.
      setPhase("idle");
      await new Promise((r) => setTimeout(r, 450));

      try {
        await installDownloadedApk(path);
        if (info) {
          pendingInstallBuildRef.current = info.latestVersionCode;
        }
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          /* abaikan */
        }
      } catch (installErr: unknown) {
        const installMsg =
          installErr instanceof Error
            ? installErr.message
            : "Gagal membuka pemasang.";
        setErrorMessage(
          `${installMsg}\n\nFile pembaruan sudah ada di perangkat. Ketuk Pasang sekarang — tidak perlu unduh ulang. Jika layar pasang tidak muncul, buka Pengaturan izin pasang aplikasi.`,
        );
        setPhase("error");
      }
    },
    [info],
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;

      if (
        (phase === "error" || phase === "ready_install") &&
        info &&
        Platform.OS === "android"
      ) {
        if (isAppUpdateUpToDate(info.latestVersionCode, info.latestVersionName)) {
          pendingInstallBuildRef.current = null;
          openedSettingsForInstallRef.current = false;
          closeToIdle();
          return;
        }

        void (async () => {
          const path =
            lastApkPathRef.current ?? (await findExistingDownloadedApkPath());
          if (!path) {
            return;
          }

          if (openedSettingsForInstallRef.current) {
            openedSettingsForInstallRef.current = false;
            await openInstaller(path);
            return;
          }

          if (!isAppUpdateUpToDate(info.latestVersionCode, info.latestVersionName)) {
            showReadyToInstall(info, path);
          }
        })();
        return;
      }

      if (phase === "downloading" || phase === "ready_install") {
        return;
      }

      if (phase === "error") {
        return;
      }

      void runCheck({ force: true });
    });
    return () => sub.remove();
  }, [runCheck, phase, info, closeToIdle, openInstaller, showReadyToInstall]);

  const onDismissOptional = useCallback(async () => {
    if (info && !info.forceUpdate) {
      try {
        await AsyncStorage.setItem(
          SKIP_STORAGE_KEY,
          String(info.latestVersionCode),
        );
      } catch {
        /* abaikan */
      }
    }
    closeToIdle();
  }, [closeToIdle, info]);

  const runDownloadFlow = useCallback(async () => {
    if (!info?.downloadUrl) return;

    setLocalApkReady(false);
    setErrorMessage("");
    setPhase("downloading");
    setProgress({
      percent: 0,
      receivedBytes: 0,
      totalBytes: null,
    });

    try {
      await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    } catch {
      /* abaikan */
    }

    const handle = startAndroidApkDownload(
      info.downloadUrl,
      (p) => setProgress(p),
      { wifiOnly: false, timeoutMs: APK_DOWNLOAD_TIMEOUT_MS },
    );
    downloadRef.current = handle;

    try {
      const path = await handle.done;
      downloadRef.current = null;
      await waitAfterApkDownloadSettle();
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          lastApkPathRef.current = path;
          setLocalApkReady(true);
          setProgress({
            percent: 100,
            receivedBytes: 0,
            totalBytes: null,
          });
          setPhase("ready_install");
          resolve();
        });
      });
    } catch (e: unknown) {
      downloadRef.current = null;
      const msg = e instanceof Error ? e.message : "Unduhan dibatalkan atau gagal.";
      if (msg.toLowerCase() === "canceled") {
        setPhase("prompt");
        return;
      }
      setLocalApkReady(false);
      setErrorMessage(msg);
      setPhase("error");
    } finally {
      try {
        await deactivateKeepAwakeAsync(KEEP_AWAKE_TAG);
      } catch {
        /* abaikan */
      }
    }
  }, [info]);

  const startDownloadAndroid = useCallback(async () => {
    if (!info?.downloadUrl) return;

    const existing = await findExistingDownloadedApkPath();
    if (existing) {
      showReadyToInstall(info, existing);
      return;
    }

    try {
      await assertStorageForApkDownload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Penyimpanan tidak cukup.";
      setErrorMessage(msg);
      setPhase("error");
      return;
    }

    const net = await NetInfo.fetch();
    const onCellular = net.type === "cellular";
    setIsCellular(onCellular);

    if (onCellular) {
      Alert.alert(
        `Unduh pembaruan (${getApkUpdateSizeLabel()})`,
        `File APK sekitar ${getApkUpdateSizeLabel()}. Unduhan bisa memakan waktu lama dan kuota data. Sangat disarankan memakai Wi‑Fi.\n\nLanjutkan dengan data seluler?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Lanjutkan",
            onPress: () => {
              void runDownloadFlow();
            },
          },
        ],
      );
      return;
    }

    await runDownloadFlow();
  }, [info, runDownloadFlow, showReadyToInstall]);

  useEffect(() => {
    if (phase !== "error" && phase !== "ready_install") return;
    void refreshLocalApkReady();
  }, [phase, refreshLocalApkReady]);

  useEffect(() => {
    if (phase !== "prompt" || !info?.downloadUrl || Platform.OS !== "android") {
      return;
    }
    if (!info.forceUpdate || autoDownloadStartedRef.current) return;
    autoDownloadStartedRef.current = true;
    void startDownloadAndroid();
  }, [phase, info, startDownloadAndroid]);

  useEffect(() => {
    if (phase === "idle") {
      autoDownloadStartedRef.current = false;
    }
  }, [phase]);

  const onOpenStore = useCallback(async () => {
    const url = info?.storeUrl?.trim();
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      setErrorMessage("Tidak dapat membuka tautan toko aplikasi.");
      setPhase("error");
    }
  }, [info?.storeUrl]);

  const onRetry = useCallback(() => {
    setErrorMessage("");
    if (Platform.OS === "android") {
      void (async () => {
        const ready = await refreshLocalApkReady();
        if (ready && lastApkPathRef.current) {
          await openInstaller(lastApkPathRef.current);
          return;
        }
        if (info?.downloadUrl) {
          void startDownloadAndroid();
        } else {
          setPhase("prompt");
        }
      })();
      return;
    }
    setPhase("prompt");
  }, [info?.downloadUrl, openInstaller, refreshLocalApkReady, startDownloadAndroid]);

  const hasLocalApk = Platform.OS === "android" && localApkReady;

  if (Platform.OS === "web") return null;

  const usesStoreUpdate =
    (Platform.OS === "ios" || isAndroidStoreUpdatePreferred()) &&
    Boolean(info?.storeUrl?.trim());
  const usesApkUpdate =
    Platform.OS === "android" &&
    !isAndroidStoreUpdatePreferred() &&
    Boolean(info?.downloadUrl?.trim());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (
          phase === "downloading" ||
          phase === "ready_install" ||
          (info?.forceUpdate && phase === "prompt")
        ) {
          return;
        }
        if (phase === "prompt" && !info?.forceUpdate) void onDismissOptional();
        if (phase === "error" && !info?.forceUpdate) closeToIdle();
      }}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (phase === "prompt" && !info?.forceUpdate) void onDismissOptional();
          if (phase === "error") closeToIdle();
        }}
        disabled={
          phase === "downloading" ||
          phase === "ready_install" ||
          (info?.forceUpdate === true && phase === "prompt")
        }
      >
        <Pressable
          style={[
            styles.card,
            { marginBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.iconWrap}>
            {phase === "downloading" ? (
              <ActivityIndicator size="large" color={Colors.light.primary} />
            ) : phase === "ready_install" ? (
              <Ionicons name="checkmark-circle" size={44} color="#22C55E" />
            ) : (
              <DownloadCloud size={40} color={Colors.light.primary} strokeWidth={2} />
            )}
          </View>

          <Text style={styles.title}>
            {phase === "error"
              ? "Terjadi masalah"
              : phase === "downloading"
                ? "Mengunduh pembaruan"
                : phase === "ready_install"
                  ? "Unduhan selesai"
                  : "Pembaruan tersedia"}
          </Text>

          {info ? (
            <Text style={styles.subtitle}>
              Versi{" "}
              <Text style={styles.bold}>
                {info.latestVersionName || String(info.latestVersionCode)}
              </Text>{" "}
              {phase === "ready_install" ? " siap dipasang." : " tersedia."}
              {phase === "prompt" ? (
                usesStoreUpdate ? (
                  <>
                    {"\n"}
                    Ketuk <Text style={styles.bold}>Buka Play Store</Text> untuk memperbarui
                    aplikasi.
                  </>
                ) : (
                  <>
                    {"\n"}
                    Ketuk <Text style={styles.bold}>Unduh pembaruan</Text>. Setelah selesai, pilih{" "}
                    <Text style={styles.bold}>Pasang sekarang</Text> di layar sistem.
                  </>
                )
              ) : null}
              {phase === "ready_install" ? (
                <>
                  {"\n"}
                  Ketuk <Text style={styles.bold}>Pasang sekarang</Text>. Pilih{" "}
                  <Text style={styles.bold}>Pasang / Update</Text> pada layar Android.
                  Aktifkan izin pasang aplikasi untuk HR-TAG jika diminta.
                </>
              ) : null}
            </Text>
          ) : null}

          {(phase === "prompt" || phase === "downloading") && usesApkUpdate ? (
            <View
              style={[
                styles.chip,
                isCellular && phase === "prompt" ? styles.chipWarn : styles.chipInfo,
              ]}
            >
              <Ionicons
                name={isCellular ? "cellular-outline" : "cloud-download-outline"}
                size={16}
                color={isCellular ? "#B45309" : "#1D4ED8"}
              />
              <Text
                style={[styles.chipText, isCellular ? styles.chipTextWarn : styles.chipTextInfo]}
              >
                {phase === "downloading"
                  ? `Mengunduh ~${getApkUpdateSizeLabel()} — jangan tutup aplikasi`
                  : isCellular
                    ? `File ~${getApkUpdateSizeLabel()} — disarankan Wi‑Fi`
                    : `Ukuran unduhan ~${getApkUpdateSizeLabel()}`}
              </Text>
            </View>
          ) : null}

          {info?.releaseNotes && phase === "prompt" ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Catatan rilis</Text>
              <ScrollView style={styles.notesScroll} nestedScrollEnabled>
                <Text style={styles.notesBody}>{info.releaseNotes}</Text>
              </ScrollView>
            </View>
          ) : null}

          {phase === "downloading" ? (
            <View style={styles.progressBlock}>
              <View style={styles.track}>
                {progress.percent != null ? (
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.max(2, progress.percent)}%` },
                    ]}
                  />
                ) : (
                  <View style={styles.indeterminateTrack}>
                    <ActivityIndicator color={Colors.light.primary} size="small" />
                  </View>
                )}
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressPct}>
                  {progress.percent != null ? `${progress.percent}%` : "Mengunduh…"}
                </Text>
                {progress.totalBytes != null && progress.totalBytes > 0 ? (
                  <Text style={styles.progressBytes}>
                    {formatBytes(progress.receivedBytes)} /{" "}
                    {formatBytes(progress.totalBytes)}
                  </Text>
                ) : progress.receivedBytes > 0 ? (
                  <Text style={styles.progressBytes}>
                    {formatBytes(progress.receivedBytes)} terunduh
                  </Text>
                ) : null}
              </View>
              {!info?.forceUpdate ? (
                <Pressable
                  style={styles.cancelDownload}
                  onPress={() => {
                    downloadRef.current?.cancel();
                    downloadRef.current = null;
                    setPhase("prompt");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Batalkan unduhan"
                >
                  <Text style={styles.cancelDownloadText}>Batal unduh</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {phase === "error" ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {phase === "ready_install" && Platform.OS === "android" ? (
            <View style={styles.actions}>
              {!info?.forceUpdate ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSecondary,
                    pressed && styles.pressed,
                  ]}
                  onPress={closeToIdle}
                >
                  <Text style={styles.btnSecondaryText}>Nanti</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.btnSecondary,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  openedSettingsForInstallRef.current = true;
                  void openUnknownSourcesSettings();
                }}
              >
                <Text style={styles.btnSecondaryText}>Pengaturan</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btnPrimaryWrap, pressed && styles.pressed]}
                onPress={() => {
                  const path = lastApkPathRef.current;
                  if (!path) return;
                  void openInstaller(path);
                }}
              >
                <LinearGradient
                  colors={["#16A34A", "#15803D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnPrimary}
                >
                  <Ionicons name="construct-outline" size={20} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Pasang sekarang</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {phase === "prompt" && usesApkUpdate ? (
            <View style={styles.actions}>
              {!info.forceUpdate ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSecondary,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => void onDismissOptional()}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnSecondaryText}>Nanti</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.btnPrimaryWrap, pressed && styles.pressed]}
                onPress={() => void startDownloadAndroid()}
                accessibilityRole="button"
                accessibilityLabel="Perbarui sekarang"
              >
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnPrimary}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Unduh pembaruan</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {phase === "prompt" && usesStoreUpdate ? (
            <View style={styles.actions}>
              {!info?.forceUpdate ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSecondary,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => void onDismissOptional()}
                >
                  <Text style={styles.btnSecondaryText}>Nanti</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.btnPrimaryWrap, pressed && styles.pressed]}
                onPress={() => void onOpenStore()}
              >
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnPrimary}
                >
                  <Ionicons
                    name={Platform.OS === "ios" ? "logo-apple" : "logo-google-playstore"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.btnPrimaryText}>
                    {Platform.OS === "ios" ? "Buka App Store" : "Buka Play Store"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {phase === "error" ? (
            <View style={styles.actions}>
              {!info?.forceUpdate ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnSecondary,
                    pressed && styles.pressed,
                  ]}
                  onPress={closeToIdle}
                >
                  <Text style={styles.btnSecondaryText}>Tutup</Text>
                </Pressable>
              ) : null}
              {errorMessage.toLowerCase().includes("pemasang") ||
              errorMessage.toLowerCase().includes("pengaturan") ? (
                <Pressable
                  style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
                  onPress={() => {
                    openedSettingsForInstallRef.current = true;
                    void openUnknownSourcesSettings();
                  }}
                >
                  <Text style={styles.btnSecondaryText}>Pengaturan</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.btnPrimaryWrap, pressed && styles.pressed]}
                onPress={onRetry}
              >
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnPrimary}
                >
                  <Ionicons
                    name={hasLocalApk ? "construct-outline" : "refresh-outline"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.btnPrimaryText}>
                    {hasLocalApk ? "Pasang sekarang" : "Unduh lagi"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : null}

          {info?.forceUpdate && phase === "prompt" ? (
            <Text style={styles.forceHint}>Pembaruan wajib untuk melanjutkan.</Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    alignSelf: "center",
    marginBottom: 14,
    minHeight: 48,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  bold: {
    fontWeight: "700",
    color: Colors.light.text,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  chipInfo: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  chipWarn: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  chipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  chipTextInfo: {
    color: "#1E40AF",
  },
  chipTextWarn: {
    color: "#B45309",
  },
  notesBox: {
    maxHeight: 140,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#F8FAFC",
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesScroll: {
    maxHeight: 96,
  },
  notesBody: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 21,
  },
  progressBlock: {
    marginTop: 8,
    marginBottom: 4,
  },
  track: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
  indeterminateTrack: {
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  progressPct: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.primary,
  },
  progressBytes: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  cancelDownload: {
    alignSelf: "center",
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelDownloadText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: "#B91C1C",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 8,
  },
  installAgainBtn: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btnPrimaryWrap: {
    borderRadius: 14,
    overflow: "hidden",
    minWidth: 160,
    flexGrow: 1,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  btnSecondary: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  forceHint: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    textAlign: "center",
  },
});

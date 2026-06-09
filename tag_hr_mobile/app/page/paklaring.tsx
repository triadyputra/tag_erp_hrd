import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { formatDate } from "@/helpers/date.util";
import { openPdfFromBase64 } from "@/helpers/pdf.util";
import { getUser } from "@/helpers/token.helper";
import {
  getListPaklaringByNik,
  printPaklaringMobile,
  type PaklaringItem,
} from "@/services/paklaring.service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getStatusMeta(status?: number) {
  if (status === 1) {
    return {
      label: "Terbit",
      bg: "#DCFCE7",
      color: "#15803D",
      icon: "checkmark-circle" as const,
    };
  }
  return {
    label: "Menunggu",
    bg: "#FEF3C7",
    color: "#B45309",
    icon: "time" as const,
  };
}

function jenisLabel(jenis?: string) {
  if (jenis?.toUpperCase() === "BPJS") return "BPJS";
  if (jenis?.toUpperCase() === "KARYAWAN") return "Karyawan";
  return jenis || "—";
}

export default function PaklaringPage() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<PaklaringItem[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const user = await getUser();
      const noKtp = user?.NoKtp;
      if (!noKtp) throw new Error("NOKTP kosong");

      const res = await getListPaklaringByNik(noKtp);
      setData(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : "Gagal memuat data paklaring";
      setErrorMsg(msg);
      console.error("[PaklaringPage] load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const terbitCount = data.filter((x) => (x?.Status ?? 0) === 1).length;
  const menungguCount = data.length - terbitCount;

  const handleDownload = useCallback(async (item: PaklaringItem) => {
    const id = item?.Id ?? "";
    if (!id) return;

    if ((item?.Status ?? 0) !== 1) {
      Alert.alert("Belum tersedia", "PDF hanya bisa diunduh setelah paklaring terbit.");
      return;
    }

    try {
      setDownloadingId(id);

      const { pdfBase64 } = await printPaklaringMobile(id);
      const fileUri = await openPdfFromBase64(pdfBase64);
      if (!fileUri) throw new Error("Gagal menyiapkan file PDF");

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error("Fitur bagikan file tidak tersedia di perangkat ini");
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: "Download / Bagikan Paklaring",
        UTI: "com.adobe.pdf",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : "Gagal mengunduh paklaring";
      Alert.alert("Gagal", msg);
      console.error("[PaklaringPage] download error:", err);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader title="Paklaring" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            colors={["#0EA5E9"]}
            tintColor="#0EA5E9"
          />
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <LinearGradient
          colors={["#0EA5E9", "#0284C7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Surat keterangan kerja</Text>
              <Text style={styles.heroTitle}>Paklaring</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="document-text" size={24} color="#fff" />
            </View>
          </View>
          <Text style={styles.heroSub}>
            {loading
              ? "Memuat data..."
              : `${data.length} pengajuan · ${terbitCount} sudah terbit`}
          </Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-done-outline"
            iconBg="#DCFCE7"
            iconColor="#15803D"
            label="Terbit"
            value={loading ? "…" : String(terbitCount)}
          />
          <StatCard
            icon="hourglass-outline"
            iconBg="#FEF3C7"
            iconColor="#B45309"
            label="Menunggu"
            value={loading ? "…" : String(menungguCount)}
          />
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="folder-open-outline" size={20} color={Colors.light.text} />
            <Text style={styles.sectionTitle}>Daftar Paklaring</Text>
          </View>
          {!loading && data.length > 0 ? (
            <Text style={styles.sectionCount}>{data.length} surat</Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.loadingText}>Memuat paklaring...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
            <Text style={styles.errorTitle}>Gagal memuat data</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Pressable style={styles.retryBtn} onPress={() => void load()}>
              <Ionicons name="refresh" size={16} color="#0284C7" />
              <Text style={styles.retryText}>Coba lagi</Text>
            </Pressable>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="document-outline" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Belum ada paklaring</Text>
            <Text style={styles.emptySub}>
              Ajukan surat paklaring untuk melihat daftar di sini
            </Text>
          </View>
        ) : (
          <View style={styles.listGap}>
            {data.map((item, i) => {
              const status = getStatusMeta(item?.Status);
              const isTerbit = (item?.Status ?? 0) === 1;
              const id = item?.Id ?? "";
              const isDownloading = downloadingId === id;

              return (
                <View key={id || i} style={styles.pakCard}>
                  <View style={styles.pakCardTop}>
                    <View style={styles.docIconWrap}>
                      <Ionicons name="document-attach" size={20} color="#0284C7" />
                    </View>
                    <View style={styles.pakCardBody}>
                      <Text style={styles.pakNomor}>{item?.Nomor ?? "—"}</Text>
                      <Text style={styles.pakDate}>{formatDate(item?.Tanggal)}</Text>
                      <View style={styles.pakMetaRow}>
                        <View style={styles.jenisPill}>
                          <Text style={styles.jenisPillText}>
                            {jenisLabel(item?.Jenis)}
                          </Text>
                        </View>
                        <View
                          style={[styles.statusBadge, { backgroundColor: status.bg }]}
                        >
                          <Ionicons name={status.icon} size={12} color={status.color} />
                          <Text style={[styles.statusText, { color: status.color }]}>
                            {status.label}
                          </Text>
                        </View>
                      </View>
                      {item?.Keperluan ? (
                        <Text style={styles.pakKet} numberOfLines={2}>
                          {item.Keperluan}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {isTerbit ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.downloadBtn,
                        (isDownloading || pressed) && styles.downloadBtnPressed,
                      ]}
                      onPress={() => void handleDownload(item)}
                      disabled={!id || isDownloading}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="download-outline" size={18} color="#fff" />
                          <Text style={styles.downloadText}>Unduh PDF</Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.waitingBar}>
                      <Ionicons name="information-circle-outline" size={16} color="#B45309" />
                      <Text style={styles.waitingText}>
                        PDF tersedia setelah status terbit
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.fabWrap, { bottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.fabPress, pressed && styles.fabPressed]}
          onPress={() => router.push("/page/form-paklaring")}
        >
          <LinearGradient
            colors={["#0EA5E9", "#0284C7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fab}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.fabText}>Ajukan Paklaring</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  hero: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 14,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.light.text,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#991B1B",
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    textAlign: "center",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0284C7",
  },
  emptyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  listGap: {
    gap: 12,
  },
  pakCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pakCardTop: {
    flexDirection: "row",
    gap: 12,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  pakCardBody: {
    flex: 1,
  },
  pakNomor: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
  },
  pakDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  pakMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  jenisPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jenisPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  pakKet: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 17,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0284C7",
  },
  downloadBtnPressed: {
    opacity: 0.88,
  },
  downloadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  waitingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  waitingText: {
    flex: 1,
    fontSize: 12,
    color: "#B45309",
    fontWeight: "600",
  },
  fabWrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  fabPress: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  fabText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

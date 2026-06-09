import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { getUser } from "@/helpers/token.helper";
import {
  deleteCutiKaryawanMobile,
  getDetailCuti,
} from "@/services/cuti.services";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
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

type CutiItem = {
  NoCuti?: string | number;
  TglCuti: string;
  Keterangan?: string;
  Status: number | null;
};

type CutiSummary = {
  Sisa?: number;
  Terpakai?: number;
  JumlahPengajuan?: number;
};

function formatDate(date: string) {
  const d = new Date(date.includes("T") ? date : `${date}T12:00:00`);
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusMeta(status: number | null) {
  if (status === 2) {
    return {
      label: "Disetujui",
      bg: "#DCFCE7",
      color: "#15803D",
      icon: "checkmark-circle" as const,
    };
  }
  if (status === 3) {
    return {
      label: "Ditolak",
      bg: "#FEE2E2",
      color: "#B91C1C",
      icon: "close-circle" as const,
    };
  }
  return {
    label: "Menunggu",
    bg: "#FEF3C7",
    color: "#B45309",
    icon: "time" as const,
  };
}

export default function CutiPage() {
  const insets = useSafeAreaInsets();
  const tahun = new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<CutiSummary | null>(null);
  const [detail, setDetail] = useState<CutiItem[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const user = await getUser();
      const noktp = user?.NoKtp;
      if (!noktp) throw new Error("NOKTP kosong");

      const res = await getDetailCuti(noktp, tahun);
      setSummary(res?.Summary ?? null);
      setDetail(res?.Detail || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data cuti";
      console.log("ERROR CUTI:", msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tahun]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  async function handleDelete(item: CutiItem) {
    if (item.Status !== 1 && item.Status !== null) return;

    Alert.alert("Hapus pengajuan", "Yakin ingin membatalkan cuti ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            if (item.NoCuti == null || item.NoCuti === "") {
              throw new Error("Nomor cuti tidak valid");
            }
            await deleteCutiKaryawanMobile(String(item.NoCuti));
            void loadData(true);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal menghapus";
            Alert.alert("Gagal", msg);
          }
        },
      },
    ]);
  }

  const sisa = summary?.Sisa ?? 0;
  const terpakai = summary?.Terpakai ?? 0;
  const pengajuan = summary?.JumlahPengajuan ?? 0;

  return (
    <View style={styles.container}>
      <AppHeader title="Cuti Karyawan" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadData(true)}
            colors={[Colors.light.primary]}
            tintColor={Colors.light.primary}
          />
        }
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Hero */}
        <LinearGradient
          colors={["#3B82F6", "#2563EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Tahun cuti</Text>
              <Text style={styles.heroYear}>{tahun}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="airplane" size={22} color="#fff" />
            </View>
          </View>
          <View style={styles.heroSisa}>
            <Text style={styles.heroSisaLabel}>Sisa cuti</Text>
            <Text style={styles.heroSisaValue}>
              {loading ? "—" : `${sisa}`}
              <Text style={styles.heroSisaUnit}> hari</Text>
            </Text>
          </View>
        </LinearGradient>

        {/* Statistik */}
        <View style={styles.statsRow}>
          <StatCard
            icon="wallet-outline"
            iconBg="#EFF6FF"
            iconColor={Colors.light.primary}
            label="Sisa"
            value={loading ? "…" : String(sisa)}
            suffix="hari"
          />
          <StatCard
            icon="checkmark-done-outline"
            iconBg="#FFF7ED"
            iconColor="#EA580C"
            label="Terpakai"
            value={loading ? "…" : String(terpakai)}
            suffix="hari"
          />
          <StatCard
            icon="document-text-outline"
            iconBg="#FEF2F2"
            iconColor="#DC2626"
            label="Pengajuan"
            value={loading ? "…" : String(pengajuan)}
            suffix="x"
          />
        </View>

        {/* Riwayat */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="list-outline" size={20} color={Colors.light.text} />
            <Text style={styles.sectionTitle}>Riwayat Cuti</Text>
          </View>
          {!loading && detail.length > 0 ? (
            <Text style={styles.sectionCount}>{detail.length} entri</Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Memuat riwayat cuti...</Text>
          </View>
        ) : detail.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="calendar-outline" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Belum ada pengajuan</Text>
            <Text style={styles.emptySub}>
              Ajukan cuti untuk melihat riwayat di sini
            </Text>
          </View>
        ) : (
          <View style={styles.listGap}>
            {detail.map((item, i) => {
              const status = getStatusMeta(item.Status);
              const canDelete = item.Status === 1 || item.Status === null;

              return (
                <View key={item.NoCuti ?? i} style={styles.cutiCard}>
                  <View style={styles.cutiCardLeft}>
                    <View style={styles.dateIconWrap}>
                      <Ionicons name="calendar" size={18} color={Colors.light.primary} />
                    </View>
                    <View style={styles.cutiCardBody}>
                      <Text style={styles.cutiDate}>{formatDate(item.TglCuti)}</Text>
                      <Text style={styles.cutiKet} numberOfLines={2}>
                        {item.Keterangan || "—"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cutiCardRight}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Ionicons name={status.icon} size={14} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>

                    {canDelete ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.deleteBtn,
                          pressed && styles.deleteBtnPressed,
                        ]}
                        onPress={() => void handleDelete(item)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        <Text style={styles.deleteText}>Batalkan</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB Ajukan */}
      <View style={[styles.fabWrap, { bottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.fabPress, pressed && styles.fabPressed]}
          onPress={() => router.push("/page/form-cuti")}
        >
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fab}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.fabText}>Ajukan Cuti</Text>
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
  suffix,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statSuffix}> {suffix}</Text>
      </Text>
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
    shadowColor: "#2563EB",
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
  heroYear: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroSisa: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.25)",
  },
  heroSisaLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  heroSisaValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginTop: 4,
  },
  heroSisaUnit: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
  },
  statSuffix: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontWeight: "600",
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
    gap: 10,
  },
  cutiCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cutiCardLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  dateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cutiCardBody: {
    flex: 1,
  },
  cutiDate: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  cutiKet: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  cutiCardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteBtnPressed: {
    opacity: 0.85,
  },
  deleteText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  fabWrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  fabPress: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2563EB",
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

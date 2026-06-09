import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { formatDate } from "@/helpers/date.util";
import { getDateStatus } from "@/helpers/status.util";
import { getUser } from "@/helpers/token.helper";
import { getDetailKaryawan } from "@/services/kontrak.service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterKey =
  | "all"
  | "unsigned"
  | "signed"
  | "active"
  | "upcoming"
  | "inactive";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "unsigned", label: "Belum TTD" },
  { key: "signed", label: "Sudah TTD" },
  { key: "active", label: "Aktif" },
  { key: "upcoming", label: "Akan aktif" },
  { key: "inactive", label: "Non aktif" },
];

export default function KontrakPage() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const avatarSource = (() => {
    const raw = typeof photo === "string" ? photo.trim() : "";
    if (!raw || raw.toLowerCase() === "null") {
      return require("@/assets/images/avatar.png");
    }
    const uri = raw.startsWith("data:image/") ? raw : `data:image/png;base64,${raw}`;
    return { uri };
  })();

  const load = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setErrorMsg(null);

    try {
      const user = await getUser();
      const noktp = user?.NoKtp;
      if (!noktp) throw new Error("NOKTP kosong");

      const res = await getDetailKaryawan(noktp);
      setData(res as Record<string, unknown>);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : "Gagal memuat data kontrak";
      setErrorMsg(msg);
      console.error("[KontrakPage] load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const user = await getUser();
      const nextPhoto =
        typeof user?.Photo === "string" && user.Photo.trim()
          ? user.Photo.trim()
          : null;
      setPhoto(nextPhoto);
      void load();
    })();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load("refresh");
    }, [load]),
  );

  const profile = (data?.Profile ?? null) as Record<string, unknown> | null;
  const contracts = (data?.Kontrak ?? []) as Record<string, unknown>[];
  const contractCount = contracts.length;
  const unsignedCount = contracts.filter((x) => !x?.Status).length;
  const signedCount = Math.max(0, contractCount - unsignedCount);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredContracts = contracts.filter((item) => {
    const pawal = String(item.PAWAL ?? "");
    const pakhir = String(item.PAKHIR ?? "");
    const status = getDateStatus(pawal, pakhir);
    const isSigned = !!item.Status;

    const matchesFilter =
      filter === "all"
        ? true
        : filter === "unsigned"
          ? !isSigned
          : filter === "signed"
            ? isSigned
            : filter === "active"
              ? status === "active"
              : filter === "upcoming"
                ? status === "upcoming"
                : status === "inactive";

    if (!matchesFilter) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      item.NOKONTRAK,
      item.JNSKONTRAK,
      item.NMJABATAN,
      item.NMCABANG,
      item.NMBAGIAN,
      item.NMDIVISI,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  return (
    <View style={styles.container}>
      <AppHeader title="Kontrak Karyawan" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {loading ? (
          <>
            <EmployeeSkeleton />
            <SectionHeader count={0} loading />
            {[1, 2, 3].map((i) => (
              <ContractSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            {errorMsg ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
                <Text style={styles.errorTitle}>Gagal memuat data</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <Pressable style={styles.retryBtn} onPress={() => void load("initial")}>
                  <Ionicons name="refresh" size={16} color={Colors.light.primary} />
                  <Text style={styles.retryText}>Coba lagi</Text>
                </Pressable>
              </View>
            ) : null}

            <LinearGradient
              colors={["#1E40AF", "#3B82F6", "#60A5FA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.employeeCard}
            >
              <View style={styles.heroGlow} pointerEvents="none" />
              <View style={styles.employeeMain}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName} numberOfLines={2}>
                    {String(profile?.NAMALENGKAP ?? "-")}
                  </Text>
                  <View style={styles.employeeSubRow}>
                    <Ionicons name="card-outline" size={13} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.employeeSub} numberOfLines={1}>
                      {String(profile?.NOKTP ?? "-")}
                    </Text>
                  </View>
                  <View style={styles.employeeSubRow}>
                    <Ionicons name="male-female-outline" size={13} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.employeeSub}>{String(profile?.KELAMIN ?? "-")}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <StatChip label="Kontrak" value={contractCount} />
                    <StatChip label="Sudah TTD" value={signedCount} />
                    <StatChip label="Pending" value={unsignedCount} highlight={unsignedCount > 0} />
                  </View>

                  <View style={styles.profileDetails}>
                    <ProfileLine
                      icon="calendar-outline"
                      label="Tanggal lahir"
                      value={formatDate(String(profile?.TGLLAHIR ?? ""))}
                    />
                    <ProfileLine
                      icon="location-outline"
                      label="Alamat"
                      value={String(profile?.ALAMAT ?? "-")}
                    />
                  </View>
                </View>

                <View style={styles.avatarWrap}>
                  <Image source={avatarSource} style={styles.avatar} />
                </View>
              </View>
            </LinearGradient>

            <SectionHeader count={contractCount} />

            {contractCount > 0 ? (
              <>
                <View style={styles.searchWrap}>
                  <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Cari nomor, jenis, cabang..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {query.length > 0 ? (
                    <Pressable onPress={() => setQuery("")} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {FILTERS.map((f) => (
                    <FilterChip
                      key={f.key}
                      label={f.label}
                      active={filter === f.key}
                      onPress={() => setFilter(f.key)}
                    />
                  ))}
                </ScrollView>

                <Text style={styles.resultHint}>
                  Menampilkan {filteredContracts.length} dari {contractCount} kontrak
                </Text>
              </>
            ) : null}

            {contractCount === 0 ? (
              <EmptyState
                icon="document-outline"
                title="Belum ada data kontrak"
                sub="Tarik ke bawah untuk memuat ulang"
              />
            ) : filteredContracts.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="Tidak ada hasil"
                sub="Ubah filter atau kata kunci pencarian"
              />
            ) : (
              <View style={styles.listGap}>
                {filteredContracts.map((item, i) => (
                  <ContractCard
                    key={String(item.NOKONTRAK ?? i)}
                    item={item as Record<string, unknown>}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ count, loading }: { count: number; loading?: boolean }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionTitleWrap}>
        <Ionicons name="documents-outline" size={20} color={Colors.light.text} />
        <Text style={styles.section}>Riwayat Kontrak</Text>
      </View>
      {!loading ? (
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function StatChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.statChip,
        highlight && { backgroundColor: "rgba(254,243,199,0.35)" },
      ]}
    >
      <Text style={styles.statChipLabel}>{label}</Text>
      <Text style={styles.statChipValue}>{value}</Text>
    </View>
  );
}

function ProfileLine({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.profileLine}>
      <Ionicons name={icon} size={14} color="rgba(255,255,255,0.75)" />
      <View style={styles.profileLineText}>
        <Text style={styles.profileLabel}>{label}</Text>
        <Text style={styles.profileValue} numberOfLines={2}>
          {value || "-"}
        </Text>
      </View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chipFilter, active && styles.chipFilterActive]}
    >
      <Text style={[styles.chipFilterText, active && styles.chipFilterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={36} color="#CBD5E1" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{sub}</Text>
    </View>
  );
}

function ContractCard({ item }: { item: Record<string, unknown> }) {
  const pawal = String(item.PAWAL ?? "");
  const pakhir = String(item.PAKHIR ?? "");
  const status = getDateStatus(pawal, pakhir);
  const isSigned = !!item.Status;

  const meta = (() => {
    if (!isSigned) {
      return {
        label: "Belum TTD",
        bg: "#FEF3C7",
        color: "#B45309",
        border: "#FCD34D",
        icon: "create-outline" as const,
      };
    }
    if (status === "active") {
      return {
        label: "Aktif",
        bg: "#DCFCE7",
        color: "#15803D",
        border: "#86EFAC",
        icon: "checkmark-circle" as const,
      };
    }
    if (status === "upcoming") {
      return {
        label: "Akan aktif",
        bg: "#EFF6FF",
        color: "#1D4ED8",
        border: "#93C5FD",
        icon: "time-outline" as const,
      };
    }
    return {
      label: "Non aktif",
      bg: "#FEE2E2",
      color: "#B91C1C",
      border: "#FCA5A5",
      icon: "ban-outline" as const,
    };
  })();

  const contractId = String(item.NOKONTRAK ?? "");

  return (
    <View style={[styles.card, { borderLeftColor: meta.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.typeIconWrap}>
          <Ionicons name="document-text" size={20} color={Colors.light.primary} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.contractType} numberOfLines={1}>
            {String(item.JNSKONTRAK ?? "-")}
          </Text>
          <Text style={styles.contractNo}>{contractId || "-"}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={12} color={meta.color} />
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
        <Text style={styles.date}>
          {formatDate(pawal)} — {formatDate(pakhir)}
        </Text>
      </View>

      <View style={styles.metaBlock}>
        <InfoRow icon="briefcase-outline" text={String(item.NMJABATAN ?? "-")} />
        <InfoRow
          icon="business-outline"
          text={`${item.NMCABANG ?? "-"} · ${item.NMBAGIAN ?? "-"}`}
        />
        <InfoRow icon="layers-outline" text={String(item.NMDIVISI ?? "-")} />
      </View>

      <Pressable
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
        onPress={() =>
          router.push({
            pathname: "/page/kontrak-sign",
            params: { contractId: encodeURIComponent(contractId) },
          })
        }
      >
        {!isSigned ? (
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtn}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnTextPrimary}>Tanda Tangan</Text>
          </LinearGradient>
        ) : (
          <View style={styles.actionBtnOutline}>
            <Ionicons name="download-outline" size={18} color={Colors.light.primary} />
            <Text style={styles.actionBtnTextOutline}>Lihat & Unduh</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color="#94A3B8" />
      <Text style={styles.extra} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function SkeletonBox({
  height = 12,
  width = "100%" as const,
}: {
  height?: number;
  width?: number | `${number}%`;
}) {
  return (
    <View
      style={{
        height,
        width,
        backgroundColor: "#E2E8F0",
        borderRadius: 8,
        marginBottom: 8,
      }}
    />
  );
}

function EmployeeSkeleton() {
  return (
    <View style={[styles.employeeCard, { backgroundColor: "#E2E8F0" }]}>
      <View style={{ flex: 1 }}>
        <SkeletonBox width="65%" height={18} />
        <SkeletonBox width="50%" />
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <SkeletonBox width="30%" height={44} />
          <SkeletonBox width="30%" height={44} />
          <SkeletonBox width="30%" height={44} />
        </View>
      </View>
      <View style={styles.skeletonAvatar} />
    </View>
  );
}

function ContractSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <SkeletonBox width="70%" height={16} />
      <SkeletonBox width="45%" />
      <SkeletonBox width="80%" />
      <SkeletonBox width={100} height={36} />
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
    gap: 4,
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 12,
    gap: 6,
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
    backgroundColor: "#EFF6FF",
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  employeeCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -40,
    right: -20,
  },
  employeeMain: {
    flexDirection: "row",
    gap: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  employeeSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  employeeSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    flex: 1,
  },
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  statChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statChipLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  statChipValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  profileDetails: {
    marginTop: 12,
    gap: 8,
  },
  profileLine: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  profileLineText: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  profileValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginTop: 1,
  },
  avatarWrap: {
    width: 88,
    height: 100,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatar: {
    width: 80,
    height: 92,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 10,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  section: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.light.text,
  },
  countPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  countPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.light.primary,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 8,
  },
  chipFilter: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipFilterActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipFilterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  chipFilterTextActive: {
    color: "#fff",
  },
  resultHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
    marginBottom: 10,
  },
  listGap: {
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderLeftWidth: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  contractType: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
  },
  contractNo: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  date: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  metaBlock: {
    gap: 6,
    marginBottom: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  extra: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnTextPrimary: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFC",
  },
  actionBtnTextOutline: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
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
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  skeletonAvatar: {
    width: 80,
    height: 96,
    borderRadius: 16,
    backgroundColor: "#CBD5E1",
  },
  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});

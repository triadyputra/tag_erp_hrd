import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { getUser } from "@/helpers/token.helper";
import { hasValidProfilePhoto } from "@/lib/face/profile";
import {
  canCheckIn,
  canCheckOut,
  formatAbsenTime,
  getTodayStatus,
  resetAbsenTestData,
} from "@/services/absen.service";
import type { TodayAbsenStatus } from "@/types/absen";
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

function getStatusLabel(status: TodayAbsenStatus) {
  if (!status.checkIn) return "Belum presensi masuk";
  if (!status.checkOut) return "Sudah masuk, belum pulang";
  return "Presensi hari ini selesai";
}

export default function AbsenPage() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<TodayAbsenStatus>({
    checkIn: null,
    checkOut: null,
  });
  const [hasPhoto, setHasPhoto] = useState(true);

  const loadStatus = useCallback(async () => {
    const user = await getUser();
    if (!user?.NIKSistag) {
      setStatus({ checkIn: null, checkOut: null });
      setHasPhoto(false);
      return;
    }

    setHasPhoto(hasValidProfilePhoto(user.Photo));
    const today = await getTodayStatus(user.NIKSistag);
    setStatus(today);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadStatus().finally(() => setLoading(false));
    }, [loadStatus]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  }, [loadStatus]);

  const startScan = (type: "IN" | "OUT") => {
    if (!hasPhoto) {
      Alert.alert(
        "Foto profil diperlukan",
        "Unggah foto wajah di profil untuk verifikasi absensi.",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Ke Profil",
            onPress: () => router.push("/page/edit-profile"),
          },
        ],
      );
      return;
    }

    if (type === "IN" && !canCheckIn(status)) {
      Alert.alert("Info", "Anda sudah melakukan presensi masuk hari ini.");
      return;
    }

    if (type === "OUT" && !canCheckOut(status)) {
      Alert.alert(
        "Info",
        status.checkIn
          ? "Anda sudah melakukan presensi pulang hari ini."
          : "Lakukan presensi masuk terlebih dahulu.",
      );
      return;
    }

    router.push({
      pathname: "/page/absen-scan",
      params: { type },
    } as Parameters<typeof router.push>[0]);
  };

  const confirmReset = () => {
    Alert.alert(
      "Reset data tes",
      "Hapus semua riwayat absensi lokal dan cache wajah? Anda bisa scan ulang dari awal.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetAbsenTestData({ includeFaceCache: true });
              await loadStatus();
              Alert.alert("Berhasil", "Data absensi dan cache wajah sudah direset.");
            } catch {
              Alert.alert("Gagal", "Tidak dapat mereset data. Coba lagi.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Absensi" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#EFF6FF", "#FFFFFF", "#F0FDF4"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.iconRing}>
            <LinearGradient
              colors={[Colors.light.primary, "#60A5FA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconInner}
            >
              <Ionicons name="scan-outline" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={styles.headline}>Absensi Wajah</Text>
          <Text style={styles.lead}>
            Verifikasi wajah on-device dengan akurasi tinggi. Presensi
            disimpan lokal hingga API ERP tersedia.
          </Text>

          {loading ? (
            <ActivityIndicator
              color={Colors.light.primary}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <>
              <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Status hari ini</Text>
                <Text style={styles.statusValue}>{getStatusLabel(status)}</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Ionicons
                      name="log-in-outline"
                      size={18}
                      color="#16A34A"
                    />
                    <Text style={styles.timeText}>
                      Masuk:{" "}
                      {status.checkIn
                        ? formatAbsenTime(status.checkIn.timestamp)
                        : "-"}
                    </Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color="#DC2626"
                    />
                    <Text style={styles.timeText}>
                      Pulang:{" "}
                      {status.checkOut
                        ? formatAbsenTime(status.checkOut.timestamp)
                        : "-"}
                    </Text>
                  </View>
                </View>
              </View>

              {!hasPhoto ? (
                <View style={styles.warnCard}>
                  <Ionicons name="warning-outline" size={20} color="#B45309" />
                  <Text style={styles.warnText}>
                    Foto profil belum diatur. Unggah foto wajah frontal untuk
                    enrollment.
                  </Text>
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <Pressable
                  style={[
                    styles.actionBtn,
                    styles.actionIn,
                    !canCheckIn(status) && styles.actionDisabled,
                  ]}
                  onPress={() => startScan("IN")}
                  disabled={!canCheckIn(status)}
                >
                  <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Presensi Masuk</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionBtn,
                    styles.actionOut,
                    !canCheckOut(status) && styles.actionDisabled,
                  ]}
                  onPress={() => startScan("OUT")}
                  disabled={!canCheckOut(status)}
                >
                  <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Presensi Pulang</Text>
                </Pressable>
              </View>
            </>
          )}
        </LinearGradient>

        <Pressable
          style={styles.historyCard}
          onPress={() =>
            router.push("/page/absen-history" as Parameters<typeof router.push>[0])
          }
        >
          <View style={styles.historyIcon}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color={Colors.light.primary}
            />
          </View>
          <View style={styles.historyText}>
            <Text style={styles.historyTitle}>Riwayat absensi</Text>
            <Text style={styles.historyDesc}>Lihat rekap kehadiran lokal</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </Pressable>

        <View style={styles.hintCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={Colors.light.primary}
          />
          <Text style={styles.hintText}>
            Pastikan pencahayaan cukup, wajah lurus, dan mata terbuka saat
            scan.
          </Text>
        </View>

        <Pressable style={styles.resetBtn} onPress={confirmReset}>
          <Ionicons name="refresh-outline" size={18} color="#94A3B8" />
          <Text style={styles.resetBtnText}>Reset data tes</Text>
        </Pressable>
      </ScrollView>

      <View
        style={{
          height: insets.bottom,
          backgroundColor: Colors.light.background,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.12)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  iconRing: {
    alignSelf: "center",
    marginBottom: 18,
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 10,
  },
  lead: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  statusCard: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusValue: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 4,
    marginBottom: 12,
  },
  timeRow: {
    gap: 8,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  warnCard: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  warnText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 19,
  },
  actionRow: {
    marginTop: 16,
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionIn: {
    backgroundColor: "#16A34A",
  },
  actionOut: {
    backgroundColor: "#DC2626",
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  historyCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyText: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  historyDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  resetBtnText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
});

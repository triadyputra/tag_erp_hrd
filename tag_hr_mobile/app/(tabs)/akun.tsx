import { requestAppUpdateManualCheck } from "@/components/app-update/app-update-bridge";
import { getAppVersionLabel } from "@/constants/app-version";
import { Colors } from "@/constants/theme";
import { clearToken, getUser } from "@/helpers/token.helper";
import { logout } from "@/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UserProfile = {
  Nama?: string;
  Divisi?: string;
  NIKSistag?: string;
  Photo?: string | null;
};

type MenuConfig = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
  danger?: boolean;
};

function MenuRow({
  icon,
  title,
  subtitle,
  iconBg,
  iconColor,
  onPress,
  danger,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.menuRowLeft}>
        <LinearGradient colors={[iconBg, iconBg]} style={styles.menuIconGrad}>
          {loading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Ionicons name={icon} size={20} color={iconColor} />
          )}
        </LinearGradient>
        <View style={styles.menuTextWrap}>
          <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
          {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={danger ? "#FCA5A5" : "#94A3B8"}
      />
    </Pressable>
  );
}

export default function AkunScreen() {
  const insets = useSafeAreaInsets();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [updateCheckLoading, setUpdateCheckLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const data = await getUser();
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUser();
    }, [loadUser]),
  );

  const avatarSource = (() => {
    const raw = typeof user?.Photo === "string" ? user.Photo.trim() : "";
    if (!raw || raw.toLowerCase() === "null") {
      return require("@/assets/images/avatar.png");
    }
    const uri =
      raw.startsWith("http") || raw.startsWith("data:image/")
        ? raw
        : `data:image/png;base64,${raw}`;
    return { uri };
  })();

  const nama = user?.Nama?.trim() || "Karyawan";
  const divisi = user?.Divisi?.trim() || "-";
  const nik = user?.NIKSistag?.trim() || "-";

  const handleCheckUpdate = async () => {
    if (updateCheckLoading) return;

    if (Platform.OS === "web") {
      Alert.alert("Tidak tersedia", "Pemeriksaan pembaruan hanya untuk aplikasi mobile.");
      return;
    }

    try {
      setUpdateCheckLoading(true);
      const result = await requestAppUpdateManualCheck();

      if (result.status === "up_to_date") {
        Alert.alert(
          "Sudah terbaru",
          `Aplikasi Anda sudah versi terbaru (${getAppVersionLabel()}).`,
        );
        return;
      }

      if (result.status === "error") {
        Alert.alert("Gagal memeriksa", result.message);
        return;
      }

      if (result.status === "unsupported") {
        Alert.alert("Tidak tersedia", "Pemeriksaan pembaruan tidak didukung di perangkat ini.");
      }
    } finally {
      setUpdateCheckLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      await clearToken();
      setLogoutVisible(false);
      router.replace("/auth/login");
    } catch {
      router.replace("/auth/login");
    } finally {
      setLogoutLoading(false);
    }
  };

  const accountMenus: MenuConfig[] = [
    {
      key: "profil",
      icon: "person-outline",
      title: "Edit Profil",
      subtitle: "Foto & data diri",
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
      onPress: () => router.push("/page/edit-profile"),
    },
    {
      key: "riwayat",
      icon: "time-outline",
      title: "Riwayat Aktivitas",
      subtitle: "Log penggunaan aplikasi",
      iconBg: "#F0FDF4",
      iconColor: "#16A34A",
      onPress: () => router.push("/page/riwayat-aktivitas"),
    },
  ];

  const securityMenus: MenuConfig[] = [
    {
      key: "password",
      icon: "lock-closed-outline",
      title: "Ganti Password",
      subtitle: "Keamanan akun Anda",
      iconBg: "#FFFBEB",
      iconColor: "#D97706",
      onPress: () => router.push("/page/ganti-password"),
    },
  ];

  return (
    <>
      <View style={styles.root}>
        <LinearGradient
          colors={["#1D4ED8", "#3B82F6", "#60A5FA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerGlow} pointerEvents="none" />
          <View style={styles.headerGlowB} pointerEvents="none" />

          <View style={styles.profileRow}>
            <View style={styles.avatarRing}>
              <Image source={avatarSource} style={styles.avatar} />
              <View style={styles.avatarBadge}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            </View>

            <View style={styles.profileText}>
              <Text style={styles.profileLabel}>Profil Saya</Text>
              <Text style={styles.name} numberOfLines={2}>
                {nama}
              </Text>
              <View style={styles.divisiRow}>
                <Ionicons name="business-outline" size={13} color="rgba(255,255,255,0.9)" />
                <Text style={styles.divisi} numberOfLines={1}>
                  {divisi}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.nikCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nikCardInner}
            >
              <View style={styles.nikIconBox}>
                <Ionicons name="id-card-outline" size={20} color="#fff" />
              </View>
              <View style={styles.nikTextWrap}>
                <Text style={styles.nikLabel}>NIK SISTAG</Text>
                <Text style={styles.nikValue} numberOfLines={1}>
                  {nik}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionIcon}>
                <Ionicons name="settings-outline" size={16} color={Colors.light.primary} />
              </View>
              <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
            </View>
            {accountMenus.map((item, i) => (
              <View key={item.key}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <MenuRow
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                  iconBg={item.iconBg}
                  iconColor={item.iconColor}
                  onPress={item.onPress}
                />
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#D97706" />
              </View>
              <Text style={styles.sectionTitle}>Keamanan</Text>
            </View>
            {securityMenus.map((item) => (
              <MenuRow
                key={item.key}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                iconBg={item.iconBg}
                iconColor={item.iconColor}
                onPress={item.onPress}
              />
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="phone-portrait-outline" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.sectionTitle}>Aplikasi</Text>
            </View>

            <MenuRow
              icon="cloud-download-outline"
              title="Cek update aplikasi"
              subtitle={
                updateCheckLoading ? "Memeriksa pembaruan…" : "Unduh versi terbaru"
              }
              iconBg="#EEF2FF"
              iconColor="#4F46E5"
              onPress={() => void handleCheckUpdate()}
              loading={updateCheckLoading}
            />

            <View style={styles.versionCard}>
              <LinearGradient
                colors={["#F8FAFC", "#F1F5F9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.versionCardInner}
              >
                <View style={styles.versionIconWrap}>
                  <Ionicons name="information-circle" size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.versionTextWrap}>
                  <Text style={styles.versionLabel}>Versi terpasang</Text>
                  <Text style={styles.versionValue}>{getAppVersionLabel()}</Text>
                </View>
                <View style={styles.versionBadge}>
                  <Text style={styles.versionBadgeText}>HR-TAG</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutCard,
              pressed && styles.logoutCardPressed,
            ]}
            onPress={() => setLogoutVisible(true)}
          >
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            </View>
            <View style={styles.logoutTextWrap}>
              <Text style={styles.logoutTitle}>Keluar dari aplikasi</Text>
              <Text style={styles.logoutSub}>Akhiri sesi login Anda</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
          </Pressable>
        </ScrollView>
      </View>

      <Modal visible={logoutVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setLogoutVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIconWrap}>
              <LinearGradient
                colors={["#FEE2E2", "#FECACA"]}
                style={styles.modalIconGrad}
              >
                <Ionicons name="log-out-outline" size={32} color="#DC2626" />
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>Keluar dari aplikasi?</Text>
            <Text style={styles.modalMessage}>
              Anda perlu login kembali untuk mengakses data HR setelah logout.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.btnCancel,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => setLogoutVisible(false)}
                disabled={logoutLoading}
              >
                <Text style={styles.btnCancelText}>Batal</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.btnLogoutWrap,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => void handleLogout()}
                disabled={logoutLoading}
              >
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnLogout}
                >
                  {logoutLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnLogoutText}>Ya, logout</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -40,
    right: -30,
  },
  headerGlowB: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: 20,
    left: -20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  avatarRing: {
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 48,
    padding: 3,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E2E8F0",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  divisiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  divisi: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "500",
  },
  nikCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  nikCardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  nikIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  nikTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  nikLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
  },
  nikValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    marginTop: -18,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.8)",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 14,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuRowPressed: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginHorizontal: 4,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  menuIconGrad: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  menuTitleDanger: {
    color: "#DC2626",
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  versionCard: {
    marginHorizontal: 10,
    marginBottom: 10,
    marginTop: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  versionCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  versionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  versionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  versionValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    marginTop: 2,
  },
  versionBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  logoutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
  },
  logoutSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 26,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalIconWrap: {
    marginBottom: 4,
  },
  modalIconGrad: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.light.text,
    marginTop: 12,
    textAlign: "center",
  },
  modalMessage: {
    textAlign: "center",
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btnCancel: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnCancelText: {
    fontWeight: "700",
    color: "#475569",
    fontSize: 15,
  },
  btnLogoutWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  btnLogout: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnLogoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  btnPressed: {
    opacity: 0.88,
  },
});

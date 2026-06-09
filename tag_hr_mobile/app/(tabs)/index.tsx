import { Colors } from "@/constants/theme";
import { getUser } from "@/helpers/token.helper";
import { formatBeritaDate, getListBerita } from "@/services/berita.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  CalendarDays,
  Clock,
  FileSignature,
  FileText,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BeritaItem = { id: number; title: string; subtitle: string };

const MENU_ITEMS = [
  {
    key: "kontrak",
    icon: FileText,
    iconColor: "#2563EB",
    title: "Kontrak",
    subtitle: "TTD & unduh",
    grad: ["#EFF6FF", "#DBEAFE"] as const,
    route: "/page/kontrak" as const,
  },
  {
    key: "absen",
    icon: Clock,
    iconColor: "#16A34A",
    title: "Absen",
    subtitle: "Masuk & pulang",
    grad: ["#ECFDF5", "#D1FAE5"] as const,
    route: "/page/absen" as const,
  },
  {
    key: "cuti",
    icon: CalendarDays,
    iconColor: "#D97706",
    title: "Cuti",
    subtitle: "Saldo & ajukan",
    grad: ["#FFFBEB", "#FEF3C7"] as const,
    route: "/page/cuti" as const,
  },
  {
    key: "paklaring",
    icon: FileSignature,
    iconColor: "#7C3AED",
    title: "Paklaring",
    subtitle: "Ajukan & unduh",
    grad: ["#F5F3FF", "#EDE9FE"] as const,
    route: "/page/paklaring" as const,
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function HomeScreen() {
  const [announcements, setAnnouncements] = useState<BeritaItem[]>([]);
  const [beritaLoading, setBeritaLoading] = useState(true);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadAnnouncements = useCallback(async () => {
    try {
      setBeritaLoading(true);
      const res = await getListBerita();
      setAnnouncements(
        res.Data.map((b) => ({
          id: b.Id,
          title: b.Judul,
          subtitle: formatBeritaDate(b.CreatedAt),
        })),
      );
    } catch {
      setAnnouncements([]);
    } finally {
      setBeritaLoading(false);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const u = await getUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useFocusEffect(
    useCallback(() => {
      void loadAnnouncements();
    }, [loadAnnouncements]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUser(), loadAnnouncements()]);
    setRefreshing(false);
  };

  const avatarSource = (() => {
    const raw = typeof user?.Photo === "string" ? user.Photo.trim() : "";
    if (!raw || raw.toLowerCase() === "null") {
      return require("@/assets/images/avatar.png");
    }
    const uri = raw.startsWith("http") || raw.startsWith("data:image/")
      ? raw
      : `data:image/png;base64,${raw}`;
    return { uri };
  })();

  const nama = typeof user?.Nama === "string" ? user.Nama : "Karyawan";
  const divisi = typeof user?.Divisi === "string" ? user.Divisi : "-";
  const nik = typeof user?.NIKSistag === "string" ? user.NIKSistag : "-";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1D4ED8", "#3B82F6", "#60A5FA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerGlow} pointerEvents="none" />
        <View style={styles.headerGlowB} pointerEvents="none" />

        <View style={styles.headerTopRow}>
          <View style={styles.headerText}>
            <Text style={styles.hello}>{getGreeting()}</Text>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {nama}
            </Text>
            <View style={styles.divisiRow}>
              <Ionicons name="business-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.position} numberOfLines={1}>
                {divisi}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.avatarWrap}
            onPress={() => router.push("/(tabs)/akun")}
          >
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.avatarBadge}>
              <Ionicons name="person" size={10} color="#1D4ED8" />
            </View>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.idCard, pressed && styles.idCardPressed]}
          onPress={() => router.push("/(tabs)/akun")}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.idCardInner}
          >
            <View style={styles.idIconBox}>
              <Ionicons name="id-card" size={20} color="#fff" />
            </View>
            <View style={styles.idCardText}>
              <Text style={styles.idLabel}>NIK SISTAG</Text>
              <Text style={styles.idValue} numberOfLines={1}>
                {nik}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        </Pressable>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 88 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        <View style={styles.sectionIntro}>
          <View style={styles.sectionIntroIcon}>
            <Ionicons name="grid-outline" size={18} color={Colors.light.primary} />
          </View>
          <View>
            <Text style={styles.sectionIntroTitle}>Layanan HR</Text>
            <Text style={styles.sectionIntroSub}>Akses cepat fitur karyawan</Text>
          </View>
        </View>

        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.key}
              icon={<item.icon size={22} color={item.iconColor} strokeWidth={2.2} />}
              title={item.title}
              subtitle={item.subtitle}
              grad={item.grad}
              onPress={() => router.push(item.route)}
            />
          ))}
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="newspaper-outline" size={20} color={Colors.light.text} />
            <Text style={styles.section}>Informasi HR</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.sectionAction, pressed && { opacity: 0.85 }]}
            onPress={() => router.push("/page/informasi")}
          >
            <Text style={styles.sectionActionText}>Semua</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.light.primary} />
          </Pressable>
        </View>

        {beritaLoading ? (
          <View style={styles.beritaLoading}>
            <ActivityIndicator color={Colors.light.primary} />
            <Text style={styles.beritaLoadingText}>Memuat informasi...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.emptyBerita}>
            <View style={styles.emptyBeritaIcon}>
              <Ionicons name="megaphone-outline" size={32} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyBeritaTitle}>Belum ada pengumuman</Text>
            <Text style={styles.emptyBeritaSub}>
              Informasi terbaru dari HR akan tampil di sini
            </Text>
          </View>
        ) : (
          <View style={styles.beritaList}>
            {announcements.slice(0, 5).map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.listCard,
                  index === 0 && styles.listCardFeatured,
                  pressed && styles.listCardPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/page/informasi",
                    params: { id: String(item.id) },
                  })
                }
              >
                <LinearGradient
                  colors={
                    index === 0 ? ["#EFF6FF", "#DBEAFE"] : ["#F8FAFC", "#F1F5F9"]
                  }
                  style={styles.listIconWrap}
                >
                  <Ionicons
                    name={index === 0 ? "megaphone" : "document-text-outline"}
                    size={22}
                    color={Colors.light.primary}
                  />
                </LinearGradient>

                <View style={styles.listBody}>
                  {index === 0 ? (
                    <View style={styles.badgeBaru}>
                      <Text style={styles.badgeBaruText}>Terbaru</Text>
                    </View>
                  ) : null}
                  <Text style={styles.listTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.listMeta}>
                    <Ionicons name="time-outline" size={12} color={Colors.light.textSecondary} />
                    <Text style={styles.listSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  grad,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  grad: readonly [string, string];
}) {
  const scale = useState(() => new Animated.Value(1))[0];

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.menuItem}
    >
      <Animated.View style={[styles.menuAnimated, { transform: [{ scale }] }]}>
        <View style={styles.menuCard}>
          <View
            pointerEvents="none"
            style={[styles.menuDecor, { backgroundColor: grad[1] }]}
          />
          <LinearGradient
            colors={[grad[0], grad[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuIcon}
          >
            {icon}
          </LinearGradient>
          <Text style={styles.menuText}>{title}</Text>
          <Text style={styles.menuSubtext}>{subtitle}</Text>
          <View style={styles.menuArrow}>
            <Ionicons name="arrow-forward" size={12} color={Colors.light.text} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -60,
    right: -40,
  },
  headerGlowB: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: 20,
    left: -30,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  hello: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  divisiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  position: {
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "600",
    flex: 1,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#fff",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  idCard: {
    marginTop: 16,
    borderRadius: 18,
    overflow: "hidden",
  },
  idCardPressed: {
    opacity: 0.92,
  },
  idCardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    gap: 12,
  },
  idIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  idCardText: {
    flex: 1,
  },
  idLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  idValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sectionIntroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIntroTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.light.text,
  },
  sectionIntroSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  menuItem: {
    width: "47.5%",
  },
  menuAnimated: {
    width: "100%",
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    minHeight: 118,
    borderWidth: 1,
    borderColor: "#E8EDF4",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  menuDecor: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -24,
    right: -20,
    opacity: 0.35,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.light.text,
  },
  menuSubtext: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  menuArrow: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 12,
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
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  sectionActionText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  beritaLoading: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  beritaLoadingText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  emptyBerita: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyBeritaIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyBeritaTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  emptyBeritaSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  beritaList: {
    gap: 10,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8EDF4",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listCardFeatured: {
    borderColor: "#BFDBFE",
    backgroundColor: "#FAFCFF",
  },
  listCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  listIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  listBody: {
    flex: 1,
  },
  badgeBaru: {
    alignSelf: "flex-start",
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeBaruText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  listTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  listSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
});

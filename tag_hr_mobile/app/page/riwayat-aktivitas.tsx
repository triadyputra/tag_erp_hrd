import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { getRiwayatLogin } from "@/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RiwayatItem {
  Id: number;
  UserId: string;
  Username: string;
  IpAddress: string;
  Device: string;
  UserAgent: string;
  Modul: string;
  LoginTime: string;
  LogoutTime: string | null;
  IsSuccess: boolean;
}

function getType(item: RiwayatItem) {
  if (!item.IsSuccess) return "failed";
  if (item.LogoutTime) return "logout";
  return "login";
}

function getStyle(type: string) {
  if (type === "login")
    return {
      icon: "log-in-outline",
      bg: "#DBEAFE",
      color: "#2563EB",
      label: "Login",
    };

  if (type === "logout")
    return {
      icon: "log-out-outline",
      bg: "#FEE2E2",
      color: "#DC2626",
      label: "Logout",
    };

  return {
    icon: "warning-outline",
    bg: "#FEF3C7",
    color: "#D97706",
    label: "Login Gagal",
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hour}:${min}`;
}

export default function RiwayatAktivitasPage() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await getRiwayatLogin();
      setData(result);
    } catch (e) {
      console.error("Gagal memuat riwayat login:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <AppHeader title="Riwayat Login" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.primary} />
        ) : data.length === 0 ? (
          <Text style={styles.empty}>Belum ada riwayat login</Text>
        ) : (
          <View style={styles.card}>
            {data.map((item) => {
              const type = getType(item);
              const style = getStyle(type);

              return (
                <View key={item.Id} style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: style.bg }]}>
                    <Ionicons
                      name={style.icon as any}
                      size={18}
                      color={style.color}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{style.label}</Text>
                    <Text style={styles.time}>{formatDate(item.LoginTime)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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

  content: {
    padding: 20,
  },

  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },

  time: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  empty: {
    textAlign: "center",
    color: Colors.light.textSecondary,
    marginTop: 40,
  },
});
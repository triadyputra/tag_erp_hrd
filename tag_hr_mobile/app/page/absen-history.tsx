import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { getUser } from "@/helpers/token.helper";
import {
  formatAbsenDate,
  formatAbsenTime,
  getAbsenHistory,
} from "@/services/absen.service";
import type { AbsenRecord } from "@/types/absen";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function HistoryItem({ record }: { record: AbsenRecord }) {
  const isIn = record.type === "IN";

  return (
    <View style={styles.item}>
      <View
        style={[
          styles.itemIcon,
          { backgroundColor: isIn ? "#DCFCE7" : "#FEE2E2" },
        ]}
      >
        <Ionicons
          name={isIn ? "log-in-outline" : "log-out-outline"}
          size={20}
          color={isIn ? "#16A34A" : "#DC2626"}
        />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>
          {isIn ? "Presensi Masuk" : "Presensi Pulang"}
        </Text>
        <Text style={styles.itemDate}>{formatAbsenDate(record.timestamp)}</Text>
        <Text style={styles.itemMeta}>
          {formatAbsenTime(record.timestamp)} · Skor{" "}
          {Math.round(record.localScore * 100)}%
        </Text>
      </View>
      {record.verified ? (
        <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
      ) : null}
    </View>
  );
}

export default function AbsenHistoryPage() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AbsenRecord[]>([]);

  const loadHistory = useCallback(async () => {
    const user = await getUser();
    if (!user?.NIKSistag) {
      setRecords([]);
      return;
    }
    const history = await getAbsenHistory(user.NIKSistag);
    setRecords(history);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadHistory().finally(() => setLoading(false));
    }, [loadHistory]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  return (
    <View style={styles.container}>
      <AppHeader title="Riwayat Absensi" />

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
        {loading ? (
          <ActivityIndicator
            color={Colors.light.primary}
            style={{ marginTop: 40 }}
          />
        ) : records.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.emptyTitle}>Belum ada riwayat</Text>
            <Text style={styles.emptyText}>
              Riwayat presensi lokal akan muncul setelah Anda melakukan absensi
              wajah.
            </Text>
          </View>
        ) : (
          records.map((record) => (
            <HistoryItem key={record.id} record={record} />
          ))
        )}
      </ScrollView>
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
    paddingTop: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  itemDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
});

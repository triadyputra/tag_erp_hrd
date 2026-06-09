import InputField from "@/components/ui/InputField";
import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { getUser } from "@/helpers/token.helper";
import { saveCutiKaryawanMobile } from "@/services/cuti.services";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const JENIS_LIST = [
  { id: "CUTI RENCANA", label: "Cuti Rencana", icon: "calendar-outline" as const },
  { id: "CUTI PERISTIWA", label: "Cuti Peristiwa", icon: "heart-outline" as const },
];

/** Awal hari ini (lokal) — tanggal cuti tidak boleh sebelum ini. */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDateApi(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isBeforeToday(date: Date): boolean {
  const pick = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return pick < startOfToday();
}

export default function CutiFormPage() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [jenis, setJenis] = useState("CUTI RENCANA");
  const [keperluan, setKeperluan] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const minSelectableDate = useMemo(() => startOfToday(), []);

  const sortedDates = useMemo(
    () => [...selectedDates].sort((a, b) => a.localeCompare(b)),
    [selectedDates],
  );

  function formatDateDisplay(date: string) {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function addDate(date: Date) {
    const formatted = formatDateApi(date);
    if (selectedDates.includes(formatted)) {
      setSelectedDates(selectedDates.filter((d) => d !== formatted));
    } else {
      setSelectedDates([...selectedDates, formatted]);
    }
  }

  function removeDate(date: string) {
    setSelectedDates(selectedDates.filter((d) => d !== date));
  }

  async function handleSubmit() {
    try {
      if (loading) return;

      if (selectedDates.length === 0) {
        Alert.alert("Perhatian", "Pilih minimal satu tanggal cuti.");
        return;
      }

      const todayStr = formatDateApi(startOfToday());
      const hasPastDate = selectedDates.some((d) => d < todayStr);
      if (hasPastDate) {
        Alert.alert(
          "Perhatian",
          "Terdapat tanggal sebelum hari ini. Hapus tanggal tersebut lalu pilih ulang.",
        );
        return;
      }

      if (!keperluan.trim()) {
        Alert.alert("Perhatian", "Keperluan wajib diisi.");
        return;
      }

      const user = await getUser();
      const noktp = user?.NoKtp;
      if (!noktp) throw new Error("NOKTP kosong");

      setLoading(true);
      await saveCutiKaryawanMobile(noktp, jenis, keperluan.trim(), selectedDates);
      Alert.alert("Berhasil", "Pengajuan cuti berhasil dikirim.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      Alert.alert("Gagal", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Pengajuan Cuti" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        pointerEvents={loading ? "none" : "auto"}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Ringkasan */}
        <LinearGradient
          colors={["#3B82F6", "#2563EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryIconWrap}>
            <Ionicons name="airplane-outline" size={28} color="#fff" />
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>Ajukan cuti Anda</Text>
            <Text style={styles.summarySub}>
              {selectedDates.length === 0
                ? "Lengkapi formulir di bawah"
                : `${selectedDates.length} hari cuti dipilih`}
            </Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeNum}>{selectedDates.length}</Text>
            <Text style={styles.summaryBadgeLabel}>Hari</Text>
          </View>
        </LinearGradient>

        {/* Jenis cuti */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="layers-outline" size={18} color={Colors.light.primary} />
            </View>
            <Text style={styles.sectionTitle}>Jenis Cuti</Text>
          </View>

          <View style={styles.jenisRow}>
            {JENIS_LIST.map((item) => {
              const active = jenis === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.jenisChip, active && styles.jenisChipActive]}
                  onPress={() => setJenis(item.id)}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? Colors.light.primary : Colors.light.icon}
                  />
                  <Text style={[styles.jenisLabel, active && styles.jenisLabelActive]}>
                    {item.label}
                  </Text>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Tanggal */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="calendar-outline" size={18} color="#059669" />
            </View>
            <View style={styles.sectionHeadText}>
              <Text style={styles.sectionTitle}>Tanggal Cuti</Text>
              <Text style={styles.sectionHint}>Bisa pilih lebih dari satu hari</Text>
            </View>
          </View>

          <Pressable
            style={styles.addDateBtn}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="add-circle" size={22} color={Colors.light.primary} />
            <Text style={styles.addDateText}>Tambah tanggal</Text>
          </Pressable>

          {sortedDates.length === 0 ? (
            <View style={styles.emptyDates}>
              <Ionicons name="calendar-clear-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyDatesText}>Belum ada tanggal dipilih</Text>
            </View>
          ) : (
            <View style={styles.chipWrap}>
              {sortedDates.map((d) => (
                <Pressable
                  key={d}
                  style={styles.dateChip}
                  onPress={() => removeDate(d)}
                >
                  <Ionicons name="calendar" size={14} color="#1D4ED8" />
                  <Text style={styles.dateChipText}>{formatDateDisplay(d)}</Text>
                  <Ionicons name="close-circle" size={18} color="#93C5FD" />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Keperluan */}
        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="document-text-outline" size={18} color="#EA580C" />
            </View>
            <View style={styles.sectionHeadText}>
              <Text style={styles.sectionTitle}>Keperluan</Text>
              <Text style={styles.sectionHint}>Jelaskan alasan pengajuan</Text>
            </View>
          </View>

          <InputField
            icon="create-outline"
            placeholder="Contoh: acara keluarga, urusan penting..."
            value={keperluan}
            onChangeText={setKeperluan}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.charHint}>{keperluan.length} karakter</Text>
        </View>
      </ScrollView>

      {/* Tombol ajukan */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.submitWrap,
            (loading || pressed) && styles.submitPressed,
          ]}
          onPress={() => void handleSubmit()}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ["#94A3B8", "#94A3B8"] : ["#3B82F6", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.submitText}>Ajukan Cuti</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {showPicker && (
        <DateTimePicker
          value={minSelectableDate}
          mode="date"
          minimumDate={minSelectableDate}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            if (Platform.OS === "android") setShowPicker(false);
            if (event.type === "dismissed") {
              setShowPicker(false);
              return;
            }
            if (selectedDate) addDate(selectedDate);
            if (Platform.OS === "ios") setShowPicker(false);
          }}
        />
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Mengirim pengajuan...</Text>
          </View>
        </View>
      )}
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
    gap: 14,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryBody: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  summarySub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  summaryBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 52,
  },
  summaryBadgeNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  summaryBadgeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeadText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  jenisRow: {
    gap: 10,
  },
  jenisChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: "#FAFAFA",
  },
  jenisChipActive: {
    borderColor: Colors.light.primary,
    backgroundColor: "#EFF6FF",
  },
  jenisLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  jenisLabelActive: {
    color: Colors.light.primary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: Colors.light.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  addDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    backgroundColor: "#F8FAFC",
  },
  addDateText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  emptyDates: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyDatesText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
  charHint: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "right",
    marginTop: -4,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  submitWrap: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 999,
  },
  loadingBox: {
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 18,
    alignItems: "center",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
});

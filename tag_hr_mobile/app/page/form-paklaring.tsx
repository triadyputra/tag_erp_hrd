import InputField from "@/components/ui/InputField";
import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { getUser } from "@/helpers/token.helper";
import { savePacklaringMobile } from "@/services/paklaring.service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const JENIS_LIST = [
  {
    value: "KARYAWAN" as const,
    label: "Karyawan",
    desc: "Surat untuk keperluan pribadi / administrasi",
    icon: "person-outline" as const,
  },
  {
    value: "BPJS" as const,
    label: "BPJS",
    desc: "Surat untuk keperluan BPJS / ketenagakerjaan",
    icon: "shield-checkmark-outline" as const,
  },
];

export default function FormPaklaringPage() {
  const insets = useSafeAreaInsets();

  const [jenis, setJenis] = useState<"BPJS" | "KARYAWAN">("KARYAWAN");
  const [keperluan, setKeperluan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      if (submitting) return;

      if (!keperluan.trim()) {
        Alert.alert("Perhatian", "Keperluan wajib diisi.");
        return;
      }

      setSubmitting(true);

      const user = await getUser();
      const noKtp = user?.NoKtp;
      if (!noKtp) throw new Error("NOKTP kosong");

      await savePacklaringMobile({
        NoKtp: noKtp,
        Jenis: jenis,
        Keperluan: keperluan.trim(),
      });

      Alert.alert("Berhasil", "Pengajuan paklaring berhasil dikirim.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      Alert.alert("Gagal", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Pengajuan Paklaring" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        pointerEvents={submitting ? "none" : "auto"}
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
          <View style={styles.heroIconWrap}>
            <Ionicons name="document-text" size={28} color="#fff" />
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>Ajukan surat paklaring</Text>
            <Text style={styles.heroSub}>
              Pilih jenis surat dan jelaskan keperluan Anda
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: "#E0F2FE" }]}>
              <Ionicons name="layers-outline" size={18} color="#0284C7" />
            </View>
            <Text style={styles.sectionTitle}>Jenis Paklaring</Text>
          </View>

          <View style={styles.jenisCol}>
            {JENIS_LIST.map((item) => {
              const active = jenis === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[styles.jenisChip, active && styles.jenisChipActive]}
                  onPress={() => setJenis(item.value)}
                >
                  <View
                    style={[
                      styles.jenisIconWrap,
                      active && styles.jenisIconWrapActive,
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={active ? "#0284C7" : Colors.light.icon}
                    />
                  </View>
                  <View style={styles.jenisTextWrap}>
                    <Text style={[styles.jenisLabel, active && styles.jenisLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.jenisDesc}>{item.desc}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="create-outline" size={18} color="#EA580C" />
            </View>
            <View style={styles.sectionHeadText}>
              <Text style={styles.sectionTitle}>Keperluan</Text>
              <Text style={styles.sectionHint}>Contoh: pensiun, mutasi, klaim BPJS</Text>
            </View>
          </View>

          <InputField
            icon="document-text-outline"
            placeholder="Tuliskan keperluan paklaring..."
            value={keperluan}
            onChangeText={setKeperluan}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.charHint}>{keperluan.length} karakter</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.submitWrap,
            (submitting || pressed) && styles.submitPressed,
          ]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          <LinearGradient
            colors={submitting ? ["#94A3B8", "#94A3B8"] : ["#0EA5E9", "#0284C7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.submitText}>Ajukan Paklaring</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {submitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0284C7" />
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
  hero: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    lineHeight: 18,
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
  jenisCol: {
    gap: 10,
  },
  jenisChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: "#FAFAFA",
  },
  jenisChipActive: {
    borderColor: "#0EA5E9",
    backgroundColor: "#F0F9FF",
  },
  jenisIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  jenisIconWrapActive: {
    backgroundColor: "#E0F2FE",
  },
  jenisTextWrap: {
    flex: 1,
  },
  jenisLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.textSecondary,
  },
  jenisLabelActive: {
    color: "#0284C7",
  },
  jenisDesc: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 3,
    lineHeight: 15,
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
    borderColor: "#0EA5E9",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0EA5E9",
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
    shadowColor: "#0284C7",
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
});

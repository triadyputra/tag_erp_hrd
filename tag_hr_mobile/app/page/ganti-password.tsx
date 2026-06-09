import InputField from "@/components/ui/InputField";
import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { changePassword } from "@/services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function RequirementRow({
  ok,
  label,
  error,
}: {
  ok: boolean;
  label: string;
  error?: boolean;
}) {
  const iconName = ok ? "checkmark-circle" : error ? "close-circle" : "ellipse-outline";
  const iconColor = ok ? "#22C55E" : error ? "#EF4444" : "#CBD5E1";

  return (
    <View style={styles.reqRow}>
      <Ionicons name={iconName} size={18} color={iconColor} />
      <Text
        style={[
          styles.reqText,
          ok && styles.reqTextOk,
          error && styles.reqTextError,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function GantiPasswordPage() {
  const insets = useSafeAreaInsets();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;

  const hasMinLength = newPassword.length >= 6;
  const hasMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const allFilled =
    oldPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0;
  const canSubmit = allFilled && hasMinLength && hasMatch && !loading;

  const strength = useMemo(() => {
    if (newPassword.length < 6) return 1;
    if (newPassword.length < 10) return 2;
    return 3;
  }, [newPassword]);

  const strengthMeta = useMemo(() => {
    if (strength === 1) return { label: "Lemah", color: "#EF4444", pct: 33 };
    if (strength === 2) return { label: "Sedang", color: "#F59E0B", pct: 66 };
    return { label: "Kuat", color: "#22C55E", pct: 100 };
  }, [strength]);

  const showFieldError = touched && !allFilled;
  const showLengthError = touched && newPassword.length > 0 && !hasMinLength;
  const showMatchError =
    touched && confirmPassword.length > 0 && !hasMatch;

  function animateError() {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function validate() {
    setTouched(true);
    if (!allFilled || !hasMinLength || !hasMatch) {
      animateError();
      return false;
    }
    return true;
  }

  function handleSave() {
    if (!validate()) return;

    setLoading(true);
    changePassword(oldPassword, newPassword, confirmPassword)
      .then(() => {
        Alert.alert("Berhasil", "Password berhasil diubah.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Gagal mengubah password";
        Alert.alert("Gagal", msg);
      })
      .finally(() => setLoading(false));
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Ganti Password" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        pointerEvents={loading ? "none" : "auto"}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
      >
        <LinearGradient
          colors={["#1D4ED8", "#3B82F6", "#60A5FA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark" size={30} color="#fff" />
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>Keamanan akun</Text>
            <Text style={styles.heroSub}>
              Perbarui password secara berkala dan jangan bagikan ke siapa pun.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHead}>
            <Ionicons name="bulb-outline" size={18} color="#D97706" />
            <Text style={styles.tipsTitle}>Tips password aman</Text>
          </View>
          <Text style={styles.tipItem}>• Kombinasi huruf, angka, dan simbol</Text>
          <Text style={styles.tipItem}>• Hindari tanggal lahir atau NIK</Text>
          <Text style={styles.tipItem}>• Jangan sama dengan password lama</Text>
        </View>

        <Animated.View style={{ transform: [{ translateX: shake }] }}>
          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: "#F1F5F9" }]}>
                <Ionicons name="key-outline" size={18} color="#64748B" />
              </View>
              <View style={styles.sectionHeadText}>
                <Text style={styles.sectionTitle}>Password Lama</Text>
                <Text style={styles.sectionHint}>Verifikasi identitas Anda</Text>
              </View>
            </View>
            <InputField
              icon="lock-closed-outline"
              placeholder="Masukkan password lama"
              secure
              value={oldPassword}
              onChangeText={setOldPassword}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="lock-open-outline" size={18} color={Colors.light.primary} />
              </View>
              <View style={styles.sectionHeadText}>
                <Text style={styles.sectionTitle}>Password Baru</Text>
                <Text style={styles.sectionHint}>Minimal 6 karakter</Text>
              </View>
            </View>

            <InputField
              icon="lock-closed-outline"
              placeholder="Masukkan password baru"
              secure
              value={newPassword}
              onChangeText={setNewPassword}
            />

            {newPassword.length > 0 ? (
              <View style={styles.strengthBlock}>
                <View style={styles.strengthTrack}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${strengthMeta.pct}%`,
                        backgroundColor: strengthMeta.color,
                      },
                    ]}
                  />
                </View>
                <View style={styles.strengthLabelRow}>
                  <Text style={styles.strengthCaption}>Kekuatan password</Text>
                  <View
                    style={[
                      styles.strengthBadge,
                      { backgroundColor: `${strengthMeta.color}18` },
                    ]}
                  >
                    <Text
                      style={[styles.strengthBadgeText, { color: strengthMeta.color }]}
                    >
                      {strengthMeta.label}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="checkmark-done-outline" size={18} color="#059669" />
              </View>
              <View style={styles.sectionHeadText}>
                <Text style={styles.sectionTitle}>Konfirmasi Password</Text>
                <Text style={styles.sectionHint}>Ulangi password baru</Text>
              </View>
            </View>

            <InputField
              icon="lock-closed-outline"
              placeholder="Konfirmasi password baru"
              secure
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>Persyaratan</Text>
            <RequirementRow
              ok={allFilled}
              label="Semua field terisi"
              error={showFieldError}
            />
            <RequirementRow
              ok={hasMinLength}
              label="Password baru minimal 6 karakter"
              error={showLengthError}
            />
            <RequirementRow
              ok={hasMatch}
              label="Konfirmasi password cocok"
              error={showMatchError}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.submitWrap,
            (!canSubmit || pressed) && styles.submitPressed,
          ]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          <LinearGradient
            colors={
              !canSubmit
                ? ["#94A3B8", "#94A3B8"]
                : ["#3B82F6", "#2563EB"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>Simpan Password</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <Text style={styles.footerHint}>
          Setelah disimpan, gunakan password baru saat login berikutnya.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Menyimpan password...</Text>
          </View>
        </View>
      ) : null}
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
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    overflow: "hidden",
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  heroGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -30,
    right: -20,
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
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    marginTop: 4,
    lineHeight: 19,
  },
  tipsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 6,
  },
  tipsHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
  },
  tipItem: {
    fontSize: 12,
    color: "#A16207",
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
    marginBottom: 14,
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
    minWidth: 0,
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
  strengthBlock: {
    marginTop: 12,
    gap: 8,
  },
  strengthTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 8,
  },
  strengthLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  strengthCaption: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  strengthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  strengthBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  checklistCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 2,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reqText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  reqTextOk: {
    color: "#15803D",
    fontWeight: "600",
  },
  reqTextError: {
    color: "#DC2626",
    fontWeight: "600",
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
    shadowOpacity: 0.28,
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
  footerHint: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 16,
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

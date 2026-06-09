import InputField from "@/components/ui/InputField";
import AppHeader from "@/components/ui/PageHeader";
import { Colors } from "@/constants/theme";
import { getUser } from "@/helpers/token.helper";
import { clearFaceEmbedding } from "@/lib/face/enrollment-cache";
import { validateProfilePhotoForEnrollment } from "@/lib/face/profile-photo";
import { updatePhoto } from "@/services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const profilePhotoPickerOptions = {
  cropping: true,
  freeStyleCropEnabled: true,
  cropperCircleOverlay: false,
  enableRotationGesture: true,
  compressImageMaxWidth: 1024,
  compressImageMaxHeight: 1024,
  compressImageQuality: 0.85,
  mediaType: "photo" as const,
};

function resolveAvatarSource(photo: string | null | undefined) {
  const raw = typeof photo === "string" ? photo.trim() : "";
  if (!raw || raw.toLowerCase() === "null") {
    return require("@/assets/images/avatar.png");
  }
  if (
    raw.startsWith("/") ||
    raw.startsWith("file://") ||
    raw.startsWith("http") ||
    raw.startsWith("data:image/")
  ) {
    return { uri: raw.startsWith("/") ? `file://${raw}` : raw };
  }
  return { uri: `data:image/jpeg;base64,${raw}` };
}

function ReadonlyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <InputField
        icon={icon}
        placeholder={label}
        value={value}
        editable={false}
      />
    </View>
  );
}

export default function EditProfilePage() {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [niksistag, setNiksistag] = useState("");
  const [divisi, setDivisi] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const user = await getUser();
      if (!user) return;

      setName(typeof user.Nama === "string" ? user.Nama : "");
      setNiksistag(typeof user.NIKSistag === "string" ? user.NIKSistag : "");
      setDivisi(typeof user.Divisi === "string" ? user.Divisi : "");
      setEmail(typeof user.Email === "string" ? user.Email : "");
      setPhoto(typeof user.Photo === "string" ? user.Photo : null);
      setPhotoChanged(false);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const avatarSource = useMemo(() => resolveAvatarSource(photo), [photo]);
  const canSave = photoChanged && Boolean(photo) && !saving;

  const handleTakePhoto = async () => {
    setPickerVisible(false);
    try {
      const image = await ImagePicker.openCamera(profilePhotoPickerOptions);
      setPhoto(image.path);
      setPhotoChanged(true);
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      if (code === "E_PERMISSION_MISSING" || code === "E_PICKER_CANCELLED") return;
      Alert.alert("Gagal", "Tidak dapat mengambil foto dari kamera.");
    }
  };

  const handlePickGallery = async () => {
    setPickerVisible(false);
    try {
      const image = await ImagePicker.openPicker(profilePhotoPickerOptions);
      setPhoto(image.path);
      setPhotoChanged(true);
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      if (code === "E_PICKER_CANCELLED") return;
      Alert.alert("Gagal", "Tidak dapat memilih foto dari galeri.");
    }
  };

  const handleSave = async () => {
    if (!photoChanged) {
      Alert.alert("Info", "Belum ada perubahan foto profil.");
      return;
    }
    if (!photo) {
      Alert.alert("Perhatian", "Foto profil tidak boleh kosong.");
      return;
    }

    setSaving(true);
    try {
      const path = photo.startsWith("file://") ? photo : photo;
      const base64 = await FileSystem.readAsStringAsync(path, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const photoBase64 = `data:image/jpeg;base64,${base64}`;

      const validation = await validateProfilePhotoForEnrollment(photoBase64);
      if (!validation.valid) {
        Alert.alert("Foto tidak valid", validation.message);
        return;
      }

      await updatePhoto(photoBase64);
      await clearFaceEmbedding();

      const user = await getUser();
      if (user) {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({ ...user, Photo: photoBase64 }),
        );
      }

      Alert.alert("Berhasil", "Foto profil berhasil diperbarui.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengubah foto profil";
      Alert.alert("Gagal", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <AppHeader title="Edit Profil" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          pointerEvents={saving ? "none" : "auto"}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 120 },
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
              <Ionicons name="person-circle-outline" size={28} color="#fff" />
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroTitle}>Profil karyawan</Text>
              <Text style={styles.heroSub}>
                Data di bawah dari sistem HR. Anda dapat memperbarui foto profil.
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.photoCard}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="camera-outline" size={18} color={Colors.light.primary} />
              </View>
              <View style={styles.sectionHeadText}>
                <Text style={styles.sectionTitle}>Foto Profil</Text>
                <Text style={styles.sectionHint}>
                  Selfie frontal untuk verifikasi absensi
                </Text>
              </View>
              {photoChanged ? (
                <View style={styles.changedBadge}>
                  <Text style={styles.changedBadgeText}>Baru</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.avatarPress,
                pressed && styles.avatarPressPressed,
              ]}
              onPress={() => setPickerVisible(true)}
            >
              <LinearGradient
                colors={["#3B82F6", "#60A5FA", "#93C5FD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                {loadingProfile ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator color={Colors.light.primary} />
                  </View>
                ) : (
                  <Image source={avatarSource} style={styles.avatar} />
                )}
              </LinearGradient>

              <View style={styles.cameraFab}>
                <LinearGradient
                  colors={["#2563EB", "#1D4ED8"]}
                  style={styles.cameraFabGrad}
                >
                  <Ionicons name="camera" size={18} color="#fff" />
                </LinearGradient>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.changePhotoBtn,
                pressed && { opacity: 0.88 },
              ]}
              onPress={() => setPickerVisible(true)}
            >
              <Ionicons name="images-outline" size={18} color={Colors.light.primary} />
              <Text style={styles.changePhotoText}>Ganti foto profil</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionIcon, { backgroundColor: "#F1F5F9" }]}>
                <Ionicons name="id-card-outline" size={18} color="#64748B" />
              </View>
              <View style={styles.sectionHeadText}>
                <Text style={styles.sectionTitle}>Data Karyawan</Text>
                <Text style={styles.sectionHint}>Informasi dari sistem (tidak dapat diedit)</Text>
              </View>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={12} color="#64748B" />
              </View>
            </View>

            <ReadonlyField label="NIK SISTAG" value={niksistag || "-"} icon="card-outline" />
            <ReadonlyField label="Nama Lengkap" value={name || "-"} icon="person-outline" />
            <ReadonlyField label="Divisi" value={divisi || "-"} icon="business-outline" />
            {email ? (
              <ReadonlyField label="Email" value={email} icon="mail-outline" />
            ) : null}
          </View>

          <View style={styles.faceTipsCard}>
            <Ionicons name="scan-outline" size={20} color="#16A34A" />
            <View style={styles.faceTipsBody}>
              <Text style={styles.faceTipsTitle}>Panduan foto untuk absensi wajah</Text>
              <Text style={styles.faceTipsText}>
                • Gunakan selfie frontal (bukan foto grup atau dari layar){"\n"}
                • Wajah menghadap kamera, mata terbuka, pencahayaan cukup{"\n"}
                • Setelah ganti foto, cache verifikasi otomatis diperbarui
              </Text>
            </View>
          </View>

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
            <Text style={styles.noteText}>
              Perubahan nama, NIK, atau divisi harus melalui bagian HR. Di aplikasi ini hanya
              foto profil yang dapat diperbarui.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={({ pressed }) => [
              styles.submitWrap,
              (!canSave || pressed) && styles.submitPressed,
            ]}
            onPress={() => void handleSave()}
            disabled={!canSave}
          >
            <LinearGradient
              colors={!canSave ? ["#94A3B8", "#94A3B8"] : ["#3B82F6", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={styles.submitText}>Simpan Foto Profil</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={styles.footerHint}>
            {photoChanged
              ? "Foto siap diunggah — ketuk simpan untuk menyimpan."
              : "Ubah foto terlebih dahulu untuk mengaktifkan tombol simpan."}
          </Text>
        </View>

        {saving ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Mengunggah foto...</Text>
            </View>
          </View>
        ) : null}
      </View>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalIconWrap}>
              <LinearGradient
                colors={["#EFF6FF", "#DBEAFE"]}
                style={styles.modalIconGrad}
              >
                <Ionicons name="images" size={28} color={Colors.light.primary} />
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>Ganti foto profil</Text>
            <Text style={styles.modalSub}>Pilih sumber foto. Anda dapat memotong setelah memilih.</Text>

            <Pressable
              style={({ pressed }) => [
                styles.pickerOption,
                pressed && styles.pickerOptionPressed,
              ]}
              onPress={() => void handleTakePhoto()}
            >
              <View style={[styles.pickerIconBox, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="camera" size={22} color="#059669" />
              </View>
              <View style={styles.pickerTextWrap}>
                <Text style={styles.pickerOptionTitle}>Ambil dari kamera</Text>
                <Text style={styles.pickerOptionSub}>Foto langsung dari perangkat</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.pickerOption,
                pressed && styles.pickerOptionPressed,
              ]}
              onPress={() => void handlePickGallery()}
            >
              <View style={[styles.pickerIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="image" size={22} color={Colors.light.primary} />
              </View>
              <View style={styles.pickerTextWrap}>
                <Text style={styles.pickerOptionTitle}>Pilih dari galeri</Text>
                <Text style={styles.pickerOptionSub}>Gunakan foto yang sudah ada</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modalCancel, pressed && { opacity: 0.85 }]}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Batal</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -24,
    right: -16,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    marginTop: 4,
    lineHeight: 19,
  },
  photoCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
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
    width: "100%",
    marginBottom: 16,
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
  changedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },
  avatarPress: {
    position: "relative",
    marginBottom: 14,
  },
  avatarPressPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  avatarRing: {
    padding: 4,
    borderRadius: 64,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E2E8F0",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  cameraFab: {
    position: "absolute",
    right: 4,
    bottom: 4,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
  },
  cameraFabGrad: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFC",
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.primary,
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
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldBlock: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  faceTipsCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 12,
  },
  faceTipsBody: {
    flex: 1,
  },
  faceTipsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 4,
  },
  faceTipsText: {
    fontSize: 12,
    color: "#15803D",
    lineHeight: 18,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 18,
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalIconWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  modalIconGrad: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.light.text,
    textAlign: "center",
  },
  modalSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 19,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  pickerOptionPressed: {
    backgroundColor: "#F1F5F9",
  },
  pickerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  pickerOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  pickerOptionSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },
});

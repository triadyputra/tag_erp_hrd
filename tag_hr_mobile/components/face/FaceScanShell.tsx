import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ShellProps = {
  children?: ReactNode;
};

export function FaceScanShell({ children }: ShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={["#020617", "#0F172A", "#1E293B", "#0F172A"]}
      locations={[0, 0.35, 0.7, 1]}
      style={[styles.shell, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <View style={styles.shellGlow} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
}

type PermissionProps = {
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  onCancel: () => void;
};

export function FaceScanPermission({
  title,
  message,
  primaryLabel,
  onPrimary,
  onCancel,
}: PermissionProps) {
  return (
    <FaceScanShell>
      <View style={styles.centered}>
        <View style={styles.card}>
          <LinearGradient
            colors={["rgba(59,130,246,0.2)", "rgba(59,130,246,0.05)"]}
            style={styles.iconCircle}
          >
            <Ionicons name="camera" size={32} color="#93C5FD" />
          </LinearGradient>
          <Text style={styles.eyebrow}>Izin Diperlukan</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.primaryBtn} onPress={onPrimary}>
            <LinearGradient
              colors={[Colors.light.primary, "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              <Ionicons name="camera" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onCancel}>
            <Text style={styles.secondaryBtnText}>Batal</Text>
          </Pressable>
        </View>
      </View>
    </FaceScanShell>
  );
}

type LoadingProps = {
  title: string;
  message: string;
  hint?: string;
  progress?: number | null;
};

export function FaceScanLoading({
  title,
  message,
  hint,
  progress,
}: LoadingProps) {
  const pct = progress != null ? Math.min(100, Math.max(0, progress)) : null;

  return (
    <FaceScanShell>
      <View style={styles.centered}>
        <View style={styles.card}>
          <View style={styles.loadingIconWrap}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
          <Text style={styles.eyebrow}>Menyiapkan Verifikasi</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {pct != null && pct < 100 ? (
            <View style={styles.loadingProgressWrap}>
              <View style={styles.loadingProgressTrack}>
                <View style={[styles.loadingProgressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.loadingPct}>Mengunduh model AI · {pct}%</Text>
            </View>
          ) : null}
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
      </View>
    </FaceScanShell>
  );
}

type ErrorProps = {
  title: string;
  message: string;
  onRetry: () => void;
  onBack: () => void;
};

export function FaceScanError({ title, message, onRetry, onBack }: ErrorProps) {
  return (
    <FaceScanShell>
      <View style={styles.centered}>
        <View style={styles.card}>
          <LinearGradient
            colors={["rgba(248,113,113,0.2)", "rgba(248,113,113,0.05)"]}
            style={[styles.iconCircle, styles.iconCircleError]}
          >
            <Ionicons name="alert-circle-outline" size={32} color="#FCA5A5" />
          </LinearGradient>
          <Text style={[styles.eyebrow, styles.eyebrowError]}>Verifikasi Gagal</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.primaryBtn} onPress={onRetry}>
            <LinearGradient
              colors={[Colors.light.primary, "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Coba Lagi</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onBack}>
            <Text style={styles.secondaryBtnText}>Kembali</Text>
          </Pressable>
        </View>
      </View>
    </FaceScanShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  shellGlow: {
    position: "absolute",
    top: "18%",
    alignSelf: "center",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(59,130,246,0.08)",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  iconCircleError: {
    borderColor: "rgba(248,113,113,0.2)",
  },
  loadingIconWrap: {
    height: 72,
    justifyContent: "center",
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#93C5FD",
  },
  eyebrowError: {
    color: "#FCA5A5",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "rgba(248,250,252,0.68)",
    textAlign: "center",
    lineHeight: 21,
  },
  hint: {
    fontSize: 12,
    color: "rgba(248,250,252,0.45)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  loadingProgressWrap: {
    width: "100%",
    gap: 8,
    marginTop: 8,
  },
  loadingProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  loadingProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  loadingPct: {
    color: "rgba(248,250,252,0.55)",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  primaryBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 12,
  },
  primaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryBtn: {
    paddingVertical: 12,
    marginTop: 2,
  },
  secondaryBtnText: {
    color: "#93C5FD",
    fontWeight: "600",
    fontSize: 15,
  },
});

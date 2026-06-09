import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScanPhase = "preparing" | "aligning" | "ready" | "processing" | "paused";

type Props = {
  windowWidth: number;
  windowHeight: number;
  statusMessage: string;
  livenessOk: boolean;
  blinkOk?: boolean;
  isProcessing: boolean;
  cameraReady: boolean;
  autoCapturePaused: boolean;
  captureCount: number;
  title?: string;
  subtitle?: string;
  onCancel: () => void;
  onRetry?: () => void;
};

const OVAL_RATIO = 1.28;

const STEPS = [
  { key: "camera", label: "Kamera" },
  { key: "blink", label: "Kedip" },
  { key: "verify", label: "Verifikasi" },
] as const;

function getPhase(
  cameraReady: boolean,
  isProcessing: boolean,
  autoCapturePaused: boolean,
  blinkOk: boolean,
  livenessOk: boolean,
): ScanPhase {
  if (autoCapturePaused) return "paused";
  if (isProcessing) return "processing";
  if (!cameraReady) return "preparing";
  if (!blinkOk || !livenessOk) return "aligning";
  return "ready";
}

const PHASE_META: Record<
  ScanPhase,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  preparing: { label: "Menyiapkan kamera", icon: "camera-outline", color: "#94A3B8" },
  aligning: { label: "Ikuti panduan", icon: "scan-outline", color: "#FBBF24" },
  ready: { label: "Siap verifikasi", icon: "checkmark-circle", color: "#34D399" },
  processing: { label: "Memverifikasi identitas", icon: "shield-checkmark", color: "#60A5FA" },
  paused: { label: "Verifikasi gagal", icon: "alert-circle", color: "#F87171" },
};

function StepPill({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <View
      style={[
        styles.stepPill,
        done && styles.stepPillDone,
        active && !done && styles.stepPillActive,
      ]}
    >
      {done ? (
        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
      ) : (
        <View style={[styles.stepDot, active && styles.stepDotActive]} />
      )}
      <Text
        style={[
          styles.stepPillText,
          done && styles.stepPillTextDone,
          active && !done && styles.stepPillTextActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function FaceScannerOverlay({
  windowWidth,
  windowHeight,
  statusMessage,
  livenessOk,
  blinkOk = false,
  isProcessing,
  cameraReady,
  autoCapturePaused,
  captureCount,
  title = "Verifikasi Wajah",
  subtitle = "Pastikan wajah Anda terlihat jelas",
  onCancel,
  onRetry,
}: Props) {
  const insets = useSafeAreaInsets();
  const phase = getPhase(
    cameraReady,
    isProcessing,
    autoCapturePaused,
    blinkOk,
    livenessOk,
  );
  const phaseMeta = PHASE_META[phase];

  const ovalWidth = Math.min(windowWidth * 0.72, 280);
  const ovalHeight = ovalWidth * OVAL_RATIO;
  const ovalLeft = (windowWidth - ovalWidth) / 2;
  const ovalTop = windowHeight * 0.2;

  const ringPulse = useSharedValue(1);
  const scanLineY = useSharedValue(0.15);
  const progressWidth = useSharedValue(0.08);

  const step1Done = cameraReady;
  const step2Done = blinkOk;
  const step3Done = livenessOk || isProcessing || captureCount > 0;
  const step1Active = !step1Done;
  const step2Active = step1Done && !step2Done;
  const step3Active = step2Done && !step3Done;

  const targetProgress =
    phase === "processing"
      ? 0.92
      : livenessOk
        ? 0.78
        : blinkOk
          ? 0.58
          : cameraReady
            ? 0.35
            : 0.1;

  useEffect(() => {
    progressWidth.value = withTiming(targetProgress, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress, progressWidth]);

  useEffect(() => {
    if (phase === "ready") {
      ringPulse.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      return;
    }
    ringPulse.value = withTiming(1, { duration: 200 });
  }, [phase, ringPulse]);

  useEffect(() => {
    if (phase === "processing") {
      scanLineY.value = withRepeat(
        withSequence(
          withTiming(0.82, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.12, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      return;
    }
    scanLineY.value = 0.42;
  }, [phase, scanLineY]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringPulse.value }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanLineY.value * 100}%`,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const ringColor =
    phase === "ready"
      ? "#34D399"
      : phase === "processing"
        ? "#60A5FA"
        : phase === "paused"
          ? "#F87171"
          : blinkOk
            ? "#A78BFA"
            : "rgba(255,255,255,0.5)";

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.maskPanel, { top: 0, left: 0, right: 0, height: ovalTop }]} />
        <View
          style={[
            styles.maskPanel,
            { top: ovalTop + ovalHeight, left: 0, right: 0, bottom: 0 },
          ]}
        />
        <View
          style={[
            styles.maskPanel,
            { top: ovalTop, left: 0, width: ovalLeft, height: ovalHeight },
          ]}
        />
        <View
          style={[
            styles.maskPanel,
            {
              top: ovalTop,
              left: ovalLeft + ovalWidth,
              right: 0,
              height: ovalHeight,
            },
          ]}
        />
      </View>

      <LinearGradient
        colors={["rgba(2,6,23,0.95)", "rgba(15,23,42,0.4)", "transparent"]}
        style={[styles.headerGradient, { paddingTop: insets.top + 6 }]}
        pointerEvents="box-none"
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onCancel} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="close" size={20} color="#F8FAFC" />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#34D399" />
              <Text style={styles.secureBadgeText}>Verifikasi Aman</Text>
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
          <View style={styles.headerBtnPlaceholder} />
        </View>
      </LinearGradient>

      <Text
        style={[styles.guideLabel, { top: ovalTop - 28 }]}
        pointerEvents="none"
      >
        Posisikan wajah dalam bingkai
      </Text>

      <View
        style={[
          styles.ovalWrap,
          { top: ovalTop, left: ovalLeft, width: ovalWidth, height: ovalHeight },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.ovalRingOuter,
            ringStyle,
            { borderColor: ringColor, shadowColor: ringColor },
            phase === "ready" && styles.ovalRingGlow,
          ]}
        />
        <View style={styles.ovalRingInner} />
        <View style={[styles.cornerTL, { borderColor: ringColor }]} />
        <View style={[styles.cornerTR, { borderColor: ringColor }]} />
        <View style={[styles.cornerBL, { borderColor: ringColor }]} />
        <View style={[styles.cornerBR, { borderColor: ringColor }]} />
        {phase === "processing" ? (
          <View style={styles.scanLineWrap}>
            <Animated.View style={[styles.scanLine, scanLineStyle]} />
            <Animated.View style={[styles.scanLineGlow, scanLineStyle]} />
          </View>
        ) : null}
      </View>

      <LinearGradient
        colors={["transparent", "rgba(2,6,23,0.55)", "rgba(2,6,23,0.97)"]}
        style={[styles.footerGradient, { paddingBottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        <View style={styles.stepsRow}>
          <StepPill label={STEPS[0].label} done={step1Done} active={step1Active} />
          <View style={[styles.stepConnector, step1Done && styles.stepConnectorDone]} />
          <StepPill label={STEPS[1].label} done={step2Done} active={step2Active} />
          <View style={[styles.stepConnector, step2Done && styles.stepConnectorDone]} />
          <StepPill label={STEPS[2].label} done={step3Done} active={step3Active} />
        </View>

        <View style={styles.statusCard}>
          <View style={styles.phaseBadge}>
            <LinearGradient
              colors={[`${phaseMeta.color}33`, `${phaseMeta.color}11`]}
              style={styles.phaseIconWrap}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={phaseMeta.color} />
              ) : (
                <Ionicons name={phaseMeta.icon} size={20} color={phaseMeta.color} />
              )}
            </LinearGradient>
            <View style={styles.phaseTextWrap}>
              <Text style={styles.phaseLabel}>{phaseMeta.label}</Text>
              <Text style={styles.statusMessage} numberOfLines={2}>
                {statusMessage}
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
            <Text style={styles.progressPct}>
              {Math.round(targetProgress * 100)}%
            </Text>
          </View>

          <View style={styles.tipsRow}>
            <View style={styles.tipChip}>
              <Ionicons
                name={cameraReady ? "checkmark-circle" : "ellipse-outline"}
                size={14}
                color={cameraReady ? "#34D399" : "rgba(255,255,255,0.35)"}
              />
              <Text style={[styles.tipChipText, cameraReady && styles.tipChipTextOk]}>
                Pencahayaan cukup
              </Text>
            </View>
            <View style={styles.tipChip}>
              <Ionicons
                name={blinkOk ? "checkmark-circle" : "ellipse-outline"}
                size={14}
                color={blinkOk ? "#34D399" : "rgba(255,255,255,0.35)"}
              />
              <Text style={[styles.tipChipText, blinkOk && styles.tipChipTextOk]}>
                Kedip natural
              </Text>
            </View>
          </View>

          {autoCapturePaused && onRetry ? (
            <Pressable style={styles.retryBtn} onPress={onRetry}>
              <LinearGradient
                colors={[Colors.light.primary, "#2563EB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryBtnGrad}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryBtnText}>Coba Lagi</Text>
              </LinearGradient>
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const cornerBase: ViewStyle = {
  position: "absolute",
  width: 32,
  height: 32,
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  maskPanel: {
    position: "absolute",
    backgroundColor: "rgba(2,6,23,0.78)",
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnPlaceholder: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52,211,153,0.12)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 2,
  },
  secureBadgeText: {
    color: "#6EE7B7",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: "rgba(248,250,252,0.65)",
    fontSize: 13,
  },
  guideLabel: {
    position: "absolute",
    alignSelf: "center",
    color: "rgba(248,250,252,0.55)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    width: "100%",
    textAlign: "center",
  },
  ovalWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ovalRingOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  ovalRingGlow: {
    shadowOpacity: 0.55,
    shadowRadius: 20,
  },
  ovalRingInner: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
  },
  cornerTL: {
    ...cornerBase,
    top: 4,
    left: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    ...cornerBase,
    top: 4,
    right: 4,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    ...cornerBase,
    bottom: 4,
    left: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    ...cornerBase,
    bottom: 4,
    right: 4,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 18,
  },
  scanLineWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 999,
  },
  scanLine: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: "#93C5FD",
  },
  scanLineGlow: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 14,
    marginTop: -6,
    backgroundColor: "rgba(96,165,250,0.18)",
    borderRadius: 8,
  },
  footerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 14,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  stepPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepPillActive: {
    backgroundColor: "rgba(59,130,246,0.18)",
    borderColor: "rgba(96,165,250,0.35)",
  },
  stepPillDone: {
    backgroundColor: "rgba(52,211,153,0.15)",
    borderColor: "rgba(52,211,153,0.3)",
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  stepDotActive: {
    backgroundColor: "#60A5FA",
  },
  stepPillText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "600",
  },
  stepPillTextActive: {
    color: "#BFDBFE",
  },
  stepPillTextDone: {
    color: "#A7F3D0",
  },
  stepConnector: {
    width: 16,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  stepConnectorDone: {
    backgroundColor: "rgba(52,211,153,0.45)",
  },
  statusCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(15,23,42,0.9)",
    overflow: "hidden",
    padding: 18,
    gap: 14,
  },
  phaseBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  phaseIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  phaseTextWrap: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  phaseLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  statusMessage: {
    color: "rgba(248,250,252,0.72)",
    fontSize: 13,
    lineHeight: 19,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  progressPct: {
    color: "rgba(248,250,252,0.55)",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 32,
    textAlign: "right",
  },
  tipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tipChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tipChipText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "500",
  },
  tipChipTextOk: {
    color: "rgba(255,255,255,0.85)",
  },
  retryBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  retryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

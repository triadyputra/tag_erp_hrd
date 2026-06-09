import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ApiEnvironmentStatus from "@/components/ui/ApiEnvironmentStatus";
import InputField from "@/components/ui/InputField";
import { getAppVersionLabel } from "@/constants/app-version";
import { Colors } from "@/constants/theme";
import { setAuthToken } from "@/helpers/token.helper";
import { login } from "@/services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  //3201381809860001
  //0000000273
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  async function handleLogin() {
    console.log("LOGIN START");

    if (!username || !password) {
      Alert.alert("Error", "Username dan password wajib diisi");
      return;
    }

    try {
      setLoading(true);

      const res = await login(username, password);

      console.log("RESPONSE LOGIN:", res);

      if (!res?.Data?.Token) {
        throw new Error("Login gagal");
      }

      // simpan token
      await setAuthToken(
        res.Data.Token,
        res.Data.RefreshToken,
        res.Data.ExpiredAt,
      );

      // simpan user
      await AsyncStorage.setItem("user", JSON.stringify(res.Data.User));

      // pindah ke tabs
      router.replace("/(tabs)");
    } catch (err: any) {
      console.log("LOGIN ERROR:", err);
      Alert.alert("Login gagal", err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={[Colors.light.primary, "#60A5FA", Colors.light.background]}
      locations={[0, 0.6, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <Image
                source={require("@/assets/images/tag_icon.png")}
                style={styles.logo}
              />
            </View>
            <Text style={styles.title}>TAG Employee App</Text>
            <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>
          </View>

          <View style={styles.card}>
            {/* USERNAME */}
            <InputField
              icon="person-outline"
              placeholder="No KTP / Username"
              value={username}
              onChangeText={setUsername}
            />

            {/* PASSWORD */}
            <InputField
              icon="lock-closed-outline"
              placeholder="Password"
              secure
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.rowBetween}>
              <View />
              <TouchableOpacity
                onPress={() => router.push("/auth/forgot-password")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  loading
                    ? ["#93C5FD", "#60A5FA"]
                    : [Colors.light.primary, "#60A5FA"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginBtnInner}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footerMeta}>
            <Text style={styles.versionLabel}>{getAppVersionLabel()}</Text>
            <ApiEnvironmentStatus />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexGrow: 1,
    justifyContent: "center",
  },

  brandRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logo: {
    width: 46,
    height: 46,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#0B1220",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  forgot: {
    color: Colors.light.primary,
    fontWeight: "700",
  },

  loginBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  loginBtnInner: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  loginText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  footerMeta: {
    marginTop: 16,
    alignItems: "center",
    gap: 2,
  },
  versionLabel: {
    textAlign: "center",
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.3,
  },

  loginBtnDisabled: {
    opacity: 0.85,
  },
});

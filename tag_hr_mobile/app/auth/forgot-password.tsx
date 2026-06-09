import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import InputField from "@/components/ui/InputField";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    alert("Reset instructions sent to your email.");
    router.back();
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/tag_icon.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive reset instructions
      </Text>

      {/* EMAIL INPUT */}
      <InputField
        icon="mail-outline"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
      />

      {/* BUTTON */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Send Reset Link</Text>
      </TouchableOpacity>

      {/* BACK */}
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    justifyContent: "center",
    padding: 30,
  },

  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 30,
  },

  submitBtn: {
    backgroundColor: "#2F80ED",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },

  back: {
    textAlign: "center",
    marginTop: 25,
    color: "#2F80ED",
  },
});

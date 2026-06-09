import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

export default function Splash() {
  useEffect(() => {
    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      router.replace("/auth/login");
    };

    run();
  }, []);

  return (
    <LinearGradient
      colors={["#5EA2FF", "#3B82F6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require("../assets/images/tag_icon.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>TAG Employee App</Text>
        <Text style={styles.subtitle}>HR Management System</Text>

        <ActivityIndicator
          size="small"
          color="#fff"
          style={{ marginTop: 20 }}
        />
      </View>

      <Text style={styles.footer}>Powered by TAG</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    alignItems: "center",
  },

  logo: {
    width: 140,
    height: 140,
    resizeMode: "contain",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 14,
    color: "#E5E7EB",
    marginTop: 5,
  },

  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 12,
    color: "#E5E7EB",
  },
});

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";

import { Colors } from "@/constants/theme";
import { AppUpdateChecker } from "@/components/app-update/AppUpdateChecker";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function setNavBar() {
      await NavigationBar.setPositionAsync("relative");
      await NavigationBar.setBackgroundColorAsync(Colors.light.primary);
      await NavigationBar.setButtonStyleAsync("dark"); // icon hitam
    }

    setNavBar();
  }, []);

  return (
    <SafeAreaProvider>
      <LayoutContent colorScheme={colorScheme} />
    </SafeAreaProvider>
  );
}

function LayoutContent({ colorScheme }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />

        <AppUpdateChecker />

        <StatusBar style="dark" backgroundColor={Colors.light.background} />

        {/* SAFE AREA BOTTOM GLOBAL */}
        <View
          style={{
            height: insets.bottom,
            backgroundColor: Colors.light.background,
          }}
        />
      </ThemeProvider>
    </View>
  );
}

import { getApiEnvironmentList } from "@/constants/api";
import { StyleSheet, Text, View } from "react-native";

export default function ApiEnvironmentStatus() {
  const environments = getApiEnvironmentList();
  const hasNonProduction = environments.some((item) => !item.isProduction);

  return (
    <View style={styles.wrap}>
      {hasNonProduction ? (
        <Text style={styles.caption}>Mode pengujian aktif</Text>
      ) : null}

      <View style={styles.row}>
        {environments.map((item) => (
          <View
            key={item.key}
            style={[
              styles.badge,
              item.isProduction ? styles.badgeProduction : styles.badgeDummy,
            ]}
          >
            <View
              style={[
                styles.dot,
                item.isProduction ? styles.dotProduction : styles.dotDummy,
              ]}
            />
            <View style={styles.badgeText}>
              <Text style={styles.badgeTitle}>{item.title}</Text>
              <Text
                style={[
                  styles.badgeLabel,
                  item.isProduction
                    ? styles.labelProduction
                    : styles.labelDummy,
                ]}
              >
                {item.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    alignItems: "center",
    gap: 8,
  },
  caption: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeProduction: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  badgeDummy: {
    backgroundColor: "rgba(251,191,36,0.16)",
    borderColor: "rgba(251,191,36,0.35)",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  dotProduction: {
    backgroundColor: "#86EFAC",
  },
  dotDummy: {
    backgroundColor: "#FCD34D",
  },
  badgeText: {
    gap: 1,
  },
  badgeTitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  labelProduction: {
    color: "#ECFDF5",
  },
  labelDummy: {
    color: "#FEF3C7",
  },
});

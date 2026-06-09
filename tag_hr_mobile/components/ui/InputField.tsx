import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
  icon: any;
  placeholder: string;
  secure?: boolean;
  keyboardType?: any;
  value?: string;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
}

export default function InputField({
  icon,
  placeholder,
  secure = false,
  keyboardType = "default",
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  editable = true,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secure;

  return (
    <View
      style={[
        styles.container,
        !editable && styles.readonly,
        multiline && { alignItems: "flex-start", paddingTop: 10 },
      ]}
    >
      <Ionicons name={icon} size={18} color="#64748B" style={styles.icon} />

      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={[styles.input, multiline && styles.textArea]}
        secureTextEntry={isPassword && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
      />

      {isPassword && editable && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={18}
            color="#64748B"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
  },

  readonly: {
    backgroundColor: "#F1F5F9",
  },

  icon: {
    marginRight: 8,
    marginTop: 2,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
});

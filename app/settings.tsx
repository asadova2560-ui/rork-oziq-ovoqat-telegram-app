import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useSettings } from "@/context/SettingsContext";
import Colors from "@/constants/colors";

export default function SettingsScreen() {
  const {
    phone,
    address,
    setPhone,
    setAddress,
    resetSettings,
  } = useSettings();

  const handleReset = () => {
    Alert.alert(
      "Tasdiqlash",
      "Barcha sozlamalarni o‘chirmoqchimisiz?",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O‘chirish",
          style: "destructive",
          onPress: resetSettings,
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sozlamalar</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Telefon raqam</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="+998 90 123 45 67"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Default manzil</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          style={[styles.input, { height: 80 }]}
          multiline
          placeholder="Manzilni kiriting..."
        />
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetText}>Sozlamalarni tozalash</Text>
      </TouchableOpacity>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 24,
    color: Colors.text,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    fontSize: 16,
  },
  resetBtn: {
    marginTop: 20,
    backgroundColor: "#FFEAEA",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  resetText: {
    color: "#D00000",
    fontWeight: "700",
  },
});

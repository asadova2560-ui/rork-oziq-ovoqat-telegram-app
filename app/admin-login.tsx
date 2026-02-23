import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";

const ADMIN_PIN = "25012004";

export default function AdminLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");

  const handleLogin = () => {
    if (pin === ADMIN_PIN) {
      router.replace("/admin");
    } else {
      Alert.alert("Xato", "Noto‘g‘ri PIN");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin kirish</Text>

      <TextInput
        value={pin}
        onChangeText={setPin}
        placeholder="PIN kod"
        keyboardType="numeric"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Kirish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

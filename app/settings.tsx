import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Globe, Moon, Shield } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sozlamalar</Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>Umumiy</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                <Bell size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Bildirishnomalar</Text>
                <Text style={styles.rowSubtitle}>Buyurtma holati haqida</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.borderLight, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                <Moon size={20} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.rowTitle}>Tungi rejim</Text>
                <Text style={styles.rowSubtitle}>Qorong'u tema</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.borderLight, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Til</Text>
        <View style={styles.card}>
          {["O'zbekcha", "Русский", "English"].map((lang, i) => (
            <TouchableOpacity
              key={lang}
              style={[styles.row, i < 2 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}
              onPress={() => Alert.alert("Til", `${lang} tanlandi`)}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <Globe size={20} color={Colors.accent} />
                </View>
                <Text style={styles.rowTitle}>{lang}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Boshqa</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert("Maxfiylik siyosati", "Tez orada qo'shiladi")}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                <Shield size={20} color="#22C55E" />
              </View>
              <Text style={styles.rowTitle}>Maxfiylik siyosati</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Versiya 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  content: { padding: 16, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, marginTop: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 14, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  rowTitle: { fontSize: 15, fontWeight: "600", color: Colors.text },
  rowSubtitle: { fontSize: 12, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 14 },
  version: { textAlign: "center", color: Colors.textLight, fontSize: 13, marginTop: 20 },
});

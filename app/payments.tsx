import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, CreditCard, Plus, Trash2, Banknote } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState("cash");

  const methods = [
    { id: "cash", label: "Naqd pul", subtitle: "Yetkazib berishda to'lash", icon: <Banknote size={20} color="#22C55E" /> },
    { id: "card", label: "Karta", subtitle: "Visa / Mastercard / Uzcard", icon: <CreditCard size={20} color="#6366F1" /> },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>To'lov usullari</Text>
        <View style={{ width: 42 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>To'lov usulini tanlang</Text>
        {methods.map((method) => (
          <TouchableOpacity key={method.id} style={[styles.card, selected === method.id && styles.cardActive]} onPress={() => setSelected(method.id)}>
            <View style={styles.cardIcon}>{method.icon}</View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{method.label}</Text>
              <Text style={styles.cardSubtitle}>{method.subtitle}</Text>
            </View>
            <View style={[styles.radio, selected === method.id && styles.radioActive]}>
              {selected === method.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  content: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, marginBottom: 4 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 12, borderWidth: 2, borderColor: Colors.borderLight },
  cardActive: { borderColor: Colors.primary },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.borderLight, justifyContent: "center", alignItems: "center" },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
});

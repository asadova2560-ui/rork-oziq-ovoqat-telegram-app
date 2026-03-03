import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, MapPin, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [addresses, setAddresses] = useState([
    { id: "1", title: "Uy", address: "Toshkent, Chilonzor tumani" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");

  const handleAdd = () => {
    if (!title.trim() || !address.trim()) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }
    setAddresses([...addresses, { id: Date.now().toString(), title, address }]);
    setTitle("");
    setAddress("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("O'chirish", "Bu manzilni o'chirmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "O'chirish", style: "destructive", onPress: () => setAddresses(addresses.filter((a) => a.id !== id)) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manzillarim</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.addBtn}>
          <Plus size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Yangi manzil</Text>
            <TextInput style={styles.input} placeholder="Nom (masalan: Uy)" value={title} onChangeText={setTitle} placeholderTextColor={Colors.textLight} />
            <TextInput style={styles.input} placeholder="To'liq manzil" value={address} onChangeText={setAddress} placeholderTextColor={Colors.textLight} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Saqlash</Text>
            </TouchableOpacity>
          </View>
        )}
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <MapPin size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Manzil yo'q</Text>
            <Text style={styles.emptySubtext}>+ tugmasini bosib manzil qo'shing</Text>
          </View>
        ) : (
          addresses.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <MapPin size={20} color={Colors.accent} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.address}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  addBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 12 },
  form: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 10, marginBottom: 4 },
  formTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  input: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.borderLight },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  saveBtnText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  empty: { alignItems: "center", marginTop: 80, gap: 10 },
  emptyText: { fontSize: 18, fontWeight: "700", color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary },
});

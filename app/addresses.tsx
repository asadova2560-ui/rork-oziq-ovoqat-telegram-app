import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, MapPin, Trash2, Navigation, X } from "lucide-react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAddresses } from "@/context/AddressContext";

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addresses, addAddress, removeAddress } = useAddresses();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locationLoading, setLocationLoading] = useState(false);

  const handleGetLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              setLatitude(position.coords.latitude);
              setLongitude(position.coords.longitude);
              setAddress(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
              setLocationLoading(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            () => {
              Alert.alert("Xatolik", "Geolokatsiyani aniqlash imkoni bo'lmadi");
              setLocationLoading(false);
            }
          );
          return;
        }
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Ruxsat kerak", "Joylashuvingizni aniqlash uchun ruxsat bering");
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      try {
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo) {
          const parts = [geo.street, geo.district, geo.city].filter(Boolean);
          setAddress(parts.join(", ") || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      } catch {
        setAddress(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Xatolik", "Joylashuvni aniqlashda xatolik yuz berdi");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert("Xatolik", "Manzil nomini kiriting (masalan: Uy, Ish)");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Xatolik", "Manzilni kiriting yoki lokatsiya yuboring");
      return;
    }
    addAddress({ title: title.trim(), address: address.trim(), latitude, longitude });
    setTitle("");
    setAddress("");
    setLatitude(undefined);
    setLongitude(undefined);
    setShowForm(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string) => {
    Alert.alert("O'chirish", "Bu manzilni o'chirmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "O'chirish", style: "destructive",
        onPress: () => {
          removeAddress(id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
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
          {showForm ? <X size={22} color={Colors.white} /> : <Plus size={22} color={Colors.white} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Yangi manzil qo'shish</Text>

            <Text style={styles.label}>Manzil nomi *</Text>
            <TextInput
              style={styles.input}
              placeholder="Masalan: Uy, Ish, Do'kon"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>To'liq manzil *</Text>
            <TextInput
              style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]}
              placeholder="Ko'cha, uy raqami..."
              value={address}
              onChangeText={setAddress}
              placeholderTextColor={Colors.textLight}
              multiline
            />

            <TouchableOpacity
              style={[styles.locationBtn, locationLoading && { opacity: 0.6 }]}
              onPress={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Navigation size={16} color={Colors.primary} />}
              <Text style={styles.locationBtnText}>
                {locationLoading ? "Aniqlanmoqda..." : latitude ? "Lokatsiya aniqlandi ✓" : "Joriy lokatsiyani aniqlash"}
              </Text>
            </TouchableOpacity>

            {latitude && longitude && (
              <Text style={styles.coordsText}>📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Saqlash</Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <MapPin size={52} color={Colors.textLight} />
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
                {item.latitude && item.longitude && (
                  <Text style={styles.cardCoords}>
                    📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Trash2 size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
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
  form: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 8, marginBottom: 4 },
  formTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 4 },
  input: { backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.borderLight },
  locationBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: Colors.primaryLight, borderRadius: 12, marginTop: 4 },
  locationBtnText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  coordsText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  empty: { alignItems: "center", marginTop: 80, gap: 10 },
  emptyText: { fontSize: 18, fontWeight: "700", color: Colors.text },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardCoords: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  deleteBtn: { padding: 8 },
});

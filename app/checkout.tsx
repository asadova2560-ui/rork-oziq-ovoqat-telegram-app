import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Truck,
  FileText,
  CheckCircle,
  Navigation,
  ExternalLink,
} from "lucide-react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/formatPrice";
import { sendTelegramMessage, formatOrderMessage } from "@/utils/telegram";
import { PAYMENT_CARD_NUMBER } from "@/constants/config";

type PaymentMethod = "cash" | "card_transfer" | "on_delivery";
type CardProvider = "click" | "payme" | "paynet";

const CARD_PROVIDERS: Array<{ id: CardProvider; name: string; color: string; url: string }> = [
  { id: "click", name: "Click", color: "#00B4FF", url: "https://my.click.uz/" },
  { id: "payme", name: "Payme", color: "#33CCCC", url: "https://payme.uz/" },
  { id: "paynet", name: "Paynet", color: "#ED1C24", url: "https://paynet.uz/" },
];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, totalPrice, clearCart, getItemPrice } = useCart();

  const [phone, setPhone] = useState<string>("+998 ");
  const [address, setAddress] = useState<string>("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  const successAnim = useRef(new Animated.Value(0)).current;

  const handleOpenCardProvider = useCallback((provider: CardProvider) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const providerData = CARD_PROVIDERS.find((p) => p.id === provider);
    if (providerData) {
      Linking.openURL(providerData.url).catch(() => {
        Alert.alert("Xatolik", `${providerData.name} ilovasini ochib bo'lmadi`);
      });
    }
  }, []);

  const orderMutation = useMutation({
    mutationFn: async () => {
      const orderId = Date.now().toString().slice(-6);
      const paymentLabels: Record<PaymentMethod, string> = {
        cash: "Naqd pul",
        card_transfer: `Karta orqali (${PAYMENT_CARD_NUMBER})`,
        on_delivery: "Yetkazib berganda to'lov",
      };

      const message = formatOrderMessage({
        id: orderId,
        phone: phone.trim(),
        address: address.trim(),
        latitude,
        longitude,
        paymentMethod: paymentLabels[paymentMethod],
        items: items.map((item) => ({
          name: item.weightGrams
            ? `${item.product.nameUz} (${item.weightGrams >= 1000 ? `${item.weightGrams / 1000} kg` : `${item.weightGrams} g`})`
            : item.product.nameUz,
          quantity: item.quantity,
          price: item.weightGrams
            ? Math.round(item.product.price * item.weightGrams / 1000)
            : item.product.price,
          unit: item.weightGrams ? "dona" : item.product.unit,
        })),
        total: totalPrice,
        note: note.trim() || undefined,
      });

      const sent = await sendTelegramMessage(message);
      if (!sent) {
        throw new Error("Telegram xabar yuborilmadi");
      }
      return orderId;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOrderSuccess(true);
      Animated.spring(successAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      clearCart();
    },
    onError: (error) => {
      console.error("Order error:", error);
      Alert.alert(
        "Xatolik",
        "Buyurtma yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring."
      );
    },
  });

  const handleGetLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLatitude(position.coords.latitude);
              setLongitude(position.coords.longitude);
              setAddress(
                `Lokatsiya: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
              );
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
        Alert.alert("Xatolik", "Brauzer geolokatsiyani qo'llab-quvvatlamaydi");
        setLocationLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Ruxsat kerak",
          "Joylashuvingizni aniqlash uchun ruxsat bering"
        );
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
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
        setAddress(
          `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`
        );
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error("Location error:", err);
      Alert.alert("Xatolik", "Joylashuvni aniqlashda xatolik yuz berdi");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!phone.trim() || phone.trim().length < 9) {
      Alert.alert("Xatolik", "Telefon raqamni to'g'ri kiriting");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Xatolik", "Manzilni kiriting yoki lokatsiya yuboring");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Xatolik", "Savatcha bo'sh");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    orderMutation.mutate();
  }, [phone, address, items, orderMutation]);

  const formatPhoneInput = useCallback((text: string) => {
    const cleaned = text.replace(/[^\d+\s]/g, "");
    setPhone(cleaned);
  }, []);

  if (orderSuccess) {
    const scale = successAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <Animated.View
            style={[styles.successIcon, { transform: [{ scale }] }]}
          >
            <CheckCircle size={80} color={Colors.primary} />
          </Animated.View>
          <Text style={styles.successTitle}>Buyurtma qabul qilindi!</Text>
          <Text style={styles.successSubtext}>
            Tez orada siz bilan bog'lanamiz va Yandex Go orqali yetkazib
            beramiz.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.replace("/" as never)}
          >
            <Text style={styles.successBtnText}>Bosh sahifaga</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buyurtma berish</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Phone size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Telefon raqam</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={formatPhoneInput}
              placeholder="+998 90 123 45 67"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
              testID="phone-input"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>
            </View>
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Manzilni kiriting..."
              placeholderTextColor={Colors.textLight}
              multiline
              testID="address-input"
            />
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Navigation size={18} color={Colors.primary} />
              )}
              <Text style={styles.locationBtnText}>
                {locationLoading
                  ? "Aniqlanmoqda..."
                  : latitude
                    ? "Lokatsiya aniqlandi ✓"
                    : "Joriy lokatsiyani yuborish"}
              </Text>
            </TouchableOpacity>
            {latitude && longitude && (
              <Text style={styles.coordsText}>
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CreditCard size={18} color="#6366F1" />
              <Text style={styles.sectionTitle}>To'lov usuli</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "cash" && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod("cash")}
            >
              <View
                style={[
                  styles.paymentIconBox,
                  { backgroundColor: "#E8F5EE" },
                ]}
              >
                <Banknote size={20} color={Colors.primary} />
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentLabel}>Naqd pul</Text>
                <Text style={styles.paymentDesc}>
                  Yetkazib berganda naqd to'lov
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === "cash" && styles.radioActive,
                ]}
              >
                {paymentMethod === "cash" && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "card_transfer" && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod("card_transfer")}
            >
              <View
                style={[
                  styles.paymentIconBox,
                  { backgroundColor: "#EEF2FF" },
                ]}
              >
                <CreditCard size={20} color="#6366F1" />
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentLabel}>Karta orqali to'lash</Text>
                <Text style={styles.paymentDesc}>
                  Click, Payme yoki Paynet orqali
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === "card_transfer" && styles.radioActive,
                ]}
              >
                {paymentMethod === "card_transfer" && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>

            {paymentMethod === "card_transfer" && (
              <View style={styles.cardProvidersSection}>
                <Text style={styles.cardProviderHint}>
                  To'lov tizimini tanlang:
                </Text>
                <View style={styles.cardProvidersRow}>
                  {CARD_PROVIDERS.map((provider) => (
                    <TouchableOpacity
                      key={provider.id}
                      style={[styles.cardProviderBtn, { borderColor: provider.color }]}
                      onPress={() => handleOpenCardProvider(provider.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.cardProviderDot, { backgroundColor: provider.color }]} />
                      <Text style={[styles.cardProviderName, { color: provider.color }]}>
                        {provider.name}
                      </Text>
                      <ExternalLink size={14} color={provider.color} />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.cardNumberBox}>
                  <Text style={styles.cardNumberLabel}>Karta raqam:</Text>
                  <Text style={styles.cardNumberValue}>{PAYMENT_CARD_NUMBER}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "on_delivery" && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod("on_delivery")}
            >
              <View
                style={[
                  styles.paymentIconBox,
                  { backgroundColor: "#FFF0EA" },
                ]}
              >
                <Truck size={20} color={Colors.accent} />
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentLabel}>Yetkazib berganda</Text>
                <Text style={styles.paymentDesc}>
                  Naqd yoki karta bilan to'lov
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === "on_delivery" && styles.radioActive,
                ]}
              >
                {paymentMethod === "on_delivery" && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color={Colors.textSecondary} />
              <Text style={styles.sectionTitle}>Izoh (ixtiyoriy)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Qo'shimcha ma'lumot..."
              placeholderTextColor={Colors.textLight}
              multiline
              testID="note-input"
            />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Buyurtma xulosasi</Text>
            {items.map((item) => {
              const itemTotal = getItemPrice(item);
              const displayName = item.weightGrams
                ? `${item.product.nameUz} (${item.weightGrams >= 1000 ? `${item.weightGrams / 1000} kg` : `${item.weightGrams} g`})`
                : item.product.nameUz;
              return (
                <View key={`${item.product.id}_${item.weightGrams ?? "std"}`} style={styles.summaryRow}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {displayName} x{item.quantity}
                  </Text>
                  <Text style={styles.summaryItemPrice}>
                    {formatPrice(itemTotal)}
                  </Text>
                </View>
              );
            })}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Yetkazib berish</Text>
              <Text style={styles.summaryDelivery}>Yandex Go orqali</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Jami:</Text>
              <Text style={styles.summaryTotalPrice}>
                {formatPrice(totalPrice)}
              </Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            orderMutation.isPending && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={orderMutation.isPending}
          activeOpacity={0.8}
        >
          {orderMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              Buyurtma berish — {formatPrice(totalPrice)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  locationBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  coordsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    marginLeft: 4,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    marginBottom: 8,
    gap: 12,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentContent: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  paymentDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  cardProvidersSection: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  cardProviderHint: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  cardProvidersRow: {
    flexDirection: "row",
    gap: 8,
  },
  cardProviderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cardProviderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardProviderName: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardNumberBox: {
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNumberLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  cardNumberValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: 1,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryItemName: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 12,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryDelivery: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accent,
  },
  summaryTotal: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  summaryTotalPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.white,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },
  successSubtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  successBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 30,
  },
  successBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
});

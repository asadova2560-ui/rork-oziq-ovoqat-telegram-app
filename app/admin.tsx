import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator,
  Dimensions, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Search, Package, Tag,
  ImageIcon, Lock, ShieldCheck, LayoutDashboard, BarChart2,
  DollarSign, ShoppingBag, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight, Star, Crown, Zap,
  Phone, MapPin, CreditCard, ChevronRight, Clock, CheckCircle2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useProducts } from "@/context/ProductsContext";
import { Product } from "@/types/product";
import { formatPrice } from "@/utils/formatPrice";
import { ADMIN_PIN } from "@/constants/config";
import { CategoryIcon } from "@/components/CategoryIcon";
import { supabase } from "@/lib/supabase";

const { width: SW } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
type Banner = {
  id: string; title: string; subtitle: string; btnLabel: string;
  image: string; bg: string; titleColor: string; subtitleColor: string;
  btnBg: string; btnColor: string;
};

type Order = {
  id: string; customer_name: string; customer_phone: string;
  address: string;
  items: { id: string; name: string; price: number; qty: number; unit?: string }[];
  total_price: number; status: string; payment_method: string;
  note: string | null; is_fake: boolean; created_at: string;
};

type Period = "today" | "week" | "month" | "all";
type AnalyticsSection = "overview" | "customers" | "products" | "orders";

type CustomerABC = {
  name: string; phone: string; total: number; orderCount: number; class: "A" | "B" | "C";
  orders: Order[];
};

type TopProduct = { name: string; qty: number; revenue: number };
type DailyData = { label: string; revenue: number };

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_BANNERS: Banner[] = [
  { id: "1", title: "Yangi mahsulotlar", subtitle: "30% gacha chegirmalar!", btnLabel: "Xarid qilish", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800", bg: "#e8f5e9", titleColor: "#1b5e20", subtitleColor: "#388e3c", btnBg: "#2e7d32", btnColor: "#fff" },
  { id: "2", title: "Ramazon aksiyasi 🌙", subtitle: "Iftor mahsulotlari 40% arzon!", btnLabel: "Ko'rish", image: "https://images.unsplash.com/photo-1604908554025-4e1f6d4d3c58?w=800", bg: "#0f2d1a", titleColor: "#ffffff", subtitleColor: "#fbbf24", btnBg: "#fbbf24", btnColor: "#0f2d1a" },
  { id: "3", title: "Toza sabzavotlar 🥦", subtitle: "Mahalliy fermerlardan yangi hosillar", btnLabel: "Buyurtma", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800", bg: "#fff8e1", titleColor: "#5d3a00", subtitleColor: "#9e6600", btnBg: "#f59e0b", btnColor: "#fff" },
];

const COLOR_PRESETS = [
  { label: "Yashil",   bg: "#e8f5e9", titleColor: "#1b5e20", subtitleColor: "#388e3c", btnBg: "#2e7d32", btnColor: "#fff" },
  { label: "Qorong'u", bg: "#0f2d1a", titleColor: "#ffffff", subtitleColor: "#fbbf24", btnBg: "#fbbf24", btnColor: "#0f2d1a" },
  { label: "Sariq",    bg: "#fff8e1", titleColor: "#5d3a00", subtitleColor: "#9e6600", btnBg: "#f59e0b", btnColor: "#fff" },
  { label: "Ko'k",     bg: "#e3f2fd", titleColor: "#0d47a1", subtitleColor: "#1976d2", btnBg: "#1565c0", btnColor: "#fff" },
  { label: "Qizil",    bg: "#fce4ec", titleColor: "#880e4f", subtitleColor: "#c2185b", btnBg: "#c62828", btnColor: "#fff" },
  { label: "Binafsha", bg: "#f3e5f5", titleColor: "#4a148c", subtitleColor: "#7b1fa2", btnBg: "#6a1b9a", btnColor: "#fff" },
];

const EMPTY_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop";
const DAY_LABELS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const shortDate = (s: string) => { const d = new Date(s); return `${d.getDate()}/${d.getMonth() + 1}`; };
const ABC_COLOR = { A: "#f59e0b", B: Colors.primary, C: Colors.textSecondary };
const ABC_BG    = { A: "#fef3c7", B: Colors.primaryLight, C: "#f1f5f9" };

const STATUS_FLOW = [
  { value: "new",        label: "Yangi",         emoji: "🆕" },
  { value: "confirmed",  label: "Tasdiqlandi",   emoji: "✅" },
  { value: "delivering", label: "Yetkazilmoqda", emoji: "🚗" },
  { value: "delivered",  label: "Yetkazildi",    emoji: "📦" },
  { value: "cancelled",  label: "Bekor",         emoji: "❌" },
  { value: "pending",    label: "Kutilmoqda",    emoji: "⏳" },
];

const STATUS_COLOR: Record<string, string> = {
  new: "#3b82f6", pending: "#f59e0b", confirmed: Colors.primary,
  delivering: "#8b5cf6", delivered: "#22c55e", cancelled: "#ef4444",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Yangi", pending: "Kutilmoqda", confirmed: "Tasdiqlandi",
  delivering: "Yetkazilmoqda", delivered: "Yetkazildi", cancelled: "Bekor",
};

const startOf = (period: Period): Date => {
  const d = new Date();
  if (period === "today") { d.setHours(0, 0, 0, 0); return d; }
  if (period === "week")  { d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }
  if (period === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
  return new Date(0);
};

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: DailyData[] }) {
  if (!data.length) return <Text style={an.empty}>Ma'lumot yo'q</Text>;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <View style={ch.wrap}>
      {data.map((d, i) => (
        <View key={i} style={ch.col}>
          <View style={ch.barWrap}>
            <View style={[ch.bar, { height: `${Math.max((d.revenue / max) * 100, 4)}%` as any }]} />
          </View>
          <Text style={ch.lbl}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, trend, onPress }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; color: string; trend?: number; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[kpi.card, { borderTopColor: color }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[kpi.icon, { backgroundColor: color + "18" }]}>{icon}</View>
      <Text style={kpi.val}>{value}</Text>
      <Text style={kpi.lbl}>{label}</Text>
      {sub && (
        <View style={kpi.row}>
          {trend !== undefined && (trend >= 0
            ? <ArrowUpRight size={11} color="#22c55e" />
            : <ArrowDownRight size={11} color={Colors.danger} />)}
          <Text style={[kpi.sub, { color: trend !== undefined && trend >= 0 ? "#22c55e" : Colors.danger }]}>{sub}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, visible, onClose, onStatusChange }: {
  order: Order | null; visible: boolean; onClose: () => void;
  onStatusChange: (order: Order, newStatus: string) => void;
}) {
  if (!order) return null;
  const statusColor = STATUS_COLOR[order.status] ?? "#888";
  const statusLabel = STATUS_LABEL[order.status] ?? order.status;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.modal, { paddingTop: Platform.OS === "ios" ? 20 : 0 }]}>
        <View style={s.modalHdr}>
          <TouchableOpacity onPress={onClose}><X size={24} color={Colors.text} /></TouchableOpacity>
          <Text style={s.modalTitle}>Buyurtma #{order.id.slice(-6)}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          {/* Status */}
          <View style={od.statusCard}>
            <View style={[od.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[od.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
            <Text style={od.statusDate}>{new Date(order.created_at).toLocaleString("uz-UZ")}</Text>
          </View>

          {/* Customer info */}
          <View style={od.card}>
            <Text style={od.cardTitle}>👤 Mijoz</Text>
            <View style={od.row}><Phone size={14} color={Colors.primary} /><Text style={od.rowTxt}>{order.customer_phone}</Text></View>
            <View style={od.row}><MapPin size={14} color={Colors.accent} /><Text style={od.rowTxt}>{order.address}</Text></View>
            <View style={od.row}>
              <CreditCard size={14} color="#6366F1" />
              <Text style={od.rowTxt}>
                {order.payment_method === "cash" ? "Naqd pul" : order.payment_method === "card" ? "Karta" : order.payment_method}
              </Text>
            </View>
            {order.note && <View style={od.row}><Text style={od.noteTxt}>💬 {order.note}</Text></View>}
          </View>

          {/* Items */}
          <View style={od.card}>
            <Text style={od.cardTitle}>🛒 Mahsulotlar</Text>
            {(order.items || []).map((item, i) => (
              <View key={i} style={od.itemRow}>
                <Text style={od.itemName}>{item.name} {item.unit ? `(${item.unit})` : ""}</Text>
                <Text style={od.itemQty}>×{item.qty}</Text>
                <Text style={od.itemPrice}>{formatPrice(item.price * item.qty)}</Text>
              </View>
            ))}
            <View style={od.divider} />
            <View style={od.itemRow}>
              <Text style={od.totalLbl}>Jami:</Text>
              <Text style={od.totalVal}>{formatPrice(order.total_price)}</Text>
            </View>
          </View>

          {/* Status change */}
          <View style={od.card}>
            <Text style={od.cardTitle}>🔄 Holatni o'zgartirish</Text>
            <View style={od.statusGrid}>
              {STATUS_FLOW.filter(s => s.value !== order.status).map((st) => (
                <TouchableOpacity
                  key={st.value}
                  style={[od.statusBtn, { borderColor: STATUS_COLOR[st.value] + "60" }]}
                  onPress={() => onStatusChange(order, st.value)}
                  activeOpacity={0.7}
                >
                  <Text style={od.statusBtnEmoji}>{st.emoji}</Text>
                  <Text style={[od.statusBtnTxt, { color: STATUS_COLOR[st.value] }]}>{st.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Customer Detail Modal ────────────────────────────────────────────────────
function CustomerDetailModal({ customer, visible, onClose, onOrderPress }: {
  customer: CustomerABC | null; visible: boolean; onClose: () => void;
  onOrderPress: (order: Order) => void;
}) {
  if (!customer) return null;
  const Icon = { A: Crown, B: Star, C: Zap }[customer.class];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.modal, { paddingTop: Platform.OS === "ios" ? 20 : 0 }]}>
        <View style={s.modalHdr}>
          <TouchableOpacity onPress={onClose}><X size={24} color={Colors.text} /></TouchableOpacity>
          <Text style={s.modalTitle}>Mijoz ma'lumoti</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          {/* Profile */}
          <View style={od.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <View style={[od.avatar, { backgroundColor: ABC_BG[customer.class] }]}>
                <Icon size={24} color={ABC_COLOR[customer.class]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={od.custName}>{customer.name || customer.phone}</Text>
                <Text style={od.custPhone}>{customer.phone}</Text>
              </View>
              <View style={[od.abcPill, { backgroundColor: ABC_BG[customer.class] }]}>
                <Text style={[od.abcPillTxt, { color: ABC_COLOR[customer.class] }]}>Sinf {customer.class}</Text>
              </View>
            </View>
            <View style={od.statsRow}>
              <View style={od.statBox}>
                <Text style={od.statVal}>{customer.orderCount}</Text>
                <Text style={od.statLbl}>Buyurtma</Text>
              </View>
              <View style={od.statBox}>
                <Text style={[od.statVal, { color: Colors.primary }]}>{formatPrice(customer.total)}</Text>
                <Text style={od.statLbl}>Jami xarid</Text>
              </View>
              <View style={od.statBox}>
                <Text style={od.statVal}>{formatPrice(customer.orderCount ? Math.round(customer.total / customer.orderCount) : 0)}</Text>
                <Text style={od.statLbl}>O'rtacha</Text>
              </View>
            </View>
          </View>

          {/* Orders */}
          <Text style={od.sectionTitle}>Buyurtmalar tarixi</Text>
          {customer.orders.length === 0
            ? <Text style={an.empty}>Buyurtmalar yo'q</Text>
            : customer.orders.map((order) => (
              <TouchableOpacity key={order.id} style={od.orderCard} onPress={() => onOrderPress(order)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <View style={[od.miniDot, { backgroundColor: STATUS_COLOR[order.status] }]} />
                    <Text style={[od.miniStatus, { color: STATUS_COLOR[order.status] }]}>{STATUS_LABEL[order.status] ?? order.status}</Text>
                    <Text style={od.miniDate}>{new Date(order.created_at).toLocaleDateString("uz-UZ")}</Text>
                  </View>
                  <Text style={od.miniItems} numberOfLines={1}>
                    {(order.items || []).map(it => `${it.name} ×${it.qty}`).join(", ")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={od.miniTotal}>{formatPrice(order.total_price)}</Text>
                  <ChevronRight size={14} color={Colors.textLight} />
                </View>
              </TouchableOpacity>
            ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Product Analytics Modal ──────────────────────────────────────────────────
function ProductDetailModal({ product, visible, onClose, orders }: {
  product: TopProduct | null; visible: boolean; onClose: () => void; orders: Order[];
}) {
  if (!product) return null;
  const productOrders = orders.filter(o =>
    (o.items || []).some(it => it.name === product.name) && o.status === "delivered"
  );
  const avgPerOrder = productOrders.length ? Math.round(product.qty / productOrders.length) : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.modal, { paddingTop: Platform.OS === "ios" ? 20 : 0 }]}>
        <View style={s.modalHdr}>
          <TouchableOpacity onPress={onClose}><X size={24} color={Colors.text} /></TouchableOpacity>
          <Text style={s.modalTitle} numberOfLines={1}>{product.name}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={od.card}>
            <Text style={od.cardTitle}>📊 Statistika</Text>
            <View style={od.statsRow}>
              <View style={od.statBox}>
                <Text style={[od.statVal, { color: "#22c55e" }]}>{formatPrice(product.revenue)}</Text>
                <Text style={od.statLbl}>Daromad</Text>
              </View>
              <View style={od.statBox}>
                <Text style={od.statVal}>{product.qty}</Text>
                <Text style={od.statLbl}>Sotilgan</Text>
              </View>
              <View style={od.statBox}>
                <Text style={od.statVal}>{avgPerOrder}</Text>
                <Text style={od.statLbl}>O'rtacha/buyurtma</Text>
              </View>
            </View>
          </View>

          {/* Orders with this product */}
          <Text style={od.sectionTitle}>Bu mahsulot buyurtmalari ({productOrders.length} ta)</Text>
          {productOrders.length === 0
            ? <Text style={an.empty}>Buyurtmalar yo'q</Text>
            : productOrders.slice(0, 20).map((order) => {
              const item = (order.items || []).find(it => it.name === product.name);
              return (
                <View key={order.id} style={od.orderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={od.custName}>{order.customer_name}</Text>
                    <Text style={od.custPhone}>{order.customer_phone}</Text>
                    <Text style={od.miniDate}>{new Date(order.created_at).toLocaleDateString("uz-UZ")}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 3 }}>
                    <Text style={od.miniTotal}>{item ? `×${item.qty}` : ""}</Text>
                    <View style={[od.miniDotPill, { backgroundColor: STATUS_COLOR[order.status] + "20" }]}>
                      <Text style={[{ fontSize: 10, fontWeight: "700", color: STATUS_COLOR[order.status] }]}>{STATUS_LABEL[order.status]}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, categories, addProduct, updateProduct, deleteProduct, resetToDefaults } = useProducts();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"products" | "banners" | "analytics">("products");

  // ── Products state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formNameUz, setFormNameUz] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOldPrice, setFormOldPrice] = useState("");
  const [formUnit, setFormUnit] = useState("kg");
  const [formImage, setFormImage] = useState("");
  const [formCategory, setFormCategory] = useState("fruits");
  const [formDescription, setFormDescription] = useState("");
  const [formInStock, setFormInStock] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsOnSale, setFormIsOnSale] = useState(false);

  // ── Banners state ─────────────────────────────────────────────────────────
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [bannerImageUploading, setBannerImageUploading] = useState(false);
  const [bTitle, setBTitle] = useState("");
  const [bSubtitle, setBSubtitle] = useState("");
  const [bBtnLabel, setBBtnLabel] = useState("Xarid qilish");
  const [bImage, setBImage] = useState("");
  const [bBg, setBBg] = useState("#e8f5e9");
  const [bTitleColor, setBTitleColor] = useState("#1b5e20");
  const [bSubtitleColor, setBSubtitleColor] = useState("#388e3c");
  const [bBtnBg, setBBtnBg] = useState("#2e7d32");
  const [bBtnColor, setBBtnColor] = useState("#ffffff");

  // ── Analytics state ───────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersRefreshing, setOrdersRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [analyticsSection, setAnalyticsSection] = useState<AnalyticsSection>("overview");

  // ── Detail Modals ─────────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerABC | null>(null);
  const [customerDetailVisible, setCustomerDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TopProduct | null>(null);
  const [productDetailVisible, setProductDetailVisible] = useState(false);
  // Secondary: order detail from customer modal
  const [secondOrderVisible, setSecondOrderVisible] = useState(false);
  const [secondOrder, setSecondOrder] = useState<Order | null>(null);

  // ── Load banners ──────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem("admin_banners").then((data) => {
      if (data) { try { const p = JSON.parse(data); if (Array.isArray(p) && p.length > 0) setBanners(p); } catch {} }
    });
  }, []);

  useEffect(() => {
    if (activeTab === "analytics" && orders.length === 0) fetchOrders();
  }, [activeTab]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setOrdersLoading(false);
  }, []);

  const onRefreshOrders = useCallback(async () => {
    setOrdersRefreshing(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setOrdersRefreshing(false);
  }, []);

  const handleChangeStatus = useCallback(async (order: Order, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    if (error) { Alert.alert("Xatolik", error.message); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: newStatus } : o));
    // Update selected order too
    if (selectedOrder?.id === order.id) setSelectedOrder({ ...order, status: newStatus });
    if (secondOrder?.id === order.id) setSecondOrder({ ...order, status: newStatus });
  }, [selectedOrder, secondOrder]);

  const saveBanners = async (next: Banner[]) => {
    setBanners(next); await AsyncStorage.setItem("admin_banners", JSON.stringify(next));
  };

  // ── PIN ───────────────────────────────────────────────────────────────────
  const handlePinSubmit = useCallback(() => {
    if (pinInput === ADMIN_PIN) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true); setPinError(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinError(true); setPinInput("");
    }
  }, [pinInput]);

  const handlePinChange = useCallback((text: string) => {
    setPinInput(text.replace(/\D/g, "").slice(0, 4)); setPinError(false);
  }, []);

  // ── Products ──────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.nameUz.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }, [products, search]);

  const openAddModal = useCallback(() => {
    setIsAdding(true); setEditingProduct(null);
    setFormName(""); setFormNameUz(""); setFormPrice(""); setFormOldPrice("");
    setFormUnit("kg"); setFormImage(EMPTY_PRODUCT_IMAGE); setFormCategory("fruits");
    setFormDescription(""); setFormInStock(true); setFormIsFeatured(false); setFormIsOnSale(false);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((product: Product) => {
    setIsAdding(false); setEditingProduct(product);
    setFormName(product.name); setFormNameUz(product.nameUz);
    setFormPrice(product.price.toString()); setFormOldPrice(product.oldPrice?.toString() ?? "");
    setFormUnit(product.unit); setFormImage(product.image); setFormCategory(product.categoryId);
    setFormDescription(product.description); setFormInStock(product.inStock);
    setFormIsFeatured(product.isFeatured ?? false); setFormIsOnSale(product.isOnSale ?? false);
    setModalVisible(true);
  }, []);

  const handlePickImage = useCallback(async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Ruxsat kerak", "Galereyaga kirish uchun ruxsat bering"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) {
      const uri = result.assets[0].uri; setImageUploading(true);
      try {
        const fileName = `product_${Date.now()}.jpg`;
        const response = await fetch(uri); const blob = await response.blob(); const arrayBuffer = await blob.arrayBuffer();
        const { error } = await supabase.storage.from("Mini app").upload(fileName, arrayBuffer, { contentType: "image/jpeg", upsert: true });
        if (error) { Alert.alert("Xatolik", "Rasm yuklanmadi: " + error.message); return; }
        const { data: urlData } = supabase.storage.from("Mini app").getPublicUrl(fileName);
        setFormImage(urlData.publicUrl);
      } catch { Alert.alert("Xatolik", "Rasm yuklanmadi"); } finally { setImageUploading(false); }
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!formNameUz.trim()) { Alert.alert("Xatolik", "Mahsulot nomini kiriting"); return; }
    if (!formPrice || Number(formPrice) <= 0) { Alert.alert("Xatolik", "Narxni to'g'ri kiriting"); return; }
    const productData = {
      name: formName.trim() || formNameUz.trim(), nameUz: formNameUz.trim(),
      price: Number(formPrice), oldPrice: formOldPrice ? Number(formOldPrice) : null,
      unit: formUnit, image: formImage, categoryId: formCategory, description: formDescription,
      rating: editingProduct?.rating ?? 4.5, inStock: formInStock, isFeatured: formIsFeatured, isOnSale: formIsOnSale,
    };
    if (isAdding) { await addProduct(productData); } else if (editingProduct) { await updateProduct(editingProduct.id, productData); }
    setModalVisible(false);
  }, [formName, formNameUz, formPrice, formOldPrice, formUnit, formImage, formCategory, formDescription, formInStock, formIsFeatured, formIsOnSale, isAdding, editingProduct, addProduct, updateProduct]);

  const handleDelete = useCallback((product: Product) => {
    Alert.alert("O'chirish", `"${product.nameUz}" ni o'chirmoqchimisiz?`, [
      { text: "Bekor qilish", style: "cancel" },
      { text: "O'chirish", style: "destructive", onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deleteProduct(product.id); } },
    ]);
  }, [deleteProduct]);

  const handleReset = useCallback(() => {
    Alert.alert("Asl holatga qaytarish", "Barcha mahsulotlar boshlang'ich holatga qaytariladi.", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Qaytarish", style: "destructive", onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); resetToDefaults(); } },
    ]);
  }, [resetToDefaults]);

  // ── Banners ───────────────────────────────────────────────────────────────
  const applyPreset = (p: typeof COLOR_PRESETS[0]) => {
    setBBg(p.bg); setBTitleColor(p.titleColor); setBSubtitleColor(p.subtitleColor); setBBtnBg(p.btnBg); setBBtnColor(p.btnColor);
  };

  const openAddBanner = () => {
    setIsAddingBanner(true); setEditingBanner(null);
    setBTitle(""); setBSubtitle(""); setBBtnLabel("Xarid qilish");
    setBImage("https://images.unsplash.com/photo-1542838132-92c53300491e?w=800");
    applyPreset(COLOR_PRESETS[0]); setBannerModalVisible(true);
  };

  const openEditBanner = (b: Banner) => {
    setIsAddingBanner(false); setEditingBanner(b);
    setBTitle(b.title); setBSubtitle(b.subtitle); setBBtnLabel(b.btnLabel);
    setBImage(b.image); setBBg(b.bg); setBTitleColor(b.titleColor);
    setBSubtitleColor(b.subtitleColor); setBBtnBg(b.btnBg); setBBtnColor(b.btnColor);
    setBannerModalVisible(true);
  };

  const handlePickBannerImage = useCallback(async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Ruxsat kerak", "Galereyaga kirish uchun ruxsat bering"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) {
      const uri = result.assets[0].uri; setBannerImageUploading(true);
      try {
        const fileName = `banner_${Date.now()}.jpg`;
        const response = await fetch(uri); const blob = await response.blob(); const arrayBuffer = await blob.arrayBuffer();
        const { error } = await supabase.storage.from("Mini app").upload(fileName, arrayBuffer, { contentType: "image/jpeg", upsert: true });
        if (error) { Alert.alert("Xatolik", "Rasm yuklanmadi"); return; }
        const { data: urlData } = supabase.storage.from("Mini app").getPublicUrl(fileName);
        setBImage(urlData.publicUrl);
      } catch { Alert.alert("Xatolik", "Rasm yuklanmadi"); } finally { setBannerImageUploading(false); }
    }
  }, []);

  const handleSaveBanner = async () => {
    if (!bTitle.trim()) { Alert.alert("Xatolik", "Banner sarlavhasini kiriting"); return; }
    if (isAddingBanner) {
      await saveBanners([...banners, { id: Date.now().toString(), title: bTitle.trim(), subtitle: bSubtitle.trim(), btnLabel: bBtnLabel.trim() || "Xarid qilish", image: bImage, bg: bBg, titleColor: bTitleColor, subtitleColor: bSubtitleColor, btnBg: bBtnBg, btnColor: bBtnColor }]);
    } else if (editingBanner) {
      await saveBanners(banners.map((b) => b.id === editingBanner.id ? { ...b, title: bTitle.trim(), subtitle: bSubtitle.trim(), btnLabel: bBtnLabel.trim() || "Xarid qilish", image: bImage, bg: bBg, titleColor: bTitleColor, subtitleColor: bSubtitleColor, btnBg: bBtnBg, btnColor: bBtnColor } : b));
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBannerModalVisible(false);
  };

  const handleDeleteBanner = (b: Banner) => {
    Alert.alert("O'chirish", `"${b.title}" bannerni o'chirmoqchimisiz?`, [
      { text: "Bekor qilish", style: "cancel" },
      { text: "O'chirish", style: "destructive", onPress: async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await saveBanners(banners.filter((x) => x.id !== b.id)); } },
    ]);
  };

  // ── Analytics computed ────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const from = startOf(period);
    return orders.filter((o) => new Date(o.created_at) >= from);
  }, [orders, period]);

  const deliveredOrders = useMemo(() => filteredOrders.filter((o) => o.status === "delivered"), [filteredOrders]);

  const totalRevenue = useMemo(() => deliveredOrders.reduce((s, o) => s + (o.total_price ?? 0), 0), [deliveredOrders]);
  const avgOrder = deliveredOrders.length ? totalRevenue / deliveredOrders.length : 0;
  const uniqueCustomers = new Set(filteredOrders.map((o) => o.customer_phone)).size;
  const cancelRate = filteredOrders.length ? Math.round((filteredOrders.filter((o) => o.status === "cancelled").length / filteredOrders.length) * 100) : 0;
  const pendingCount = filteredOrders.filter((o) => ["pending", "new"].includes(o.status)).length;

  const prevRevenue = useMemo(() => {
    const from = startOf(period);
    const diff = Date.now() - from.getTime();
    const prevFrom = new Date(from.getTime() - diff);
    return orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= prevFrom.getTime() && t < from.getTime() && o.status === "delivered";
    }).reduce((s, o) => s + (o.total_price ?? 0), 0);
  }, [orders, period]);

  const revTrend = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

  const chartData = useMemo((): DailyData[] => {
    if (period === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toDateString();
        const rev = deliveredOrders.filter((o) => new Date(o.created_at).toDateString() === dateStr).reduce((s, o) => s + (o.total_price ?? 0), 0);
        return { label: DAY_LABELS[d.getDay()], revenue: rev };
      });
    }
    if (period === "today") {
      return Array.from({ length: 24 }, (_, h) => {
        const rev = deliveredOrders.filter((o) => new Date(o.created_at).getHours() === h).reduce((s, o) => s + (o.total_price ?? 0), 0);
        return { label: `${h}`, revenue: rev };
      }).filter((_, h) => h <= new Date().getHours()).slice(-8);
    }
    const byDay: Record<string, number> = {};
    deliveredOrders.forEach((o) => { const k = shortDate(o.created_at); byDay[k] = (byDay[k] || 0) + (o.total_price ?? 0); });
    return Object.entries(byDay).slice(-10).map(([label, revenue]) => ({ label, revenue }));
  }, [deliveredOrders, period]);

  const topProducts = useMemo((): TopProduct[] => {
    const map: Record<string, TopProduct> = {};
    deliveredOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
        map[item.name].qty += item.qty;
        map[item.name].revenue += item.price * item.qty;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [deliveredOrders]);

  const maxProductRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);

  const abcCustomers = useMemo((): CustomerABC[] => {
    const map: Record<string, CustomerABC> = {};
    orders.forEach((o) => {
      const k = o.customer_phone;
      if (!map[k]) map[k] = { name: o.customer_name, phone: k, total: 0, orderCount: 0, class: "C", orders: [] };
      map[k].orders.push(o);
      if (o.status === "delivered") { map[k].total += (o.total_price ?? 0); map[k].orderCount += 1; }
    });
    const list = Object.values(map).sort((a, b) => b.total - a.total);
    const grandTotal = list.reduce((s, c) => s + c.total, 0);
    let cum = 0;
    return list.map((c) => {
      cum += c.total;
      const pct = grandTotal > 0 ? (cum / grandTotal) * 100 : 100;
      return { ...c, class: pct <= 70 ? "A" : pct <= 90 ? "B" : "C" };
    });
  }, [orders]);

  const aCount = abcCustomers.filter((c) => c.class === "A").length;
  const bCount = abcCustomers.filter((c) => c.class === "B").length;
  const cCount = abcCustomers.filter((c) => c.class === "C").length;

  const units = ["kg", "dona", "litr", "gramm", "paket"];
  const PERIODS: { key: Period; label: string }[] = [
    { key: "today", label: "Bugun" }, { key: "week", label: "Hafta" },
    { key: "month", label: "Oy" }, { key: "all", label: "Hammasi" },
  ];
  const ANALYTICS_SECTIONS: { key: AnalyticsSection; label: string; icon: any }[] = [
    { key: "overview", label: "Umumiy", icon: BarChart2 },
    { key: "customers", label: "Mijozlar", icon: Users },
    { key: "products", label: "Mahsulot", icon: Package },
    { key: "orders", label: "Buyurtma", icon: ShoppingBag },
  ];

  // ── PIN Screen ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={22} color={Colors.text} /></TouchableOpacity>
          <Text style={s.headerTitle}>Admin kirish</Text>
          <View style={s.backBtn} />
        </View>
        <View style={s.pinWrap}>
          <View style={s.pinIcon}><Lock size={40} color={Colors.primary} /></View>
          <Text style={s.pinTitle}>PIN kod kiriting</Text>
          <Text style={s.pinSub}>Admin panelga kirish uchun 4 xonali PIN kodni kiriting</Text>
          <View style={s.pinRow}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={[s.pinDot, pinInput.length > i && s.pinDotFilled, pinError && s.pinDotError]}>
                {pinInput.length > i && <View style={[s.pinDotInner, pinError && s.pinDotInnerErr]} />}
              </View>
            ))}
          </View>
          <TextInput style={s.pinHidden} value={pinInput} onChangeText={handlePinChange} keyboardType="number-pad" maxLength={4} autoFocus onSubmitEditing={handlePinSubmit} />
          {pinError && <Text style={s.pinErr}>PIN kod noto'g'ri. Qaytadan urinib ko'ring.</Text>}
          <TouchableOpacity style={[s.pinBtn, pinInput.length < 4 && s.pinBtnOff]} onPress={handlePinSubmit} disabled={pinInput.length < 4}>
            <ShieldCheck size={20} color={Colors.white} /><Text style={s.pinBtnTxt}>Kirish</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={22} color={Colors.text} /></TouchableOpacity>
        <Text style={s.headerTitle}>Admin panel</Text>
        {activeTab === "products" && <TouchableOpacity onPress={openAddModal} style={s.addBtn}><Plus size={22} color={Colors.white} /></TouchableOpacity>}
        {activeTab === "banners" && <TouchableOpacity onPress={openAddBanner} style={s.addBtn}><Plus size={22} color={Colors.white} /></TouchableOpacity>}
        {activeTab === "analytics" && <TouchableOpacity onPress={onRefreshOrders} style={s.addBtn}><TrendingUp size={20} color={Colors.white} /></TouchableOpacity>}
      </View>

      {/* TABS */}
      <View style={s.tabBar}>
        {(["products", "banners", "analytics"] as const).map((tab) => {
          const icons = { products: LayoutDashboard, banners: ImageIcon, analytics: BarChart2 };
          const labels = { products: "Mahsulot", banners: "Banner", analytics: "Analitika" };
          const counts = { products: products.length, banners: banners.length, analytics: orders.length };
          const Icon = icons[tab];
          return (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabOn]} onPress={() => setActiveTab(tab)}>
              <Icon size={14} color={activeTab === tab ? "#fff" : Colors.textSecondary} />
              <Text style={[s.tabTxt, activeTab === tab && s.tabTxtOn]}>{labels[tab]}</Text>
              <View style={s.badge}><Text style={s.badgeTxt}>{counts[tab]}</Text></View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ══ PRODUCTS ══ */}
      {activeTab === "products" && (
        <>
          <View style={s.searchBar}>
            <Search size={18} color={Colors.textLight} />
            <TextInput style={s.searchInput} placeholder="Mahsulot qidirish..." placeholderTextColor={Colors.textLight} value={search} onChangeText={setSearch} />
          </View>
          <View style={s.statsBar}>
            <Text style={s.statsTxt}>Jami: {products.length} ta mahsulot</Text>
            <TouchableOpacity onPress={handleReset}><Text style={s.resetTxt}>Asl holatga</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
            {filteredProducts.map((product) => {
              const cat = categories.find((c) => c.id === product.categoryId);
              return (
                <View key={product.id} style={s.productRow}>
                  <Image source={{ uri: product.image }} style={s.productImg} contentFit="cover" />
                  <View style={s.productInfo}>
                    <Text style={s.productName} numberOfLines={1}>{product.nameUz}</Text>
                    <View style={s.productMeta}>
                      {cat && <View style={s.catBadge}><CategoryIcon name={cat.icon} size={12} color={cat.color} /><Text style={s.catTxt}>{cat.nameUz}</Text></View>}
                      <Text style={[s.stockBadge, !product.inStock && s.outStock]}>{product.inStock ? "Mavjud" : "Tugagan"}</Text>
                    </View>
                    <View style={s.priceRow}>
                      <Text style={s.price}>{formatPrice(product.price)}</Text>
                      {product.oldPrice && <Text style={s.oldPrice}>{formatPrice(product.oldPrice)}</Text>}
                      <Text style={s.unit}>/ {product.unit}</Text>
                    </View>
                  </View>
                  <View style={s.actions}>
                    <TouchableOpacity style={s.editBtn} onPress={() => openEditModal(product)}><Pencil size={16} color={Colors.primary} /></TouchableOpacity>
                    <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(product)}><Trash2 size={16} color={Colors.danger} /></TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}

      {/* ══ BANNERS ══ */}
      {activeTab === "banners" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          <Text style={s.hint}>Bosh sahifada aylanib ko'rinadigan reklamalar. "+" bilan yangi banner qo'shing.</Text>
          {banners.map((b) => (
            <View key={b.id} style={[s.bannerRow, { backgroundColor: b.bg }]}>
              <Image source={{ uri: b.image }} style={s.bannerThumb} contentFit="cover" />
              <View style={s.bannerInfo}>
                <Text style={[s.bannerTitle, { color: b.titleColor }]} numberOfLines={1}>{b.title}</Text>
                <Text style={[s.bannerSub, { color: b.subtitleColor }]} numberOfLines={1}>{b.subtitle}</Text>
                <View style={[s.bannerBtn, { backgroundColor: b.btnBg }]}><Text style={[s.bannerBtnTxt, { color: b.btnColor }]}>{b.btnLabel}</Text></View>
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEditBanner(b)}><Pencil size={16} color={Colors.primary} /></TouchableOpacity>
                <TouchableOpacity style={s.delBtn} onPress={() => handleDeleteBanner(b)}><Trash2 size={16} color={Colors.danger} /></TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ══ ANALYTICS ══ */}
      {activeTab === "analytics" && (
        <>
          <View style={an.periodBar}>
            {PERIODS.map((p) => (
              <TouchableOpacity key={p.key} style={[an.periodBtn, period === p.key && an.periodBtnOn]} onPress={() => setPeriod(p.key)}>
                <Text style={[an.periodTxt, period === p.key && an.periodTxtOn]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={an.secBar}>
            {ANALYTICS_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <TouchableOpacity key={sec.key} style={[an.secBtn, analyticsSection === sec.key && an.secBtnOn]} onPress={() => setAnalyticsSection(sec.key)}>
                  <Icon size={13} color={analyticsSection === sec.key ? Colors.primary : Colors.textLight} />
                  <Text style={[an.secTxt, analyticsSection === sec.key && an.secTxtOn]}>{sec.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {ordersLoading ? (
            <View style={an.loadingWrap}><ActivityIndicator size="large" color={Colors.primary} /><Text style={an.loadingTxt}>Yuklanmoqda...</Text></View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={an.scroll}
              refreshControl={<RefreshControl refreshing={ordersRefreshing} onRefresh={onRefreshOrders} tintColor={Colors.primary} />}
            >
              {/* ── OVERVIEW ── */}
              {analyticsSection === "overview" && (
                <>
                  <View style={an.kpiGrid}>
                    <KpiCard icon={<DollarSign size={18} color="#22c55e" />} label="Daromad" value={formatPrice(totalRevenue)} sub={`${revTrend >= 0 ? "+" : ""}${revTrend}%`} trend={revTrend} color="#22c55e"
                      onPress={() => setAnalyticsSection("orders")} />
                    <KpiCard icon={<ShoppingBag size={18} color={Colors.primary} />} label="Buyurtmalar" value={`${filteredOrders.length} ta`} sub={`${pendingCount} kutmoqda`} trend={0} color={Colors.primary}
                      onPress={() => setAnalyticsSection("orders")} />
                  </View>
                  <View style={an.kpiGrid}>
                    <KpiCard icon={<TrendingUp size={18} color="#8b5cf6" />} label="O'rtacha chek" value={formatPrice(avgOrder)} color="#8b5cf6" />
                    <KpiCard icon={<Users size={18} color="#f59e0b" />} label="Mijozlar" value={`${uniqueCustomers} ta`} sub={`Bekor: ${cancelRate}%`} trend={cancelRate > 20 ? -1 : 1} color="#f59e0b"
                      onPress={() => setAnalyticsSection("customers")} />
                  </View>

                  <View style={an.card}>
                    <Text style={an.cardTitle}>Buyurtma holatlari</Text>
                    {(["new", "pending", "confirmed", "delivering", "delivered", "cancelled"]).map((st) => {
                      const cnt = filteredOrders.filter((o) => o.status === st).length;
                      if (cnt === 0) return null;
                      const pct = filteredOrders.length ? (cnt / filteredOrders.length) * 100 : 0;
                      return (
                        <View key={st} style={an.stRow}>
                          <View style={[an.stDot, { backgroundColor: STATUS_COLOR[st] }]} />
                          <Text style={an.stLbl}>{STATUS_LABEL[st]}</Text>
                          <View style={an.stBar}><View style={[an.stFill, { width: `${pct}%` as any, backgroundColor: STATUS_COLOR[st] }]} /></View>
                          <Text style={an.stCnt}>{cnt}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={an.card}>
                    <Text style={an.cardTitle}>Daromad grafigi</Text>
                    <MiniBarChart data={chartData} />
                    <Text style={an.chartNote}>Jami: {formatPrice(totalRevenue)}</Text>
                  </View>

                  <View style={an.card}>
                    <Text style={an.cardTitle}>To'lov usullari</Text>
                    <View style={an.payRow}>
                      {(["cash", "card", "online"]).map((pm) => {
                        const cnt = filteredOrders.filter((o) => o.payment_method === pm).length;
                        const pct = filteredOrders.length ? Math.round((cnt / filteredOrders.length) * 100) : 0;
                        const labels: Record<string, string> = { cash: "💵 Naqd", card: "💳 Karta", online: "📱 Online" };
                        const colors: Record<string, string> = { cash: "#22c55e", card: Colors.primary, online: "#8b5cf6" };
                        return (
                          <View key={pm} style={an.payCard}>
                            <Text style={[an.payPct, { color: colors[pm] }]}>{pct}%</Text>
                            <Text style={an.payLbl}>{labels[pm]}</Text>
                            <Text style={an.payCnt}>{cnt} ta</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}

              {/* ── CUSTOMERS ── */}
              {analyticsSection === "customers" && (
                <>
                  <View style={an.card}>
                    <Text style={an.cardTitle}>ABC Tahlil</Text>
                    <Text style={an.cardSub}>A mijozlar 70% daromad keltiradi (Pareto)</Text>
                    <View style={an.abcRow}>
                      {(["A", "B", "C"] as const).map((cls) => {
                        const cnt = { A: aCount, B: bCount, C: cCount }[cls];
                        const Icon = { A: Crown, B: Star, C: Zap }[cls];
                        return (
                          <View key={cls} style={[an.abcBox, { backgroundColor: ABC_BG[cls] }]}>
                            <Icon size={20} color={ABC_COLOR[cls]} />
                            <Text style={[an.abcClass, { color: ABC_COLOR[cls] }]}>{cls}</Text>
                            <Text style={an.abcCnt}>{cnt} ta</Text>
                            <Text style={an.abcDesc}>{cls === "A" ? "VIP" : cls === "B" ? "Doimiy" : "Yangi"}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {abcCustomers.length === 0
                    ? <Text style={an.empty}>Mijozlar yo'q</Text>
                    : abcCustomers.map((c, i) => {
                      const Icon = { A: Crown, B: Star, C: Zap }[c.class];
                      return (
                        <TouchableOpacity key={c.phone} style={an.custRow} activeOpacity={0.7}
                          onPress={() => { setSelectedCustomer(c); setCustomerDetailVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                          <Text style={an.rank}>#{i + 1}</Text>
                          <View style={[an.abcBadge, { backgroundColor: ABC_BG[c.class] }]}>
                            <Icon size={13} color={ABC_COLOR[c.class]} />
                            <Text style={[an.abcBadgeTxt, { color: ABC_COLOR[c.class] }]}>{c.class}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={an.custName}>{c.name || c.phone}</Text>
                            <Text style={an.custPhone}>{c.phone} · {c.orderCount} buyurtma</Text>
                          </View>
                          <Text style={an.custTotal}>{formatPrice(c.total)}</Text>
                          <ChevronRight size={14} color={Colors.textLight} />
                        </TouchableOpacity>
                      );
                    })}
                </>
              )}

              {/* ── PRODUCTS ── */}
              {analyticsSection === "products" && (
                <>
                  <View style={an.card}>
                    <Text style={an.cardTitle}>Eng ko'p sotilganlar</Text>
                    <Text style={an.cardSub}>Yetkazilgan buyurtmalar asosida • bosib batafsil ko'ring</Text>
                  </View>
                  {topProducts.length === 0
                    ? <Text style={an.empty}>Ma'lumot yo'q</Text>
                    : topProducts.map((p, i) => (
                      <TouchableOpacity key={p.name} style={an.prodRow} activeOpacity={0.7}
                        onPress={() => { setSelectedProduct(p); setProductDetailVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                        <View style={[an.prodRank, i < 3 && { backgroundColor: "#fef3c7" }]}>
                          <Text style={[an.prodRankTxt, i < 3 && { color: "#f59e0b" }]}>#{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={an.prodName}>{p.name}</Text>
                          <View style={an.prodBarWrap}>
                            <View style={[an.prodBar, { width: `${(p.revenue / maxProductRevenue) * 100}%` as any }]} />
                          </View>
                          <Text style={an.prodQty}>{p.qty} dona sotildi</Text>
                        </View>
                        <Text style={an.prodRev}>{formatPrice(p.revenue)}</Text>
                        <ChevronRight size={14} color={Colors.textLight} />
                      </TouchableOpacity>
                    ))}
                </>
              )}

              {/* ── ORDERS ── */}
              {analyticsSection === "orders" && (
                <>
                  <View style={[an.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
                    <Text style={an.cardTitle}>Buyurtmalar</Text>
                    <Text style={an.cardSub}>{filteredOrders.length} ta • bosib batafsil</Text>
                  </View>
                  {filteredOrders.length === 0
                    ? <Text style={an.empty}>Buyurtmalar yo'q</Text>
                    : filteredOrders.slice(0, 100).map((o) => (
                      <TouchableOpacity key={o.id} style={an.orderRow} activeOpacity={0.7}
                        onPress={() => { setSelectedOrder(o); setOrderDetailVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                        <View style={[an.orderDot, { backgroundColor: STATUS_COLOR[o.status] ?? "#888" }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={an.orderName}>{o.customer_name}</Text>
                          <Text style={an.orderPhone}>{o.customer_phone}</Text>
                          <Text style={an.orderItems} numberOfLines={1}>{(o.items || []).map((it) => `${it.name} ×${it.qty}`).join(", ")}</Text>
                          <Text style={an.orderDate}>{new Date(o.created_at).toLocaleDateString("uz-UZ")}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 4 }}>
                          <Text style={an.orderTotal}>{formatPrice(o.total_price ?? 0)}</Text>
                          <View style={[an.orderStatus, { backgroundColor: (STATUS_COLOR[o.status] ?? "#888") + "20" }]}>
                            <Text style={[an.orderStatusTxt, { color: STATUS_COLOR[o.status] ?? "#888" }]}>{STATUS_LABEL[o.status] ?? o.status}</Text>
                          </View>
                          <ChevronRight size={12} color={Colors.textLight} />
                        </View>
                      </TouchableOpacity>
                    ))}
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </>
      )}

      {/* ══ Product Modal ══ */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[s.modal, { paddingTop: Platform.OS === "ios" ? 20 : insets.top }]}>
          <View style={s.modalHdr}>
            <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={Colors.text} /></TouchableOpacity>
            <Text style={s.modalTitle}>{isAdding ? "Yangi mahsulot" : "Tahrirlash"}</Text>
            <TouchableOpacity onPress={handleSave}><Text style={s.saveTxt}>Saqlash</Text></TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalBody}>
              <View style={s.fg}><Text style={s.fl}>Nomi (O'zbekcha) *</Text><TextInput style={s.fi} value={formNameUz} onChangeText={setFormNameUz} placeholder="Masalan: Qizil olma" placeholderTextColor={Colors.textLight} /></View>
              <View style={s.fg}><Text style={s.fl}>Nomi (Inglizcha)</Text><TextInput style={s.fi} value={formName} onChangeText={setFormName} placeholder="Masalan: Red Apples" placeholderTextColor={Colors.textLight} /></View>
              <View style={s.frow}>
                <View style={[s.fg, { flex: 1 }]}><Text style={s.fl}>Narxi (so'm) *</Text><TextInput style={s.fi} value={formPrice} onChangeText={setFormPrice} placeholder="12000" placeholderTextColor={Colors.textLight} keyboardType="numeric" /></View>
                <View style={[s.fg, { flex: 1 }]}><Text style={s.fl}>Eski narx</Text><TextInput style={s.fi} value={formOldPrice} onChangeText={setFormOldPrice} placeholder="15000" placeholderTextColor={Colors.textLight} keyboardType="numeric" /></View>
              </View>
              <View style={s.fg}><Text style={s.fl}>Birlik</Text><View style={s.chipRow}>{units.map((u) => (<TouchableOpacity key={u} style={[s.chip, formUnit === u && s.chipOn]} onPress={() => setFormUnit(u)}><Text style={[s.chipTxt, formUnit === u && s.chipTxtOn]}>{u}</Text></TouchableOpacity>))}</View></View>
              <View style={s.fg}><Text style={s.fl}>Kategoriya</Text><View style={s.chipRow}>{categories.map((cat) => (<TouchableOpacity key={cat.id} style={[s.chip, formCategory === cat.id && s.chipOn]} onPress={() => setFormCategory(cat.id)}><CategoryIcon name={cat.icon} size={14} color={formCategory === cat.id ? Colors.white : cat.color} /><Text style={[s.chipTxt, formCategory === cat.id && s.chipTxtOn]}>{cat.nameUz}</Text></TouchableOpacity>))}</View></View>
              <View style={s.fg}>
                <Text style={s.fl}>Rasm</Text>
                <TouchableOpacity style={[s.imgBtn, imageUploading && { opacity: 0.6 }]} onPress={handlePickImage} disabled={imageUploading}>
                  {imageUploading ? <><ActivityIndicator size="small" color={Colors.primary} /><Text style={s.imgBtnTxt}>Yuklanmoqda...</Text></> : <><ImageIcon size={18} color={Colors.primary} /><Text style={s.imgBtnTxt}>Galereyadan tanlash</Text></>}
                </TouchableOpacity>
                {formImage ? <Image source={{ uri: formImage }} style={s.imgPrev} contentFit="cover" /> : null}
              </View>
              <View style={s.fg}><Text style={s.fl}>Tavsif</Text><TextInput style={[s.fi, { minHeight: 80, textAlignVertical: "top" }]} value={formDescription} onChangeText={setFormDescription} placeholder="Mahsulot haqida..." placeholderTextColor={Colors.textLight} multiline /></View>
              <View style={s.toggleRow}>
                <TouchableOpacity style={[s.toggle, formInStock && s.toggleOn]} onPress={() => setFormInStock(!formInStock)}><Package size={16} color={formInStock ? Colors.white : Colors.text} /><Text style={[s.toggleTxt, formInStock && s.toggleTxtOn]}>Mavjud</Text></TouchableOpacity>
                <TouchableOpacity style={[s.toggle, formIsFeatured && s.toggleOn]} onPress={() => setFormIsFeatured(!formIsFeatured)}><Tag size={16} color={formIsFeatured ? Colors.white : Colors.text} /><Text style={[s.toggleTxt, formIsFeatured && s.toggleTxtOn]}>Mashhur</Text></TouchableOpacity>
                <TouchableOpacity style={[s.toggle, formIsOnSale && s.toggleSale]} onPress={() => setFormIsOnSale(!formIsOnSale)}><ImageIcon size={16} color={formIsOnSale ? Colors.white : Colors.text} /><Text style={[s.toggleTxt, formIsOnSale && s.toggleTxtOn]}>Chegirma</Text></TouchableOpacity>
              </View>
              <View style={{ height: 60 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ══ Banner Modal ══ */}
      <Modal visible={bannerModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBannerModalVisible(false)}>
        <View style={[s.modal, { paddingTop: Platform.OS === "ios" ? 20 : insets.top }]}>
          <View style={s.modalHdr}>
            <TouchableOpacity onPress={() => setBannerModalVisible(false)}><X size={24} color={Colors.text} /></TouchableOpacity>
            <Text style={s.modalTitle}>{isAddingBanner ? "Yangi banner" : "Banner tahrirlash"}</Text>
            <TouchableOpacity onPress={handleSaveBanner}><Text style={s.saveTxt}>Saqlash</Text></TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalBody}>
              <View style={[s.prevCard, { backgroundColor: bBg }]}>
                <View style={s.prevLeft}>
                  <Text style={[s.prevTitle, { color: bTitleColor }]} numberOfLines={2}>{bTitle || "Sarlavha"}</Text>
                  <Text style={[s.prevSub, { color: bSubtitleColor }]} numberOfLines={2}>{bSubtitle || "Qo'shimcha matn"}</Text>
                  <View style={[s.prevBtn, { backgroundColor: bBtnBg }]}><Text style={[s.prevBtnTxt, { color: bBtnColor }]}>{bBtnLabel || "Tugma"}</Text></View>
                </View>
                {bImage ? <Image source={{ uri: bImage }} style={s.prevImg} contentFit="cover" /> : <View style={s.prevImgEmpty}><ImageIcon size={28} color="rgba(0,0,0,0.2)" /></View>}
              </View>
              <View style={s.fg}><Text style={s.fl}>Sarlavha *</Text><TextInput style={s.fi} value={bTitle} onChangeText={setBTitle} placeholder="Masalan: Yangi mahsulotlar" placeholderTextColor={Colors.textLight} /></View>
              <View style={s.fg}><Text style={s.fl}>Qo'shimcha matn</Text><TextInput style={s.fi} value={bSubtitle} onChangeText={setBSubtitle} placeholder="30% gacha chegirmalar!" placeholderTextColor={Colors.textLight} /></View>
              <View style={s.fg}><Text style={s.fl}>Tugma matni</Text><TextInput style={s.fi} value={bBtnLabel} onChangeText={setBBtnLabel} placeholder="Xarid qilish" placeholderTextColor={Colors.textLight} /></View>
              <View style={s.fg}>
                <Text style={s.fl}>Rasm</Text>
                <TouchableOpacity style={[s.imgBtn, bannerImageUploading && { opacity: 0.6 }]} onPress={handlePickBannerImage} disabled={bannerImageUploading}>
                  {bannerImageUploading ? <><ActivityIndicator size="small" color={Colors.primary} /><Text style={s.imgBtnTxt}>Yuklanmoqda...</Text></> : <><ImageIcon size={18} color={Colors.primary} /><Text style={s.imgBtnTxt}>Galereyadan tanlash</Text></>}
                </TouchableOpacity>
              </View>
              <View style={s.fg}>
                <Text style={s.fl}>Rang mavzusi</Text>
                <View style={s.presets}>
                  {COLOR_PRESETS.map((p) => (
                    <TouchableOpacity key={p.label} style={[s.preset, { backgroundColor: p.bg, borderColor: bBg === p.bg ? p.btnBg : "transparent", borderWidth: 2 }]} onPress={() => applyPreset(p)}>
                      <View style={[s.presetDot, { backgroundColor: p.btnBg }]} />
                      <Text style={[s.presetTxt, { color: p.titleColor }]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ height: 60 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ══ Order Detail Modal ══ */}
      <OrderDetailModal
        order={selectedOrder}
        visible={orderDetailVisible}
        onClose={() => setOrderDetailVisible(false)}
        onStatusChange={handleChangeStatus}
      />

      {/* ══ Customer Detail Modal ══ */}
      <CustomerDetailModal
        customer={selectedCustomer}
        visible={customerDetailVisible}
        onClose={() => setCustomerDetailVisible(false)}
        onOrderPress={(order) => {
          setSecondOrder(order);
          setSecondOrderVisible(true);
        }}
      />

      {/* ══ Second Order Detail (from customer modal) ══ */}
      <OrderDetailModal
        order={secondOrder}
        visible={secondOrderVisible}
        onClose={() => setSecondOrderVisible(false)}
        onStatusChange={handleChangeStatus}
      />

      {/* ══ Product Detail Modal ══ */}
      <ProductDetailModal
        product={selectedProduct}
        visible={productDetailVisible}
        onClose={() => setProductDetailVisible(false)}
        orders={orders}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  addBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  tabBar: { flexDirection: "row", margin: 16, marginBottom: 8, backgroundColor: Colors.surfaceSecondary, borderRadius: 14, padding: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 11 },
  tabOn: { backgroundColor: Colors.primary },
  tabTxt: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
  tabTxtOn: { color: "#fff" },
  badge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  badgeTxt: { fontSize: 10, fontWeight: "700", color: "#fff" },
  hint: { fontSize: 13, color: Colors.textSecondary, marginHorizontal: 16, marginBottom: 12, lineHeight: 18 },
  bannerRow: { flexDirection: "row", alignItems: "center", borderRadius: 16, marginBottom: 10, overflow: "hidden", padding: 10 },
  bannerThumb: { width: 72, height: 56, borderRadius: 10 },
  bannerInfo: { flex: 1, marginLeft: 10 },
  bannerTitle: { fontSize: 14, fontWeight: "700" },
  bannerSub: { fontSize: 12, marginTop: 2 },
  bannerBtn: { alignSelf: "flex-start", marginTop: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 },
  bannerBtnTxt: { fontSize: 11, fontWeight: "700" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  statsBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8 },
  statsTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  resetTxt: { fontSize: 13, color: Colors.danger, fontWeight: "600" },
  list: { paddingHorizontal: 16 },
  productRow: { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14, padding: 12, marginBottom: 8, alignItems: "center" },
  productImg: { width: 56, height: 56, borderRadius: 12 },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 15, fontWeight: "600", color: Colors.text },
  productMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  catBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  catTxt: { fontSize: 12, color: Colors.textSecondary },
  stockBadge: { fontSize: 11, fontWeight: "600", color: Colors.success, backgroundColor: "#E8F5EE", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  outStock: { color: Colors.danger, backgroundColor: "#FEE2E2" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 3 },
  price: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  oldPrice: { fontSize: 12, color: Colors.textLight, textDecorationLine: "line-through" },
  unit: { fontSize: 12, color: Colors.textSecondary },
  actions: { flexDirection: "column", gap: 6, marginLeft: 8 },
  editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryLight, justifyContent: "center", alignItems: "center" },
  delBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHdr: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  modalTitle: { fontSize: 17, fontWeight: "700", color: Colors.text, flex: 1, textAlign: "center" },
  saveTxt: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  modalBody: { padding: 16 },
  fg: { marginBottom: 16 },
  fl: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 6, marginLeft: 2 },
  fi: { backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.borderLight },
  frow: { flexDirection: "row", gap: 12, marginBottom: 0 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 4, borderWidth: 1.5, borderColor: Colors.borderLight },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt: { fontSize: 13, fontWeight: "600", color: Colors.text },
  chipTxtOn: { color: Colors.white },
  imgBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: Colors.borderLight },
  imgBtnTxt: { fontSize: 15, fontWeight: "600", color: Colors.primary },
  imgPrev: { width: "100%", height: 150, borderRadius: 12, marginTop: 10 },
  toggleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.borderLight },
  toggleOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleSale: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleTxt: { fontSize: 13, fontWeight: "600", color: Colors.text },
  toggleTxtOn: { color: Colors.white },
  prevCard: { borderRadius: 18, flexDirection: "row", overflow: "hidden", height: 130, marginBottom: 20 },
  prevLeft: { flex: 1, padding: 14, justifyContent: "center" },
  prevTitle: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  prevSub: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  prevBtn: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8 },
  prevBtnTxt: { fontWeight: "700", fontSize: 12 },
  prevImg: { width: 110, height: "100%" as any },
  prevImgEmpty: { width: 110, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.05)" },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  presetDot: { width: 10, height: 10, borderRadius: 5 },
  presetTxt: { fontSize: 13, fontWeight: "600" },
  pinWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, paddingBottom: 80 },
  pinIcon: { width: 80, height: 80, borderRadius: 28, backgroundColor: Colors.primaryLight, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  pinTitle: { fontSize: 22, fontWeight: "800", color: Colors.text },
  pinSub: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 },
  pinRow: { flexDirection: "row", gap: 16, marginTop: 32, marginBottom: 12 },
  pinDot: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, justifyContent: "center", alignItems: "center" },
  pinDotFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  pinDotError: { borderColor: Colors.danger, backgroundColor: "#FEE2E2" },
  pinDotInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary },
  pinDotInnerErr: { backgroundColor: Colors.danger },
  pinHidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
  pinErr: { fontSize: 13, color: Colors.danger, fontWeight: "600", marginTop: 8 },
  pinBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 28 },
  pinBtnOff: { opacity: 0.5 },
  pinBtnTxt: { fontSize: 16, fontWeight: "700", color: Colors.white },
});

const an = StyleSheet.create({
  periodBar: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surfaceSecondary },
  periodBtnOn: { backgroundColor: Colors.primary },
  periodTxt: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  periodTxtOn: { color: "#fff" },
  secBar: { flexDirection: "row", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  secBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  secBtnOn: { borderBottomColor: Colors.primary },
  secTxt: { fontSize: 11, fontWeight: "600", color: Colors.textLight },
  secTxtOn: { color: Colors.primary },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingTxt: { fontSize: 14, color: Colors.textSecondary },
  scroll: { padding: 16, gap: 10 },
  kpiGrid: { flexDirection: "row", gap: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 2 },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  chartNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, textAlign: "right", fontWeight: "600" },
  empty: { textAlign: "center", color: Colors.textLight, fontSize: 14, paddingVertical: 32 },
  stRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  stDot: { width: 8, height: 8, borderRadius: 4 },
  stLbl: { width: 110, fontSize: 12, color: Colors.text, fontWeight: "500" },
  stBar: { flex: 1, height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: "hidden" },
  stFill: { height: "100%" as any, borderRadius: 3 },
  stCnt: { width: 24, fontSize: 12, fontWeight: "700", color: Colors.text, textAlign: "right" },
  payRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  payCard: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, padding: 12, alignItems: "center", gap: 2 },
  payPct: { fontSize: 20, fontWeight: "800" },
  payLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },
  payCnt: { fontSize: 11, color: Colors.textLight },
  abcRow: { flexDirection: "row", gap: 10 },
  abcBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 3 },
  abcClass: { fontSize: 20, fontWeight: "900" },
  abcCnt: { fontSize: 13, fontWeight: "700", color: Colors.text },
  abcDesc: { fontSize: 10, color: Colors.textSecondary, fontWeight: "600" },
  custRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 12, gap: 8 },
  rank: { width: 26, fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  abcBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 },
  abcBadgeTxt: { fontSize: 12, fontWeight: "800" },
  custName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  custPhone: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  custTotal: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  prodRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 12, gap: 10 },
  prodRank: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.borderLight, justifyContent: "center", alignItems: "center" },
  prodRankTxt: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary },
  prodName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  prodBarWrap: { height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, marginVertical: 4, overflow: "hidden" },
  prodBar: { height: "100%" as any, backgroundColor: Colors.primary, borderRadius: 2 },
  prodQty: { fontSize: 11, color: Colors.textSecondary },
  prodRev: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  orderRow: { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14, padding: 12, gap: 10, alignItems: "flex-start" },
  orderDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  orderName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  orderPhone: { fontSize: 11, color: Colors.textSecondary },
  orderItems: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  orderDate: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  orderTotal: { fontSize: 13, fontWeight: "700", color: Colors.text },
  orderStatus: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  orderStatusTxt: { fontSize: 10, fontWeight: "700" },
});

const ch = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 3, paddingTop: 8 },
  col: { flex: 1, alignItems: "center", gap: 3 },
  barWrap: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 3, minHeight: 4, backgroundColor: Colors.primary },
  lbl: { fontSize: 8, color: Colors.textLight, fontWeight: "600" },
});

const kpi = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 14, borderTopWidth: 3 },
  icon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  val: { fontSize: 17, fontWeight: "800", color: Colors.text },
  lbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600", marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 4 },
  sub: { fontSize: 11, fontWeight: "600" },
});

// Order detail styles
const od = StyleSheet.create({
  statusCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 10 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusTxt: { fontSize: 15, fontWeight: "700", flex: 1 },
  statusDate: { fontSize: 12, color: Colors.textSecondary },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  rowTxt: { fontSize: 14, color: Colors.text, flex: 1, lineHeight: 20 },
  noteTxt: { fontSize: 13, color: Colors.textSecondary, fontStyle: "italic" },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  itemName: { flex: 1, fontSize: 13, color: Colors.text },
  itemQty: { fontSize: 13, color: Colors.textSecondary, marginHorizontal: 8 },
  itemPrice: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 6 },
  totalLbl: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.text },
  totalVal: { fontSize: 17, fontWeight: "800", color: Colors.primary },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  statusBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, backgroundColor: Colors.background },
  statusBtnEmoji: { fontSize: 14 },
  statusBtnTxt: { fontSize: 12, fontWeight: "700" },
  avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  custName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  custPhone: { fontSize: 12, color: Colors.textSecondary },
  abcPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  abcPillTxt: { fontSize: 12, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, backgroundColor: Colors.background, borderRadius: 10, padding: 10, alignItems: "center", gap: 2 },
  statVal: { fontSize: 14, fontWeight: "800", color: Colors.text },
  statLbl: { fontSize: 10, color: Colors.textSecondary, textAlign: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, marginTop: 4 },
  orderCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 12, padding: 12, gap: 10 },
  miniDot: { width: 7, height: 7, borderRadius: 3.5 },
  miniStatus: { fontSize: 11, fontWeight: "700" },
  miniDate: { fontSize: 10, color: Colors.textLight, marginLeft: "auto" },
  miniItems: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  miniTotal: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  miniDotPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});

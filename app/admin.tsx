import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ArrowLeft, Plus, Pencil, Trash2, X, Search, Package, Tag,
  ImageIcon, Lock, ShieldCheck, LayoutDashboard,
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Banner = {
  id: string;
  title: string;
  subtitle: string;
  btnLabel: string;
  image: string;
  bg: string;
  titleColor: string;
  subtitleColor: string;
  btnBg: string;
  btnColor: string;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
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

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, categories, addProduct, updateProduct, deleteProduct, resetToDefaults } = useProducts();

  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<"products" | "banners">("products");

  // Products state
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

  // Banners state
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

  // Load banners
  useEffect(() => {
    AsyncStorage.getItem("admin_banners").then((data) => {
      if (data) { try { const p = JSON.parse(data); if (Array.isArray(p) && p.length > 0) setBanners(p); } catch {} }
    });
  }, []);

  const saveBanners = async (next: Banner[]) => {
    setBanners(next);
    await AsyncStorage.setItem("admin_banners", JSON.stringify(next));
  };

  // PIN
  const handlePinSubmit = useCallback(() => {
    if (pinInput === ADMIN_PIN) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setIsAuthenticated(true); setPinError(false); }
    else { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); setPinError(true); setPinInput(""); }
  }, [pinInput]);

  const handlePinChange = useCallback((text: string) => {
    setPinInput(text.replace(/\D/g, "").slice(0, 4)); setPinError(false);
  }, []);

  // Products
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
    const productData = { name: formName.trim() || formNameUz.trim(), nameUz: formNameUz.trim(), price: Number(formPrice), oldPrice: formOldPrice ? Number(formOldPrice) : null, unit: formUnit, image: formImage, categoryId: formCategory, description: formDescription, rating: editingProduct?.rating ?? 4.5, inStock: formInStock, isFeatured: formIsFeatured, isOnSale: formIsOnSale };
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

  // Banners
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

  const units = ["kg", "dona", "litr", "gramm", "paket"];

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
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={22} color={Colors.text} /></TouchableOpacity>
        <Text style={s.headerTitle}>Admin panel</Text>
        <TouchableOpacity onPress={activeTab === "products" ? openAddModal : openAddBanner} style={s.addBtn}>
          <Plus size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tab, activeTab === "products" && s.tabOn]} onPress={() => setActiveTab("products")}>
          <LayoutDashboard size={15} color={activeTab === "products" ? "#fff" : Colors.textSecondary} />
          <Text style={[s.tabTxt, activeTab === "products" && s.tabTxtOn]}>Mahsulotlar</Text>
          <View style={s.badge}><Text style={s.badgeTxt}>{products.length}</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === "banners" && s.tabOn]} onPress={() => setActiveTab("banners")}>
          <ImageIcon size={15} color={activeTab === "banners" ? "#fff" : Colors.textSecondary} />
          <Text style={[s.tabTxt, activeTab === "banners" && s.tabTxtOn]}>Bannerlar</Text>
          <View style={s.badge}><Text style={s.badgeTxt}>{banners.length}</Text></View>
        </TouchableOpacity>
      </View>

      {/* ── PRODUCTS ── */}
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

      {/* ── BANNERS ── */}
      {activeTab === "banners" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
          <Text style={s.hint}>Bosh sahifada aylanib ko'rinadigan reklamalar. "+" bilan yangi banner qo'shing.</Text>
          {banners.map((b) => (
            <View key={b.id} style={[s.bannerRow, { backgroundColor: b.bg }]}>
              <Image source={{ uri: b.image }} style={s.bannerThumb} contentFit="cover" />
              <View style={s.bannerInfo}>
                <Text style={[s.bannerTitle, { color: b.titleColor }]} numberOfLines={1}>{b.title}</Text>
                <Text style={[s.bannerSub, { color: b.subtitleColor }]} numberOfLines={1}>{b.subtitle}</Text>
                <View style={[s.bannerBtn, { backgroundColor: b.btnBg }]}>
                  <Text style={[s.bannerBtnTxt, { color: b.btnColor }]}>{b.btnLabel}</Text>
                </View>
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

      {/* ── Product Modal ── */}
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

      {/* ── Banner Modal ── */}
      <Modal visible={bannerModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setBannerModalVisible(false)}>
        <View style={[s.modal, { paddingTop: Platform.OS === "ios" ? 20 : insets.top }]}>
          <View style={s.modalHdr}>
            <TouchableOpacity onPress={() => setBannerModalVisible(false)}><X size={24} color={Colors.text} /></TouchableOpacity>
            <Text style={s.modalTitle}>{isAddingBanner ? "Yangi banner" : "Banner tahrirlash"}</Text>
            <TouchableOpacity onPress={handleSaveBanner}><Text style={s.saveTxt}>Saqlash</Text></TouchableOpacity>
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalBody}>

              {/* Live preview */}
              <View style={[s.prevCard, { backgroundColor: bBg }]}>
                <View style={s.prevLeft}>
                  <Text style={[s.prevTitle, { color: bTitleColor }]} numberOfLines={2}>{bTitle || "Sarlavha"}</Text>
                  <Text style={[s.prevSub, { color: bSubtitleColor }]} numberOfLines={2}>{bSubtitle || "Qo'shimcha matn"}</Text>
                  <View style={[s.prevBtn, { backgroundColor: bBtnBg }]}><Text style={[s.prevBtnTxt, { color: bBtnColor }]}>{bBtnLabel || "Tugma"}</Text></View>
                </View>
                {bImage
                  ? <Image source={{ uri: bImage }} style={s.prevImg} contentFit="cover" />
                  : <View style={s.prevImgEmpty}><ImageIcon size={28} color="rgba(0,0,0,0.2)" /></View>}
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
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  addBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },

  // Tabs
  tabBar: { flexDirection: "row", margin: 16, marginBottom: 8, backgroundColor: Colors.surfaceSecondary, borderRadius: 14, padding: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 11 },
  tabOn: { backgroundColor: Colors.primary },
  tabTxt: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  tabTxtOn: { color: "#fff" },
  badge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  badgeTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },
  hint: { fontSize: 13, color: Colors.textSecondary, marginHorizontal: 16, marginBottom: 12, lineHeight: 18 },

  // Banner list row
  bannerRow: { flexDirection: "row", alignItems: "center", borderRadius: 16, marginBottom: 10, overflow: "hidden", padding: 10 },
  bannerThumb: { width: 72, height: 56, borderRadius: 10 },
  bannerInfo: { flex: 1, marginLeft: 10 },
  bannerTitle: { fontSize: 14, fontWeight: "700" },
  bannerSub: { fontSize: 12, marginTop: 2 },
  bannerBtn: { alignSelf: "flex-start", marginTop: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 },
  bannerBtnTxt: { fontSize: 11, fontWeight: "700" },

  // Search
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  statsBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8 },
  statsTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  resetTxt: { fontSize: 13, color: Colors.danger, fontWeight: "600" },
  list: { paddingHorizontal: 16 },

  // Product row
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

  // Modal
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHdr: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  modalTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
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

  // Banner modal preview
  prevCard: { borderRadius: 18, flexDirection: "row", overflow: "hidden", height: 130, marginBottom: 20 },
  prevLeft: { flex: 1, padding: 14, justifyContent: "center" },
  prevTitle: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  prevSub: { fontSize: 11, marginTop: 3, lineHeight: 15 },
  prevBtn: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8 },
  prevBtnTxt: { fontWeight: "700", fontSize: 12 },
  prevImg: { width: 110, height: "100%" },
  prevImgEmpty: { width: 110, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.05)" },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  presetDot: { width: 10, height: 10, borderRadius: 5 },
  presetTxt: { fontSize: 13, fontWeight: "600" },

  // PIN
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

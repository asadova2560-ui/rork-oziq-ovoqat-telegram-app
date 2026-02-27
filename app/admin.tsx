import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import React, { useState, useCallback, useMemo } from "react";
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
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Package,
  Tag,
  ImageIcon,
  Lock,
  ShieldCheck,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useProducts } from "@/context/ProductsContext";
import { Product } from "@/types/product";
import { formatPrice } from "@/utils/formatPrice";
import { ADMIN_PIN } from "@/constants/config";
import { CategoryIcon } from "@/components/CategoryIcon";

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "",
  nameUz: "",
  price: 0,
  unit: "kg",
  image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
  categoryId: "fruits",
  description: "",
  rating: 4.5,
  inStock: true,
};

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    resetToDefaults,
  } = useProducts();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);

  const [search, setSearch] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const [formName, setFormName] = useState<string>("");
  const [formNameUz, setFormNameUz] = useState<string>("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formOldPrice, setFormOldPrice] = useState<string>("");
  const [formUnit, setFormUnit] = useState<string>("kg");
  const [formImage, setFormImage] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("fruits");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formInStock, setFormInStock] = useState<boolean>(true);
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formIsOnSale, setFormIsOnSale] = useState<boolean>(false);

  const handlePinSubmit = useCallback(() => {
    if (pinInput === ADMIN_PIN) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinError(true);
      setPinInput("");
    }
  }, [pinInput]);

  const handlePinChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    setPinInput(cleaned);
    setPinError(false);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.nameUz.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    );
  }, [products, search]);

  const openAddModal = useCallback(() => {
    setIsAdding(true);
    setEditingProduct(null);
    setFormName("");
    setFormNameUz("");
    setFormPrice("");
    setFormOldPrice("");
    setFormUnit("kg");
    setFormImage(EMPTY_PRODUCT.image);
    setFormCategory("fruits");
    setFormDescription("");
    setFormInStock(true);
    setFormIsFeatured(false);
    setFormIsOnSale(false);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((product: Product) => {
    setIsAdding(false);
    setEditingProduct(product);
    setFormName(product.name);
    setFormNameUz(product.nameUz);
    setFormPrice(product.price.toString());
    setFormOldPrice(product.oldPrice?.toString() ?? "");
    setFormUnit(product.unit);
    setFormImage(product.image);
    setFormCategory(product.categoryId);
    setFormDescription(product.description);
    setFormInStock(product.inStock);
    setFormIsFeatured(product.isFeatured ?? false);
    setFormIsOnSale(product.isOnSale ?? false);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
  if (!formNameUz.trim()) {
    Alert.alert("Xatolik", "Mahsulot nomini kiriting");
    return;
  }

  if (!formPrice || Number(formPrice) <= 0) {
    Alert.alert("Xatolik", "Narxni to'g'ri kiriting");
    return;
  }

  const productData = {
    name: formName.trim() || formNameUz.trim(),
    nameUz: formNameUz.trim(),
    price: Number(formPrice),
    oldPrice: formOldPrice ? Number(formOldPrice) : null,
    unit: formUnit,
    image: formImage,
    categoryId: formCategory,
    description: formDescription,
    rating: editingProduct?.rating ?? 4.5,
    inStock: formInStock,
    isFeatured: formIsFeatured,
    isOnSale: formIsOnSale,
  };

  if (isAdding) {
    await addProduct(productData);
  } else if (editingProduct) {
    await updateProduct(editingProduct.id, productData);
  }

  setModalVisible(false);
}, [
  formName,
  formNameUz,
  formPrice,
  formOldPrice,
  formUnit,
  formImage,
  formCategory,
  formDescription,
  formInStock,
  formIsFeatured,
  formIsOnSale,
  isAdding,
  editingProduct,
  addProduct,
  updateProduct,
]);
  const handleDelete = useCallback(
    (product: Product) => {
      Alert.alert(
        "O'chirish",
        `"${product.nameUz}" ni o'chirmoqchimisiz?`,
        [
          { text: "Bekor qilish", style: "cancel" },
          {
            text: "O'chirish",
            style: "destructive",
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              deleteProduct(product.id);
            },
          },
        ]
      );
    },
    [deleteProduct]
  );

  const handleReset = useCallback(() => {
    Alert.alert(
      "Asl holatga qaytarish",
      "Barcha mahsulotlar boshlang'ich holatga qaytariladi. Davom etasizmi?",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Qaytarish",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            resetToDefaults();
          },
        },
      ]
    );
  }, [resetToDefaults]);

  const units = ["kg", "dona", "litr", "gramm", "paket"];

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin kirish</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.pinContainer}>
          <View style={styles.pinIconWrap}>
            <Lock size={40} color={Colors.primary} />
          </View>
          <Text style={styles.pinTitle}>PIN kod kiriting</Text>
          <Text style={styles.pinSubtext}>
            Admin panelga kirish uchun 4 xonali PIN kodni kiriting
          </Text>

          <View style={styles.pinInputRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  pinInput.length > i && styles.pinDotFilled,
                  pinError && styles.pinDotError,
                ]}
              >
                {pinInput.length > i && <View style={[styles.pinDotInner, pinError && styles.pinDotInnerError]} />}
              </View>
            ))}
          </View>

          <TextInput
            style={styles.pinHiddenInput}
            value={pinInput}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus
            onSubmitEditing={handlePinSubmit}
            testID="pin-input"
          />

          {pinError && (
            <Text style={styles.pinErrorText}>PIN kod noto'g'ri. Qaytadan urinib ko'ring.</Text>
          )}

          <TouchableOpacity
            style={[styles.pinSubmitBtn, pinInput.length < 4 && styles.pinSubmitBtnDisabled]}
            onPress={handlePinSubmit}
            disabled={pinInput.length < 4}
          >
            <ShieldCheck size={20} color={Colors.white} />
            <Text style={styles.pinSubmitText}>Kirish</Text>
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
        <Text style={styles.headerTitle}>Mahsulotlar boshqaruvi</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Plus size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Mahsulot qidirish..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          Jami: {products.length} ta mahsulot
        </Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetText}>Asl holatga</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {filteredProducts.map((product) => {
          const cat = categories.find((c) => c.id === product.categoryId);
          return (
            <View key={product.id} style={styles.productRow}>
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
                contentFit="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.nameUz}
                </Text>
                <View style={styles.productMeta}>
                  {cat && (
                    <View style={styles.categoryBadge}>
                      <CategoryIcon name={cat.icon} size={12} color={cat.color} />
                      <Text style={styles.productCategory}>{cat.nameUz}</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.stockBadge,
                      !product.inStock && styles.outOfStock,
                    ]}
                  >
                    {product.inStock ? "Mavjud" : "Tugagan"}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>
                    {formatPrice(product.price)}
                  </Text>
                  {product.oldPrice && (
                    <Text style={styles.productOldPrice}>
                      {formatPrice(product.oldPrice)}
                    </Text>
                  )}
                  <Text style={styles.productUnit}>/ {product.unit}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEditModal(product)}
                >
                  <Pencil size={16} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(product)}
                >
                  <Trash2 size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[styles.modalContainer, { paddingTop: Platform.OS === "ios" ? 20 : insets.top }]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isAdding ? "Yangi mahsulot" : "Tahrirlash"}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Saqlash</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.flex}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nomi (O'zbekcha) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formNameUz}
                  onChangeText={setFormNameUz}
                  placeholder="Masalan: Qizil olma"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nomi (Inglizcha)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Masalan: Red Apples"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.flex]}>
                  <Text style={styles.formLabel}>Narxi (so'm) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formPrice}
                    onChangeText={setFormPrice}
                    placeholder="12000"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, styles.flex]}>
                  <Text style={styles.formLabel}>Eski narx</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formOldPrice}
                    onChangeText={setFormOldPrice}
                    placeholder="15000"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Birlik</Text>
                <View style={styles.chipRow}>
                  {units.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.chip,
                        formUnit === u && styles.chipActive,
                      ]}
                      onPress={() => setFormUnit(u)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          formUnit === u && styles.chipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kategoriya</Text>
                <View style={styles.chipRow}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.chip,
                        formCategory === cat.id && styles.chipActive,
                      ]}
                      onPress={() => setFormCategory(cat.id)}
                    >
                      <CategoryIcon
                        name={cat.icon}
                        size={14}
                        color={formCategory === cat.id ? Colors.white : cat.color}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          formCategory === cat.id && styles.chipTextActive,
                        ]}
                      >
                        {cat.nameUz}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
  <Text style={styles.formLabel}>Rasm yuklash</Text>

 <TouchableOpacity
  style={styles.chip}
  onPress={async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled) return;

    const image = result.assets[0];

    const formData = new FormData();
    formData.append("file", {
      uri: image.uri,
      type: "image/jpeg",
      name: "photo.jpg",
    } as any);

    try {
      const res = await fetch(
  "https://mini-app-upload-server.onrender.com/upload",
  {
    method: "POST",
    body: formData,
  }
);

      const data = await res.json();
      setFormImage(data.url);
    } catch (e) {
      Alert.alert("Upload xato");
    }
  }}
>
  <Text>Rasm tanlash</Text>
</TouchableOpacity>

{formImage ? (
  <Image
    source={{ uri: formImage }}
    style={styles.imagePreview}
    contentFit="cover"
  />
) : null}

  {formImage ? (
    <Image
      source={{ uri: formImage }}
      style={styles.imagePreview}
      contentFit="cover"
    />
  ) : null}
</View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tavsif</Text>
                <TextInput
                  style={[styles.formInput, styles.descInput]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Mahsulot haqida..."
                  placeholderTextColor={Colors.textLight}
                  multiline
                />
              </View>

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggle, formInStock && styles.toggleActive]}
                  onPress={() => setFormInStock(!formInStock)}
                >
                  <Package
                    size={16}
                    color={formInStock ? Colors.white : Colors.text}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      formInStock && styles.toggleTextActive,
                    ]}
                  >
                    Mavjud
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggle, formIsFeatured && styles.toggleActive]}
                  onPress={() => setFormIsFeatured(!formIsFeatured)}
                >
                  <Tag
                    size={16}
                    color={formIsFeatured ? Colors.white : Colors.text}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      formIsFeatured && styles.toggleTextActive,
                    ]}
                  >
                    Mashhur
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    formIsOnSale && styles.toggleActiveSale,
                  ]}
                  onPress={() => setFormIsOnSale(!formIsOnSale)}
                >
                  <ImageIcon
                    size={16}
                    color={formIsOnSale ? Colors.white : Colors.text}
                  />
                  <Text
                    style={[
                      styles.toggleText,
                      formIsOnSale && styles.toggleTextActive,
                    ]}
                  >
                    Chegirma
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 60 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  pinContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  pinIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  pinTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },
  pinSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  pinInputRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
    marginBottom: 12,
  },
  pinDot: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  pinDotFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pinDotError: {
    borderColor: Colors.danger,
    backgroundColor: "#FEE2E2",
  },
  pinDotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  pinDotInnerError: {
    backgroundColor: Colors.danger,
  },
  pinHiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  pinErrorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: "600",
    marginTop: 8,
  },
  pinSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 28,
  },
  pinSubmitBtnDisabled: {
    opacity: 0.5,
  },
  pinSubmitText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  resetText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
  },
  productRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  productCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  stockBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.success,
    backgroundColor: "#E8F5EE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  outOfStock: {
    color: Colors.danger,
    backgroundColor: "#FEE2E2",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 3,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  productOldPrice: {
    fontSize: 12,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  productUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: "column",
    gap: 6,
    marginLeft: 8,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  modalContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
    marginLeft: 2,
  },
  formInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  descInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
  },
  imagePreview: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginTop: 10,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleActiveSale: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  toggleTextActive: {
    color: Colors.white,
  },
});

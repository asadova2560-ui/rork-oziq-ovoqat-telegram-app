import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { Product, Category } from "@/types/product";
import { products as defaultProducts } from "@/mocks/products";
import { categories as defaultCategories } from "@/mocks/categories";

const PRODUCTS_KEY = "store_products";
const CATEGORIES_KEY = "store_categories";

export const [ProductsProvider, useProducts] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [categoriesList, setCategoriesList] = useState<Category[]>(defaultCategories);
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      return stored ? (JSON.parse(stored) as Product[]) : defaultProducts;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CATEGORIES_KEY);
      return stored ? (JSON.parse(stored) as Category[]) : defaultCategories;
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: async (items: Product[]) => {
      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const syncCategoriesMutation = useMutation({
    mutationFn: async (items: Category[]) => {
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  useEffect(() => {
    if (productsQuery.data) {
      setProducts(productsQuery.data);
    }
  }, [productsQuery.data]);

  useEffect(() => {
    if (categoriesQuery.data) {
      setCategoriesList(categoriesQuery.data);
    }
  }, [categoriesQuery.data]);

  const addProduct = useCallback(
    (product: Product) => {
      const updated = [...products, product];
      setProducts(updated);
      syncProductsMutation.mutate(updated);
    },
    [products, syncProductsMutation]
  );

  const updateProduct = useCallback(
    (productId: string, updates: Partial<Product>) => {
      const updated = products.map((p) =>
        p.id === productId ? { ...p, ...updates } : p
      );
      setProducts(updated);
      syncProductsMutation.mutate(updated);
    },
    [products, syncProductsMutation]
  );

  const deleteProduct = useCallback(
    (productId: string) => {
      const updated = products.filter((p) => p.id !== productId);
      setProducts(updated);
      syncProductsMutation.mutate(updated);
    },
    [products, syncProductsMutation]
  );

  const resetToDefaults = useCallback(() => {
    setProducts(defaultProducts);
    setCategoriesList(defaultCategories);
    syncProductsMutation.mutate(defaultProducts);
    syncCategoriesMutation.mutate(defaultCategories);
  }, [syncProductsMutation, syncCategoriesMutation]);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const getProductsByCategory = useCallback(
    (categoryId: string) => products.filter((p) => p.categoryId === categoryId),
    [products]
  );

  const featuredProducts = useMemo(
    () => products.filter((p) => p.isFeatured),
    [products]
  );

  const saleProducts = useMemo(
    () => products.filter((p) => p.isOnSale),
    [products]
  );

  return {
    products,
    categories: categoriesList,
    addProduct,
    updateProduct,
    deleteProduct,
    resetToDefaults,
    getProductById,
    getProductsByCategory,
    featuredProducts,
    saleProducts,
    isLoading: productsQuery.isLoading,
  };
});

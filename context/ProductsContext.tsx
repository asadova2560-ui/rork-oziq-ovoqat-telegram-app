import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { Product, Category } from "@/types/product";
import { supabase } from "@/lib/supabase";

export const [ProductsProvider, useProducts] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 FETCH PRODUCTS
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (!error && data) {
      setProducts(data);
    }

    setIsLoading(false);
  };

  // 🔥 FETCH CATEGORIES
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*");

    if (!error && data) {
      setCategories(data);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // 🔥 ADD
  const addProduct = useCallback(async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .insert([product]);

    if (!error) {
      fetchProducts();
    }
  }, []);

  // 🔥 UPDATE
  const updateProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", productId);

      if (!error) {
        fetchProducts();
      }
    },
    []
  );

  // 🔥 DELETE
  const deleteProduct = useCallback(async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (!error) {
      fetchProducts();
    }
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const getProductsByCategory = useCallback(
    (categoryId: string) =>
      products.filter((p) => p.categoryId === categoryId),
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
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductsByCategory,
    featuredProducts,
    saleProducts,
    isLoading,
  };
});

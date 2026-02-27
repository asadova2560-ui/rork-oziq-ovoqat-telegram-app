import { useCallback, useEffect, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { Product, Category } from "@/types/product";
import { supabase } from "@/lib/supabase";

export const [ProductsProvider, useProducts] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==============================
  // FETCH PRODUCTS
  // ==============================
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("FETCH PRODUCTS ERROR:", error);
      return;
    }

    if (data) {
      setProducts(data);
    }

    setIsLoading(false);
  }, []);

  // ==============================
  // FETCH CATEGORIES
  // ==============================
  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*");

    if (error) {
      console.log("FETCH CATEGORIES ERROR:", error);
      return;
    }

    if (data) {
      setCategories(data);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // ==============================
  // ADD PRODUCT
  // ==============================
  const addProduct = useCallback(
    async (product: Omit<Product, "id">) => {
      const { data, error } = await supabase
        .from("products")
        .insert([product])
        .select();

      if (error) {
        console.log("ADD ERROR:", error);
        alert("Xatolik: " + error.message);
        return;
      }

      if (data) {
        setProducts((prev) => [...data, ...prev]);
      }
    },
    []
  );

  // ==============================
  // UPDATE PRODUCT
  // ==============================
  const updateProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", productId)
        .select();

      if (error) {
        console.log("UPDATE ERROR:", error);
        alert("Xatolik: " + error.message);
        return;
      }

      if (data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? data[0] : p))
        );
      }
    },
    []
  );

  // ==============================
  // DELETE PRODUCT
  // ==============================
  const deleteProduct = useCallback(async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.log("DELETE ERROR:", error);
      alert("Xatolik: " + error.message);
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  // ==============================
  // HELPERS
  // ==============================
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

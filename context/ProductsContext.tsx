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
    try {
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
    } catch (err) {
      console.log("FETCH PRODUCTS CRASH:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==============================
  // FETCH CATEGORIES
  // ==============================
  const fetchCategories = useCallback(async () => {
    try {
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
    } catch (err) {
      console.log("FETCH CATEGORIES CRASH:", err);
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
      try {
        const { data, error } = await supabase
          .from("products")
          .insert([product])
          .select();

        if (error) {
          console.log("ADD ERROR:", error);
          alert("Xatolik: " + error.message);
          return;
        }

        if (data && data.length > 0) {
          setProducts((prev) => [data[0], ...prev]);
        }
      } catch (err) {
        console.log("ADD CRASH:", err);
        alert("Server yoki internet xatosi");
      }
    },
    []
  );

  // ==============================
  // UPDATE PRODUCT
  // ==============================
  const updateProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      try {
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

        if (data && data.length > 0) {
          setProducts((prev) =>
            prev.map((p) => (p.id === productId ? data[0] : p))
          );
        }
      } catch (err) {
        console.log("UPDATE CRASH:", err);
        alert("Server yoki internet xatosi");
      }
    },
    []
  );

  // ==============================
  // DELETE PRODUCT
  // ==============================
  const deleteProduct = useCallback(async (productId: string) => {
    try {
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
    } catch (err) {
      console.log("DELETE CRASH:", err);
      alert("Server yoki internet xatosi");
    }
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

export interface Product {
  id: string;
  name: string;
  nameUz: string;
  price: number;
  oldPrice?: number;
  unit: string;
  image: string;
  categoryId: string;
  description: string;
  isFeatured?: boolean;
  isOnSale?: boolean;
  rating: number;
  inStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameUz: string;
  icon: string;
  image: string;
  color: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  weightGrams?: number;
}

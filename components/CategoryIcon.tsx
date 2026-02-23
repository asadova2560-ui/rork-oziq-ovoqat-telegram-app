import React from "react";
import {
  Apple,
  Carrot,
  Milk,
  Beef,
  Croissant,
  Wine,
  Cookie,
  Flame,
  Package,
} from "lucide-react-native";

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Apple,
  Carrot,
  Milk,
  Beef,
  Croissant,
  Wine,
  Cookie,
  Flame,
};

interface CategoryIconProps {
  name: string;
  size: number;
  color: string;
}

function CategoryIconComponent({ name, size, color }: CategoryIconProps) {
  const IconComponent = iconMap[name] ?? Package;
  return <IconComponent size={size} color={color} />;
}

export const CategoryIcon = React.memo(CategoryIconComponent);

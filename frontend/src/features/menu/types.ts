export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuImage {
  id: string;
  menuId: string | null;
  variantId: string | null;
  url: string;
  publicId: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface MenuVariant {
  id: string;
  menuId: string;
  size: string | null;
  price: string;
  images: MenuImage[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  createdAt: string;
  category: Pick<Category, "id" | "name"> | null;
  variants: MenuVariant[];
  images: MenuImage[];
}

export interface MenuVariantInput {
  id?: string;
  size: string | null;
  price: string;
}

export interface MenuDetailsInput {
  categoryId: string;
  name: string;
  description: string | null;
  variants: MenuVariantInput[];
}

export interface CreateMenuItemInput extends MenuDetailsInput {
  menuImages: File[];
  variantImages: File[][];
}

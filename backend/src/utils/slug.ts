export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

export const generateSlug = (title: string): string => {
  const base = slugify(title);
  const suffix = Math.random().toString(36).substring(2, 8);
  return base ? `${base}-${suffix}` : suffix;
};

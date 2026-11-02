import { useId, useState } from "react";
import type { FormEvent } from "react";

import { Modal } from "@/components/Modal";
import { Button, Input } from "@/components/ui";
import type { Category } from "@/features/menu/types";
import { slugify } from "@/lib/slug";

import { useCreateCategory, useUpdateCategory } from "./hooks";

export function CategoryFormDialog({
  category,
  onClose,
}: {
  category?: Category | null;
  onClose: () => void;
}) {
  const formId = useId();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(
    category ? category.slug !== slugify(category.name) : false,
  );
  const [submitted, setSubmitted] = useState(false);

  const pending = createCategory.isPending || updateCategory.isPending;
  const trimmedName = name.trim();
  const finalSlug = slugify(slug.trim() || trimmedName);

  const nameError =
    trimmedName.length === 0
      ? "Enter a category name."
      : trimmedName.length > 50
        ? "Category names can be at most 50 characters."
        : undefined;

  const slugError =
    finalSlug.length === 0
      ? "Enter a slug using letters, numbers, or dashes."
      : finalSlug.length > 120
        ? "Slugs can be at most 120 characters."
        : undefined;

  const handleNameChange = (value: string) => {
    setName(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (nameError || slugError) {
      return;
    }

    const input = { name: trimmedName, slug: finalSlug };

    if (category) {
      updateCategory.mutate(
        { id: category.id, input },
        { onSuccess: onClose },
      );
    } else {
      createCategory.mutate(input, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      open
      onClose={() => {
        if (!pending) {
          onClose();
        }
      }}
      title={category ? "Edit category" : "New category"}
      description={
        category
          ? "Update how this category appears across the public menu."
          : "Group related dishes so guests can browse the menu by craving."
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {category ? "Save changes" : "Create category"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Name"
          value={name}
          maxLength={50}
          autoFocus
          placeholder="e.g. Local dishes"
          onChange={(event) => handleNameChange(event.target.value)}
          error={submitted ? nameError : undefined}
        />
        <Input
          label="Slug"
          value={slug}
          maxLength={120}
          placeholder="local-dishes"
          hint="Used in links. Leave it to follow the name, or edit it yourself."
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          error={submitted ? slugError : undefined}
        />
      </form>
    </Modal>
  );
}

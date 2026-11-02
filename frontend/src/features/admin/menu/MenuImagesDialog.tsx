import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImagePlus, ImageOff, Star, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal } from "@/components/Modal";
import { Button, Spinner } from "@/components/ui";
import type { MenuImage, MenuItem } from "@/features/menu/types";
import { formatPrice } from "@/lib/format";

import {
  useDeleteMenuImage,
  useUploadMenuImages,
  useUploadVariantImages,
} from "./hooks";
import {
  IMAGE_ACCEPT,
  MAX_MENU_IMAGES,
  MAX_VARIANT_IMAGES,
  validateImageFiles,
} from "./image-files";

function PhotoTile({
  image,
  deleting,
  onDelete,
}: {
  image: MenuImage;
  deleting: boolean;
  onDelete: () => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
      {failed ? (
        <div className="flex size-full items-center justify-center text-stone-400">
          <ImageOff className="size-6" aria-hidden="true" />
        </div>
      ) : (
        <img
          src={image.url}
          alt={image.altText ?? "Menu photo"}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}

      {image.isPrimary ? (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
          <Star className="size-3 fill-amber-500 text-amber-500" aria-hidden="true" />
          Primary
        </span>
      ) : null}

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete photo"
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/95 text-stone-600 shadow-sm transition-colors hover:bg-red-600 hover:text-white disabled:opacity-60"
      >
        {deleting ? (
          <Spinner className="size-3.5" />
        ) : (
          <Trash2 className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function UploadTile({
  label,
  busy,
  disabled,
  onFiles,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        disabled={busy || disabled}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";

          if (files.length > 0) {
            onFiles(files);
          }
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy || disabled}
        className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-2 text-center text-[11px] font-medium text-stone-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <Spinner />
        ) : (
          <ImagePlus className="size-5" aria-hidden="true" />
        )}
        {busy ? "Uploading…" : label}
      </button>
    </div>
  );
}

function PhotoSection({
  title,
  subtitle,
  images,
  max,
  uploading,
  uploadDisabled,
  deletingImageId,
  onUpload,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  images: MenuImage[];
  max: number;
  uploading: boolean;
  uploadDisabled: boolean;
  deletingImageId: string | null;
  onUpload: (files: File[]) => void;
  onDelete: (image: MenuImage) => void;
}) {
  const atLimit = images.length >= max;

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
          {subtitle ? (
            <p className="text-xs text-stone-500">{subtitle}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-stone-400">
          {images.length}/{max}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {images.map((image) => (
          <PhotoTile
            key={image.id}
            image={image}
            deleting={deletingImageId === image.id}
            onDelete={() => onDelete(image)}
          />
        ))}
        {!atLimit ? (
          <UploadTile
            label="Add photos"
            busy={uploading}
            disabled={uploadDisabled}
            onFiles={onUpload}
          />
        ) : null}
      </div>

      {images.length === 0 ? (
        <p className="text-xs text-stone-400">No photos yet.</p>
      ) : null}
    </section>
  );
}

export function MenuImagesDialog({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) {
  const uploadMenuImages = useUploadMenuImages();
  const uploadVariantImages = useUploadVariantImages();
  const deleteImage = useDeleteMenuImage();
  const [pendingDelete, setPendingDelete] = useState<MenuImage | null>(null);

  const uploadToMenu = (files: File[]) => {
    const message = validateImageFiles(
      files,
      item.images.length,
      MAX_MENU_IMAGES,
    );

    if (message) {
      toast.error(message);
      return;
    }

    uploadMenuImages.mutate({ menuId: item.id, files });
  };

  const uploadToVariant = (variantId: string, currentCount: number, files: File[]) => {
    const message = validateImageFiles(
      files,
      currentCount,
      MAX_VARIANT_IMAGES,
    );

    if (message) {
      toast.error(message);
      return;
    }

    uploadVariantImages.mutate({ variantId, files });
  };

  const deletingImageId =
    deleteImage.isPending && deleteImage.variables
      ? deleteImage.variables.imageId
      : null;

  const anyUploadPending =
    uploadMenuImages.isPending || uploadVariantImages.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`Photos for ${item.name}`}
      description="Up to 10 photos per dish and per variant. The first photo in each set is chosen automatically as the primary image."
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <PhotoSection
          title="Dish photos"
          subtitle="Shown on the menu card."
          images={item.images}
          max={MAX_MENU_IMAGES}
          uploading={uploadMenuImages.isPending}
          uploadDisabled={anyUploadPending}
          deletingImageId={deletingImageId}
          onUpload={uploadToMenu}
          onDelete={setPendingDelete}
        />

        {item.variants.length > 0 ? (
          <div className="space-y-6 border-t border-stone-200 pt-6">
            <h2 className="text-sm font-semibold text-stone-900">
              Variant photos
            </h2>
            {item.variants.map((variant) => (
              <PhotoSection
                key={variant.id}
                title={variant.size ?? "Standard"}
                subtitle={formatPrice(variant.price)}
                images={variant.images}
                max={MAX_VARIANT_IMAGES}
                uploading={
                  uploadVariantImages.isPending &&
                  uploadVariantImages.variables?.variantId === variant.id
                }
                uploadDisabled={anyUploadPending}
                deletingImageId={deletingImageId}
                onUpload={(files) =>
                  uploadToVariant(variant.id, variant.images.length, files)
                }
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        ) : (
          <p className="border-t border-stone-200 pt-6 text-sm text-stone-500">
            This dish has no variants, so there are no variant photos to manage.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete photo"
        description="This permanently removes the photo from the menu and deletes the file. The next photo, if any, becomes primary."
        confirmLabel="Delete photo"
        tone="danger"
        loading={deleteImage.isPending}
        onConfirm={() => {
          if (!pendingDelete) {
            return;
          }

          deleteImage.mutate(
            { imageId: pendingDelete.id },
            { onSuccess: () => setPendingDelete(null) },
          );
        }}
        onClose={() => {
          if (!deleteImage.isPending) {
            setPendingDelete(null);
          }
        }}
      />
    </Modal>
  );
}

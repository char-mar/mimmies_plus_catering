import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import {
  IMAGE_ACCEPT,
  validateImageFiles,
} from "./image-files";

function FilePreview({
  file,
  disabled,
  onRemove,
}: {
  file: File;
  disabled: boolean;
  onRemove: () => void;
}) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div className="group relative size-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
      <img
        src={url}
        alt={file.name}
        className="size-full object-cover"
      />
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-stone-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function ImagePicker({
  label,
  hint,
  files,
  max,
  disabled = false,
  onChange,
}: {
  label: string;
  hint?: string;
  files: File[];
  max: number;
  disabled?: boolean;
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const atLimit = files.length >= max;

  const handleFiles = (selected: FileList | null) => {
    const incoming = Array.from(selected ?? []);

    if (incoming.length === 0) {
      return;
    }

    const message = validateImageFiles(incoming, files.length, max);

    if (message) {
      setError(message);
      return;
    }

    setError(null);
    onChange([...files, ...incoming]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-700">{label}</p>
          {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
        </div>
        <span className="shrink-0 text-xs tabular-nums text-stone-400">
          {files.length}/{max}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        disabled={disabled || atLimit}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <FilePreview
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            file={file}
            disabled={disabled}
            onRemove={() =>
              onChange(files.filter((_, fileIndex) => fileIndex !== index))
            }
          />
        ))}

        {!atLimit && !disabled ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300 bg-stone-50 text-[11px] font-medium text-stone-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            Add photos
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

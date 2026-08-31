"use client";

import { useRef, useState } from "react";
import {
  GripVertical,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import { uploadPropertyImages } from "@/lib/api";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_IMAGES = 12;

interface PropertyImageUploaderProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
}

export function PropertyImageUploader({
  value = [],
  onChange,
}: PropertyImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const images = value.filter(Boolean);
  const cover = images[0] || null;
  const gallery = images.slice(1);

  const commit = (next: string[]) => {
    onChange?.(next.slice(0, MAX_IMAGES));
  };

  const uploadFiles = async (
    files: FileList | File[],
    mode: "append" | "cover" = "append",
  ) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      setError("Зөвхөн зураг файл сонгоно уу");
      return;
    }

    const remaining = MAX_IMAGES - images.length;
    if (mode === "append" && remaining <= 0) {
      setError(`Хамгийн ихдээ ${MAX_IMAGES} зураг оруулна`);
      return;
    }

    const batch =
      mode === "cover" ? list.slice(0, 1) : list.slice(0, Math.max(remaining, 0));

    setUploading(true);
    setError(null);
    try {
      const urls = await uploadPropertyImages(batch);
      if (mode === "cover") {
        const rest = images.filter((u) => u !== urls[0]);
        commit([urls[0], ...rest]);
      } else {
        commit([...images, ...urls]);
      }
    } catch {
      setError("Зураг оруулахад алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => {
    commit(images.filter((_, i) => i !== index));
  };

  const setAsCover = (index: number) => {
    if (index <= 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    commit([picked, ...next]);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commit(next);
  };

  return (
    <div className="space-y-4">
      <input
        ref={coverInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files, "cover");
          e.target.value = "";
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files, "append");
          e.target.value = "";
        }}
      />

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">Нүүр зураг</p>
          <p className="text-xs text-slate-400">Зарын жагсаалтад харагдана</p>
        </div>

        {cover ? (
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt="Нүүр зураг"
              className="aspect-video w-full object-cover"
            />
            <div className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow">
              Нүүр
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-linear-to-t from-black/55 to-transparent p-3 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                Солих
              </button>
              <button
                type="button"
                onClick={() => removeAt(0)}
                disabled={uploading}
                className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-red-600"
              >
                Устгах
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => coverInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) {
                void uploadFiles(e.dataTransfer.files, "cover");
              }
            }}
            className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition ${
              dragOver
                ? "border-brand bg-brand/5"
                : "border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-brand/3"
            }`}
          >
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-brand" />
            ) : (
              <Upload className="h-7 w-7 text-brand" />
            )}
            <span className="text-sm font-semibold text-slate-800">
              Нүүр зураг оруулах
            </span>
            <span className="px-4 text-center text-xs text-slate-500">
              Чирж оруулах эсвэл дарж сонгох · JPG, PNG, WEBP · 8MB хүртэл
            </span>
          </button>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">Gallery зураг</p>
          <p className="text-xs text-slate-400">
            {images.length}/{MAX_IMAGES}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {gallery.map((url, i) => {
            const index = i + 1;
            return (
              <div
                key={`${url}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-1.5 transition group-hover:bg-black/35">
                  <div className="flex justify-between opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      title="Нүүр болгох"
                      onClick={() => setAsCover(index)}
                      className="rounded-md bg-white/95 p-1 text-amber-600"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Устгах"
                      onClick={() => removeAt(index)}
                      className="rounded-md bg-white/95 p-1 text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      title="Зүүн"
                      disabled={index <= 1}
                      onClick={() => move(index, index - 1)}
                      className="rounded-md bg-white/95 p-1 text-slate-700 disabled:opacity-40"
                    >
                      <GripVertical className="h-3.5 w-3.5 rotate-90" />
                    </button>
                    <button
                      type="button"
                      title="Баруун"
                      disabled={index >= images.length - 1}
                      onClick={() => move(index, index + 1)}
                      className="rounded-md bg-white/95 p-1 text-slate-700 disabled:opacity-40"
                    >
                      <GripVertical className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {images.length < MAX_IMAGES ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-500 transition hover:border-brand/40 hover:bg-brand/3 hover:text-brand"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              <span className="text-[11px] font-semibold">Нэмэх</span>
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {uploading ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Зураг хуулж байна…
        </p>
      ) : (
        <p className="text-xs text-slate-400">
          Эхний зураг нүүр зураг болно. ★ дарж нүүр солино.
        </p>
      )}
    </div>
  );
}

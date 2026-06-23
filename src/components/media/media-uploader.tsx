"use client";

import { useState } from "react";
import { ImageUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMediaLabel } from "@/lib/media-label";

type MediaUploaderProps = {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
};

export function MediaUploader({ mediaUrls, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;

    setError("");
    setUploading(true);

    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch("/api/uploads/media", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message ?? "Upload failed.");
      setUploading(false);
      return;
    }

    onChange([...mediaUrls, ...data.urls]);
    setUploading(false);
  }

  function removeUrl(url: string) {
    onChange(mediaUrls.filter((item) => item !== url));
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-center transition-colors hover:border-primary/60 hover:bg-accent/40">
        <span className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ImageUp className="size-5" />
        </span>
        <span className="text-sm font-medium">Upload image or video</span>
        <span className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WebP, GIF, MP4, WebM, or MOV
        </span>
        <Input
          className="sr-only"
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          disabled={uploading}
          onChange={(event) => {
            uploadFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>

      {uploading ? (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {mediaUrls.length ? (
        <div className="grid gap-3 md:grid-cols-3">
          {mediaUrls.map((url, index) => (
            <div key={url} className="space-y-2 rounded-md border p-2">
              {url.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={url} controls className="h-32 w-full rounded object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-32 w-full rounded object-cover" />
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium">
                  {getMediaLabel(url, index)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeUrl(url)}
                >
                  <X className="size-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

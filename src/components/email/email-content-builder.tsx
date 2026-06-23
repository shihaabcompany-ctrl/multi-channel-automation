"use client";

import { ArrowDown, ArrowUp, Image as ImageIcon, Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMediaLabel } from "@/lib/media-label";
import type { EmailContentBlock } from "@/types/database";

type EmailContentBuilderProps = {
  blocks: EmailContentBlock[];
  mediaUrls: string[];
  onChange: (blocks: EmailContentBlock[]) => void;
};

function createId() {
  return crypto.randomUUID();
}

export function EmailContentBuilder({
  blocks,
  mediaUrls,
  onChange,
}: EmailContentBuilderProps) {
  function addTextBlock() {
    onChange([
      ...blocks,
      {
        id: createId(),
        type: "text",
        content: "",
      },
    ]);
  }

  function addImageBlock() {
    onChange([
      ...blocks,
      {
        id: createId(),
        type: "image",
        url: mediaUrls[0] ?? "",
        alt: "",
      },
    ]);
  }

  function updateBlock(id: string, nextBlock: EmailContentBlock) {
    onChange(blocks.map((block) => (block.id === id ? nextBlock : block)));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((block) => block.id !== id));
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const index = blocks.findIndex((block) => block.id === id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return;

    const nextBlocks = [...blocks];
    const [block] = nextBlocks.splice(index, 1);
    nextBlocks.splice(nextIndex, 0, block);
    onChange(nextBlocks);
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Promotional email layout</h3>
          <p className="text-sm text-muted-foreground">
            Add text and image blocks in the order they should appear.
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addTextBlock}>
            <Type className="size-4" />
            Text
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addImageBlock}
            disabled={!mediaUrls.length}
          >
            <ImageIcon className="size-4" />
            Image
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-md border bg-muted/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                {block.type === "text" ? (
                  <Type className="size-4" />
                ) : (
                  <ImageIcon className="size-4" />
                )}
                {block.type === "text" ? "Text block" : "Image block"}
              </div>

              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveBlock(block.id, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveBlock(block.id, 1)}
                  disabled={index === blocks.length - 1}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeBlock(block.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {block.type === "text" ? (
              <textarea
                value={block.content}
                onChange={(event) =>
                  updateBlock(block.id, {
                    ...block,
                    content: event.target.value,
                  })
                }
                placeholder="Write promotional email text..."
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                <select
                  value={block.url}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      ...block,
                      url: event.target.value,
                    })
                  }
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select uploaded image/video</option>
                  {mediaUrls.map((url, mediaIndex) => (
                    <option key={url} value={url}>
                      {getMediaLabel(url, mediaIndex)}
                    </option>
                  ))}
                </select>

                <input
                  value={block.alt ?? ""}
                  onChange={(event) =>
                    updateBlock(block.id, {
                      ...block,
                      alt: event.target.value,
                    })
                  }
                  placeholder="Image description"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                />
              </div>
            )}
          </div>
        ))}

        {!blocks.length ? (
          <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No email blocks yet. Add text and images to build a promotional
            email.
          </div>
        ) : null}
      </div>
    </div>
  );
}

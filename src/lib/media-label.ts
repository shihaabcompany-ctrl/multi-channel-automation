export function getMediaLabel(url: string, index: number) {
  const extension = url.split("?")[0]?.split(".").pop()?.toLowerCase();
  const type = ["mp4", "webm", "mov"].includes(extension ?? "")
    ? "Video"
    : "Image";

  return `${type} ${index + 1}`;
}

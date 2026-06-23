import type { EmailContentBlock } from "@/types/database";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderEmailContentBlocks(blocks: EmailContentBlock[]) {
  if (!blocks.length) return null;

  const content = blocks
    .map((block) => {
      if (block.type === "text") {
        return `<div style="font-size:16px;line-height:1.65;color:#24333a;margin:0 0 22px 0;white-space:pre-line;">${escapeHtml(block.content)}</div>`;
      }

      return `<img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt ?? "")}" style="display:block;width:100%;max-width:640px;height:auto;border-radius:14px;margin:22px auto;" />`;
    })
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f3f7f8;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7f8;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #dbe5e7;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:30px;">
                ${content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

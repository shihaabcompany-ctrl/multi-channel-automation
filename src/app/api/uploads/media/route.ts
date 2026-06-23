import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(request: Request) {
  const session = await requireCompanyUser();
  const formData = await request.formData();
  const files = formData.getAll("files").filter((item) => item instanceof File);

  if (!files.length) {
    return NextResponse.json({ message: "No files uploaded." }, { status: 400 });
  }

  const uploadedUrls: string[] = [];

  for (const file of files) {
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        { message: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop() || "bin";
    const path = `${session.companyId}/${crypto.randomUUID()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabaseAdmin.storage
      .from("campaign-media")
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage
      .from("campaign-media")
      .getPublicUrl(path);

    uploadedUrls.push(data.publicUrl);
  }

  return NextResponse.json({ urls: uploadedUrls });
}
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompanyUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const importSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .min(1),
});

export async function POST(request: Request, { params }: Params) {
  const session = await requireCompanyUser();
  const { id: groupId } = await params;
  const body = await request.json();
  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid contacts import data." },
      { status: 400 }
    );
  }

  const { data: group } = await supabaseAdmin
    .from("contact_groups")
    .select("id")
    .eq("id", groupId)
    .eq("company_id", session.companyId)
    .single();

  if (!group) {
    return NextResponse.json({ message: "Group not found." }, { status: 404 });
  }

  const cleanContacts = parsed.data.contacts
    .map((contact) => {
      const email = contact.email?.trim().toLowerCase() || null;
      const phone = contact.phone?.trim() || null;
      const name = contact.name?.trim() || email || phone || "Imported Contact";

      return { name, email, phone };
    })
    .filter((contact) => contact.email || contact.phone);

  if (!cleanContacts.length) {
    return NextResponse.json(
      { message: "No valid contacts found. Each row needs email or phone." },
      { status: 400 }
    );
  }

  const { data: existingContacts, error: existingError } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("company_id", session.companyId);

  if (existingError) {
    return NextResponse.json({ message: existingError.message }, { status: 500 });
  }

  const existing = existingContacts ?? [];
  const contactIds: string[] = [];
  let created = 0;
  let reused = 0;

  for (const contact of cleanContacts) {
    const match = existing.find((existingContact) => {
      const emailMatches =
        contact.email && existingContact.email?.toLowerCase() === contact.email;
      const phoneMatches = contact.phone && existingContact.phone === contact.phone;

      return emailMatches || phoneMatches;
    });

    if (match) {
      contactIds.push(match.id);
      reused += 1;
      continue;
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("contacts")
      .insert({
        company_id: session.companyId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ message: insertError.message }, { status: 500 });
    }

    contactIds.push(inserted.id);
    created += 1;
  }

  const memberships = [...new Set(contactIds)].map((contactId) => ({
    group_id: groupId,
    contact_id: contactId,
  }));

  const { error: membersError } = await supabaseAdmin
    .from("contact_group_members")
    .upsert(memberships);

  if (membersError) {
    return NextResponse.json({ message: membersError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    created,
    reused,
    assigned: memberships.length,
  });
}
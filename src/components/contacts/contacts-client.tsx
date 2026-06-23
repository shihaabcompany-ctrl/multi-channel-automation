"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContactsClient({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return contacts;

    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query)
      );
    });
  }, [contacts, search]);

  async function createContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setLoading(true);

    const response = await fetch("/api/contacts", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: String(formData.get("phone") ?? "").trim(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Could not create contact.");
      setLoading(false);
      return;
    }

    form.reset();
    setLoading(false);
    router.refresh();
  }

  async function updateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingContact) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setLoading(true);

    const response = await fetch(`/api/contacts/${editingContact.id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: String(formData.get("phone") ?? "").trim(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Could not update contact.");
      setLoading(false);
      return;
    }

    setEditingContact(null);
    setLoading(false);
    router.refresh();
  }

  async function deleteContact(id: string) {
    await fetch(`/api/contacts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="app-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <Input
          className="md:max-w-sm"
          placeholder="Search contacts..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <Button asChild variant="outline">
          {/* API download endpoint needs a regular anchor. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/contacts/export">Export CSV</a>
        </Button>
      </div>

      <form
        onSubmit={editingContact ? updateContact : createContact}
        className="app-panel grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]"
      >
        <Input
          name="name"
          placeholder="Name"
          required
          defaultValue={editingContact?.name ?? ""}
          key={`name-${editingContact?.id ?? "new"}`}
        />

        <Input
          name="email"
          type="email"
          placeholder="Email"
          defaultValue={editingContact?.email ?? ""}
          key={`email-${editingContact?.id ?? "new"}`}
        />

        <Input
          name="phone"
          placeholder="Phone"
          defaultValue={editingContact?.phone ?? ""}
          key={`phone-${editingContact?.id ?? "new"}`}
        />

        <Button type="submit" disabled={loading}>
          {loading
            ? editingContact
              ? "Saving..."
              : "Adding..."
            : editingContact
              ? "Save"
              : "Add Contact"}
        </Button>

        {editingContact ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditingContact(null)}
          >
            Cancel
          </Button>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive md:col-span-5">{error}</p>
        ) : null}
      </form>

      <div className="app-panel overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
              <div>Name</div>
              <div>Email</div>
              <div>Phone</div>
              <div className="text-right">Actions</div>
            </div>

            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="grid grid-cols-4 items-center border-b px-4 py-3 text-sm last:border-b-0"
              >
                <div className="font-medium">{contact.name}</div>
                <div className="text-muted-foreground">{contact.email ?? "-"}</div>
                <div className="text-muted-foreground">{contact.phone ?? "-"}</div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingContact(contact)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteContact(contact.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {!filteredContacts.length ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                No contacts found.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

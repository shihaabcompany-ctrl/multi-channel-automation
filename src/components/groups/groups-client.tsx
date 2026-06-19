"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact, ContactGroup } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GroupMemberRow = {
  group_id: string;
  contact_id: string;
};

type GroupsClientProps = {
  groups: ContactGroup[];
  contacts: Contact[];
  members: GroupMemberRow[];
};

export function GroupsClient({ groups, contacts, members }: GroupsClientProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const contactsByGroupId = useMemo(() => {
    return groups.reduce<Record<string, Contact[]>>((acc, group) => {
      const contactIds = new Set(
        members
          .filter((member) => member.group_id === group.id)
          .map((member) => member.contact_id)
      );

      acc[group.id] = contacts.filter((contact) => contactIds.has(contact.id));
      return acc;
    }, {});
  }, [contacts, groups, members]);

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setLoading(true);

    const response = await fetch("/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Could not create group.");
      setLoading(false);
      return;
    }

    form.reset();
    setLoading(false);
    router.refresh();
  }

  async function deleteGroup(id: string) {
    await fetch(`/api/groups/${id}`, {
      method: "DELETE",
    });

    router.refresh();
  }

  async function addMember(groupId: string, contactId: string) {
    if (!contactId) return;

    await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contactId }),
    });

    router.refresh();
  }

  async function removeMember(groupId: string, contactId: string) {
    await fetch(`/api/groups/${groupId}/members/${contactId}`, {
      method: "DELETE",
    });

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createGroup}
        className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row"
      >
        <Input name="name" placeholder="Group name" required />

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Group"}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      <div className="grid gap-4">
        {groups.map((group) => {
          const groupContacts = contactsByGroupId[group.id] ?? [];
          const memberIds = new Set(groupContacts.map((contact) => contact.id));
          const availableContacts = contacts.filter(
            (contact) => !memberIds.has(contact.id)
          );

          return (
            <div key={group.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{group.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {groupContacts.length} contacts
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteGroup(group.id)}
                >
                  Delete Group
                </Button>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  defaultValue=""
                  onChange={(event) => {
                    addMember(group.id, event.target.value);
                    event.currentTarget.value = "";
                  }}
                >
                  <option value="">Add contact...</option>
                  {availableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.email ? `(${contact.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 space-y-2">
                {groupContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      {contact.name}{" "}
                      <span className="text-muted-foreground">
                        {contact.email ?? contact.phone ?? ""}
                      </span>
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMember(group.id, contact.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                {!groupContacts.length ? (
                  <p className="text-sm text-muted-foreground">
                    No contacts in this group yet.
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}

        {!groups.length ? (
          <div className="rounded-lg border px-4 py-6 text-sm text-muted-foreground">
            No groups yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
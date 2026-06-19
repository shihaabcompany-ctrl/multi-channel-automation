alter table companies enable row level security;
alter table users enable row level security;
alter table contacts enable row level security;
alter table contact_groups enable row level security;
alter table contact_group_members enable row level security;
alter table automations enable row level security;
alter table messages_log enable row level security;

create policy "service_role_full_access_companies"
on companies
for all
to service_role
using (true)
with check (true);

create policy "service_role_full_access_users"
on users
for all
to service_role
using (true)
with check (true);

create policy "service_role_full_access_contacts"
on contacts
for all
to service_role
using (true)
with check (true);

create policy "service_role_full_access_contact_groups"
on contact_groups
for all
to service_role
using (true)
with check (true);

create policy "service_role_full_access_contact_group_members"
on contact_group_members
for all
to service_role
using (true)
with check (true);

create policy "service_role_full_access_automations"
on automations
for all
to service_role
using (true)
with check (true);

create policy "service_role_full_access_messages_log"
on messages_log
for all
to service_role
using (true)
with check (true);
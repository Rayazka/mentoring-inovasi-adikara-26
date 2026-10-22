-- TODO: Jalankan pengujian integrasi aplikasi dan kebijakan Storage pada project staging sebelum rilis.
-- Prasyarat: migrasi fondasi autentikasi; jalankan sekali melalui migrasi atau paket SQL Editor.
begin;
create schema if not exists private;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;
alter type public.user_role add value if not exists 'mentor_general';
alter table public.profiles add column if not exists is_active boolean not null default true;

create table public.event_settings (
  singleton boolean primary key default true check (singleton),
  dates date[] not null default array[date '2026-10-24', date '2026-10-25'] check (cardinality(dates)>0),
  day_start time not null default '18:30', day_end time not null default '22:00',
  session_minutes integer not null default 15 check (session_minutes between 5 and 180),
  buffer_minutes integer not null default 5 check (buffer_minutes between 0 and 60),
  discord_url text not null default 'https://discord.gg/YR2W6vBzt' check (discord_url ~ '^https://[^[:space:]]+$'),
  updated_at timestamptz not null default now(), check(day_end>day_start)
);
insert into public.event_settings(singleton) values(true);

create table public.teams (
  id uuid primary key default gen_random_uuid(), name text not null check(length(btrim(name)) between 1 and 80),
  category text not null check(length(btrim(category)) between 1 and 40),
  description text not null default '' check(length(description)<=500),
  leader_id uuid not null references public.profiles(id) on delete restrict,
  archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index teams_unique_active_name on public.teams(lower(btrim(name))) where not archived;
create table public.team_members (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  joined_at timestamptz not null default now()
);
create index team_members_team_idx on public.team_members(team_id);
create table public.team_join_requests (
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id),
  user_id uuid not null references public.profiles(id), note text not null check(length(btrim(note)) between 1 and 500),
  status text not null default 'pending' check(status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references public.profiles(id)
);
create unique index team_join_pending_unique on public.team_join_requests(team_id,user_id) where status='pending';
create index team_join_user_idx on public.team_join_requests(user_id,status);
create table public.works (
  team_id uuid primary key references public.teams(id), title text not null default '' check(length(title)<=150),
  description text not null default '' check(length(description)<=5000), is_draft boolean not null default true,
  updated_by uuid not null references public.profiles(id), updated_at timestamptz not null default now(),
  check(is_draft or (length(btrim(title))>0 and length(btrim(description))>0))
);
create table public.mentors (
  id uuid primary key default gen_random_uuid(), name text not null check(length(btrim(name)) between 1 and 120),
  title text not null default '' check(length(title)<=200), expertise text not null check(expertise in ('UI/UX','Softdev','IoT','Gamedev')),
  bio text not null default '' check(length(bio)<=5000), achievements text[] not null default '{}',
  photo_url text check(photo_url is null or photo_url ~ '^https://[^[:space:]]+$'),
  available_dates date[] not null default array[date '2026-10-24',date '2026-10-25'],
  active boolean not null default true, archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.mentor_slots (
  id uuid primary key default gen_random_uuid(), mentor_id uuid not null references public.mentors(id) on delete restrict,
  starts_at timestamptz not null, ends_at timestamptz not null, buffer_ends_at timestamptz not null,
  enabled boolean not null default true, created_at timestamptz not null default now(),
  check(starts_at<ends_at and ends_at<=buffer_ends_at),
  unique(mentor_id,starts_at),
  exclude using gist(mentor_id with =, tstzrange(starts_at,buffer_ends_at,'[)') with &&) where(enabled)
);
create index mentor_slots_date_idx on public.mentor_slots(starts_at,mentor_id);
create table public.documents (
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id),
  kind text not null check(kind in ('file','drive')), title text not null check(length(btrim(title)) between 1 and 150),
  drive_url text, object_path text unique, filename text, bytes bigint, mime_type text,
  uploaded_by uuid not null references public.profiles(id), ready boolean not null default false,
  inaccessible boolean not null default false, deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check((kind='drive' and drive_url is not null and drive_url ~ '^https://(drive\.google\.com|docs\.google\.com)/[^[:space:]]+$'
    and object_path is null and bytes is null)
    or (kind='file' and drive_url is null and object_path is not null and filename is not null
    and bytes is not null and bytes between 1 and 10485760 and mime_type is not null and mime_type in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation','image/png','image/jpeg')))
);
create index documents_team_idx on public.documents(team_id) where deleted_at is null;
create sequence public.request_number_seq start 1;
create table public.mentoring_requests (
  id uuid primary key default gen_random_uuid(), code text not null unique default ('MT-'||lpad(nextval('public.request_number_seq')::text,6,'0')),
  team_id uuid not null references public.teams(id), mentor_id uuid not null references public.mentors(id),
  slot_id uuid not null references public.mentor_slots(id) on delete restrict,
  status text not null default 'pending' check(status in ('pending','revision_requested','approved','rejected','cancelled','completed')),
  title_snapshot text not null check(length(btrim(title_snapshot)) between 1 and 150),
  description_snapshot text not null check(length(btrim(description_snapshot)) between 1 and 5000),
  meeting_url text check(meeting_url is null or meeting_url ~ '^https://[^[:space:]]+$'),
  decision_note text not null default '', revision_kind text check(revision_kind in ('work','schedule','both')),
  submitted_by uuid not null references public.profiles(id), submission_key uuid not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(submitted_by,submission_key), check(status<>'approved' or meeting_url is not null)
);
create unique index requests_one_pending_per_team on public.mentoring_requests(team_id) where status in ('pending','revision_requested');
create index requests_team_idx on public.mentoring_requests(team_id,created_at desc);
create index requests_mentor_idx on public.mentoring_requests(mentor_id,status);
create table public.request_documents (
  request_id uuid not null references public.mentoring_requests(id), document_id uuid not null references public.documents(id),
  title_snapshot text not null, primary key(request_id,document_id)
);
create table public.bookings (
  request_id uuid primary key references public.mentoring_requests(id), mentor_id uuid not null references public.mentors(id),
  team_id uuid not null references public.teams(id), starts_at timestamptz not null, ends_at timestamptz not null,
  buffer_ends_at timestamptz not null, active boolean not null default true,
  check(starts_at<ends_at and ends_at<=buffer_ends_at),
  exclude using gist(mentor_id with =, tstzrange(starts_at,buffer_ends_at,'[)') with &&) where(active),
  exclude using gist(team_id with =, tstzrange(starts_at,buffer_ends_at,'[)') with &&) where(active)
);
create table public.reschedule_proposals (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.mentoring_requests(id),
  slot_id uuid not null references public.mentor_slots(id), proposed_by uuid not null references public.profiles(id),
  reason text not null check(length(btrim(reason)) between 1 and 2000),
  status text not null default 'pending' check(status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(), responded_at timestamptz, responded_by uuid references public.profiles(id)
);
create unique index reschedule_one_pending on public.reschedule_proposals(request_id) where status='pending';
create table public.request_events (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.mentoring_requests(id),
  actor_id uuid not null references public.profiles(id), action text not null, note text not null default '', created_at timestamptz not null default now()
);
create index request_events_request_idx on public.request_events(request_id,created_at);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  title text not null, href text not null check(href like '/%'), read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), action text not null,
  entity text not null, entity_id text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.resource_links (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
  url text not null check(url ~ '^https://[^[:space:]]+$'), active boolean not null default true, sort_order integer not null default 0
);
insert into public.resource_links(slug,title,url,sort_order) values
  ('proposal','Template Proposal','https://helloprodigi.pro/TemplateProposalADIKARA2026',1),
  ('guidebook','Guidebook ADIKARA 2026','https://helloprodigi.pro/GuidebookADIKARA2026',2),
  ('twibbon','Twibbon & Caption','https://helloprodigi.pro/TwibbonADIKARA2026',3),
  ('registration','Pendaftaran','https://helloprodigi.pro/PendaftaranAdikara2026',4);

-- Mengambil peran yang ditetapkan server; metadata pengguna tidak dipakai untuk otorisasi.
create function private.app_role() returns text language sql stable security definer set search_path='' as $$
  select p.role::text from public.profiles p where p.id=(select auth.uid()) and p.is_active
$$;
-- Memeriksa hak admin aktif tanpa rekursi kebijakan profil.
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(private.app_role()='admin',false)
$$;
-- Membatasi akses umum mentoring pada admin dan akun Mentor General yang aktif.
create function private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(private.app_role() in ('admin','mentor_general'),false)
$$;
-- Memeriksa keanggotaan saat ini agar mantan anggota kehilangan akses tim.
create function private.is_member(p_team uuid) returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(private.app_role()='participant',false) and exists(select 1 from public.team_members m where m.team_id=p_team and m.user_id=(select auth.uid()))
$$;
-- Memeriksa kepemimpinan tim yang belum diarsipkan.
create function private.is_leader(p_team uuid) returns boolean language sql stable security definer set search_path='' as $$
  select private.is_member(p_team) and exists(select 1 from public.teams t where t.id=p_team and t.leader_id=(select auth.uid()) and not t.archived)
$$;
-- Memeriksa akses baca konteks mentoring tanpa membuka profil pribadi seluruh peserta.
create function private.can_read_team(p_team uuid) returns boolean language sql stable security definer set search_path='' as $$
  select private.is_staff() or private.is_member(p_team)
$$;
-- Memeriksa akses baca pengajuan beserta turunannya melalui tim pemilik.
create function private.can_read_request(p_request uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.mentoring_requests r where r.id=p_request and private.can_read_team(r.team_id))
$$;
-- Mengizinkan tampilan nama rekan satu tim tanpa memberikan akses nama semua akun.
create function private.same_team(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.team_members a join public.team_members b on a.team_id=b.team_id
    where a.user_id=(select auth.uid()) and b.user_id=p_user and private.is_member(a.team_id))
$$;
-- Mengharuskan sesi dan peran aktif sebelum menjalankan operasi berprivilege.
create function private.require_role(p_roles text[]) returns uuid language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not coalesce(private.app_role()=any(p_roles),false) then
    raise exception 'Sesi atau hak akses tidak sesuai.' using errcode='42501';
  end if;
  return auth.uid();
end $$;
-- Memastikan pengelola berhak mengubah tim tujuan dan mengunci tim selama transaksi.
create function private.lock_managed_team(p_team uuid) returns public.teams language plpgsql security definer set search_path='' as $$
declare t public.teams;
begin
  perform private.require_role(array['participant','admin']);
  select * into t from public.teams where id=p_team for update;
  if t.id is null or t.archived or not(private.is_admin() or private.is_leader(p_team)) then
    raise exception 'Hanya ketua tim atau admin yang dapat mengelola tim ini.' using errcode='42501';
  end if;
  return t;
end $$;
-- Mencatat perubahan otomatis tanpa menyimpan password atau isi dokumen ke audit.
create function private.audit_mutation() returns trigger language plpgsql security definer set search_path='' as $$
declare item jsonb;
begin
  if tg_op='DELETE' then item=to_jsonb(old); else item=to_jsonb(new); end if;
  insert into public.audit_events(actor_id,action,entity,entity_id,detail)
  values(auth.uid(),tg_op,tg_table_name,coalesce(item->>'id',item->>'team_id',item->>'user_id',item->>'singleton',''),
    jsonb_build_object('operation',tg_op));
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
-- Menegakkan kapasitas dan peran anggota pada setiap penambahan, termasuk operasi admin.
create function private.guard_membership() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform 1 from public.profiles where id=new.user_id and role::text='participant' and is_active for update;
  if not found then raise exception 'Anggota harus akun peserta aktif.'; end if;
  perform 1 from public.teams where id=new.team_id and not archived for update;
  if not found then raise exception 'Tim tidak tersedia.'; end if;
  if (select count(*) from public.team_members where team_id=new.team_id and user_id<>new.user_id)>=3 then
    raise exception 'Tim penuh, maksimal tiga anggota termasuk ketua.';
  end if;
  return new;
end $$;
create trigger team_members_capacity before insert or update on public.team_members for each row execute function private.guard_membership();
-- Memastikan setiap tim aktif tetap mempunyai ketua yang merupakan anggota pada akhir transaksi.
create function private.guard_team_leader() returns trigger language plpgsql security definer set search_path='' as $$
declare tid uuid;
begin
  if tg_table_name='teams' then tid=new.id;
  elsif tg_op='DELETE' then tid=old.team_id; else tid=new.team_id; end if;
  if exists(select 1 from public.teams t where t.id=tid and not t.archived and not exists(
    select 1 from public.team_members m where m.team_id=t.id and m.user_id=t.leader_id)) then
    raise exception 'Ketua harus tetap menjadi anggota tim aktif.';
  end if;
  if tg_table_name='team_members' and tg_op='UPDATE' then
    if old.team_id<>new.team_id and exists(select 1 from public.teams t where t.id=old.team_id and not t.archived
      and not exists(select 1 from public.team_members m where m.team_id=t.id and m.user_id=t.leader_id)) then
      raise exception 'Ketua tim asal harus tetap menjadi anggota aktif.';
    end if;
  end if;
  return null;
end $$;
create constraint trigger teams_require_leader after insert or update on public.teams deferrable initially deferred for each row execute function private.guard_team_leader();
create constraint trigger members_require_leader after insert or update or delete on public.team_members deferrable initially deferred for each row execute function private.guard_team_leader();
-- Melindungi slot terbooking dan memvalidasi slot baru terhadap aturan operasional WIB.
create function private.guard_slot() returns trigger language plpgsql security definer set search_path='' as $$
declare s public.event_settings; m public.mentors; local_start timestamp; local_end timestamp;
begin
  if tg_op<>'INSERT' then
    if tg_op='UPDATE' and new.mentor_id<>old.mentor_id then raise exception 'Pemilik slot tidak dapat diganti.'; end if;
    perform 1 from public.mentors where id=old.mentor_id for update;
    if exists(select 1 from public.mentoring_requests r join public.bookings b on b.request_id=r.id
      where r.slot_id=old.id and b.active) then
      if tg_op='DELETE' then raise exception 'Slot terbooking tidak dapat dihapus. Reschedule atau batalkan sesi terlebih dahulu.'; end if;
      if row(new.starts_at,new.ends_at,new.buffer_ends_at,new.enabled) is distinct from row(old.starts_at,old.ends_at,old.buffer_ends_at,old.enabled) then
        raise exception 'Slot terbooking dilindungi; gunakan alur reschedule.';
      end if;
      return new;
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  select * into m from public.mentors where id=new.mentor_id for update;
  select * into s from public.event_settings where singleton;
  local_start=new.starts_at at time zone 'Asia/Jakarta'; local_end=new.buffer_ends_at at time zone 'Asia/Jakarta';
  if not(local_start::date=any(s.dates)) or not(local_start::date=any(m.available_dates))
    or local_start::date<>local_end::date or local_start::time<s.day_start or local_end::time>s.day_end
    or new.ends_at-new.starts_at<>make_interval(mins=>s.session_minutes)
    or new.buffer_ends_at-new.ends_at<>make_interval(mins=>s.buffer_minutes) then
    raise exception 'Slot tidak sesuai hari, jam, durasi atau jeda operasional.';
  end if;
  return new;
end $$;
create trigger mentor_slots_guard before insert or update or delete on public.mentor_slots for each row execute function private.guard_slot();
-- Mengunci mentor lalu slot dalam urutan yang sama dengan pengelolaan jadwal untuk menghindari deadlock.
create function private.lock_available_slot(p_slot uuid) returns public.mentor_slots language plpgsql security definer set search_path='' as $$
declare mid uuid; s public.mentor_slots;
begin
  select mentor_id into mid from public.mentor_slots where id=p_slot;
  perform 1 from public.mentors where id=mid and active and not archived for update;
  if not found then raise exception 'Mentor tidak tersedia.'; end if;
  select * into s from public.mentor_slots where id=p_slot and enabled for update;
  if s.id is null or s.starts_at<=now() or not exists(select 1 from public.mentors m where m.id=mid
    and (s.starts_at at time zone 'Asia/Jakarta')::date=any(m.available_dates)) then
    raise exception 'Slot tidak tersedia atau sudah lewat.';
  end if;
  return s;
end $$;
-- Menambahkan jejak keputusan dan memberi pemberitahuan kepada anggota tim saat ini.
create function private.record_request_event(p_request uuid,p_action text,p_note text) returns void language plpgsql security definer set search_path='' as $$
begin
  insert into public.request_events(request_id,actor_id,action,note) values(p_request,auth.uid(),p_action,coalesce(p_note,''));
  insert into public.notifications(user_id,title,href)
    select m.user_id,p_action,'/peserta/pengajuan/'||p_request::text from public.team_members m
    join public.mentoring_requests r on r.team_id=m.team_id where r.id=p_request;
end $$;

-- Seluruh tabel baru menolak akses sampai kebijakan dan hak yang eksplisit diberikan di bawah.
do $policies$
declare tbl text;
begin
  foreach tbl in array array['event_settings','teams','team_members','team_join_requests','works','mentors','mentor_slots','documents',
    'mentoring_requests','request_documents','bookings','reschedule_proposals','request_events','notifications','audit_events','resource_links'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('revoke all on public.%I from anon, authenticated',tbl);
    execute format('grant select on public.%I to authenticated',tbl);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_mutation()',tbl||'_audit',tbl);
  end loop;
end $policies$;
-- Audit tidak boleh mengaudit dirinya sendiri agar pencatatan tidak berulang tanpa batas.
drop trigger audit_events_audit on public.audit_events;
drop policy "Read own profile" on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (
  (id=(select auth.uid()) and private.app_role() is not null) or private.is_admin() or private.same_team(id));
-- Kebijakan pembaruan profil lama dibatasi lagi untuk akun aktif; kolom role tetap tidak mendapat grant.
drop policy "Update own presentation fields" on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using(id=(select auth.uid()) and private.app_role() in ('participant','admin'))
  with check(id=(select auth.uid()) and private.app_role() in ('participant','admin'));
create trigger profiles_audit after update on public.profiles for each row execute function private.audit_mutation();
create policy teams_read on public.teams for select to authenticated using(private.can_read_team(id));
create policy members_read on public.team_members for select to authenticated using(private.can_read_team(team_id));
create policy joins_read on public.team_join_requests for select to authenticated using(private.is_admin() or private.is_leader(team_id) or (user_id=(select auth.uid()) and private.app_role()='participant'));
create policy works_read on public.works for select to authenticated using(private.can_read_team(team_id));
create policy documents_read on public.documents for select to authenticated using(deleted_at is null and private.can_read_team(team_id));
create policy requests_read on public.mentoring_requests for select to authenticated using(private.can_read_team(team_id));
create policy request_documents_read on public.request_documents for select to authenticated using(private.can_read_request(request_id));
create policy bookings_read on public.bookings for select to authenticated using(private.can_read_team(team_id));
create policy proposals_read on public.reschedule_proposals for select to authenticated using(private.can_read_request(request_id));
create policy events_read on public.request_events for select to authenticated using(private.can_read_request(request_id));
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()) and private.app_role() is not null);
create policy audit_read on public.audit_events for select to authenticated using(private.is_admin());
create policy mentors_read on public.mentors for select to authenticated using(private.is_staff() or (private.app_role()='participant' and active and not archived));
create policy slots_read on public.mentor_slots for select to authenticated using(private.is_staff() or (private.app_role()='participant' and exists(
  select 1 from public.mentors m where m.id=mentor_id and m.active and not m.archived)));
grant select on public.event_settings,public.resource_links to anon;
create policy settings_read on public.event_settings for select to anon,authenticated using(true);
create policy links_read on public.resource_links for select to anon,authenticated using(active or private.is_admin());
-- Admin dapat melakukan CRUD mentor, slot dan tautan; trigger tetap melindungi booking dan audit.
do $admin_policies$
declare tbl text;
begin
  foreach tbl in array array['mentors','mentor_slots','resource_links'] loop
    execute format('grant insert,update,delete on public.%I to authenticated',tbl);
    execute format('create policy %I on public.%I for all to authenticated using(private.is_admin()) with check(private.is_admin())',tbl||'_admin_write',tbl);
  end loop;
end $admin_policies$;
grant update on public.event_settings to authenticated;
create policy settings_admin_update on public.event_settings for update to authenticated using(private.is_admin()) with check(private.is_admin());

-- Bucket privat: upload/hapus objek dilakukan server setelah validasi, bukan langsung oleh akun bersama.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('team-documents','team-documents',false,10485760,array['application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation','image/png','image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy adikara_documents_read on storage.objects for select to authenticated using(bucket_id='team-documents' and exists(
  select 1 from public.documents d where d.object_path=name and d.kind='file' and d.ready and d.deleted_at is null and private.can_read_team(d.team_id)));

-- Hak helper dibatasi; skema private tidak boleh ditambahkan ke daftar Exposed schemas pada Data API.
revoke all on schema private from public,anon;
grant usage on schema private to authenticated,service_role;
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.app_role(),private.is_admin(),private.is_staff(),private.is_member(uuid),private.is_leader(uuid),
  private.can_read_team(uuid),private.can_read_request(uuid),private.same_team(uuid) to authenticated;
-- Kebijakan tautan publik memerlukan helper ini untuk evaluasi OR tanpa membuka akses data profil.
grant usage on schema private to anon;
grant execute on function private.is_admin() to anon;
commit;

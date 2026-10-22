-- TODO: Hubungkan controller produksi ke RPC ini dan pertahankan pengujian lintas peran.
begin;

-- Mengunci tim sebelum anggota atau admin menyimpan karya dan bahan diskusi.
create function private.lock_editable_team(p_team uuid) returns uuid language plpgsql security definer set search_path='' as $$
begin
  perform private.require_role(array['participant','admin']);
  perform 1 from public.teams where id=p_team and not archived for update;
  if not found or not(private.is_admin() or private.is_member(p_team)) then
    raise exception 'Tidak berhak mengubah karya tim.' using errcode='42501';
  end if;
  return p_team;
end $$;
-- Membuat tim dan keanggotaan ketua dalam satu transaksi, termasuk pembuatan atas nama peserta oleh admin.
create function private.create_team(p_name text,p_category text,p_description text,p_owner uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; owner_id uuid; tid uuid;
begin
  actor=private.require_role(array['participant','admin']);
  owner_id=case when private.is_admin() then coalesce(p_owner,actor) else actor end;
  perform 1 from public.profiles where id=owner_id and role::text='participant' and is_active for update;
  if not found then raise exception 'Ketua harus akun peserta aktif.'; end if;
  if exists(select 1 from public.team_members where user_id=owner_id) then raise exception 'Peserta sudah mempunyai tim.'; end if;
  insert into public.teams(name,category,description,leader_id) values(btrim(p_name),btrim(p_category),coalesce(p_description,''),owner_id) returning id into tid;
  insert into public.team_members(user_id,team_id) values(owner_id,tid);
  update public.team_join_requests set status='rejected',reviewed_at=now(),reviewed_by=actor where user_id=owner_id and status='pending';
  return tid;
end $$;
-- Mengubah informasi publik tim tanpa mengubah kepemimpinan atau identitas karya.
create function private.update_team(p_team uuid,p_name text,p_category text,p_description text) returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.lock_managed_team(p_team);
  update public.teams set name=btrim(p_name),category=btrim(p_category),description=coalesce(p_description,''),updated_at=now() where id=p_team;
end $$;
-- Mengembalikan proyeksi pencarian publik yang tidak menyertakan karya, dokumen atau kontak tim.
create function private.search_teams(p_query text default '') returns table(id uuid,name text,category text,description text,member_count bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  perform private.require_role(array['participant','admin']);
  return query select t.id,t.name,t.category,t.description,(select count(*) from public.team_members m where m.team_id=t.id)
    from public.teams t where not t.archived and (t.name||' '||t.category||' '||t.description) ilike '%'||left(coalesce(p_query,''),100)||'%'
    order by t.name limit 100;
end $$;
-- Mengirim permintaan bergabung tanpa menambahkan anggota atau memberikan akses privat.
create function private.request_team_join(p_team uuid,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; jid uuid;
begin
  actor=private.require_role(array['participant']);
  perform 1 from public.profiles where id=actor for update;
  if exists(select 1 from public.team_members where user_id=actor) then raise exception 'Kamu sudah mempunyai tim.'; end if;
  perform 1 from public.teams where id=p_team and not archived for update;
  if not found then raise exception 'Tim tidak ditemukan.'; end if;
  if (select count(*) from public.team_members where team_id=p_team)>=3 then raise exception 'Tim penuh.'; end if;
  insert into public.team_join_requests(team_id,user_id,note) values(p_team,actor,btrim(p_note)) returning id into jid;
  insert into public.notifications(user_id,title,href) select leader_id,'Permintaan bergabung baru','/peserta/tim' from public.teams where id=p_team;
  return jid;
end $$;
-- Menyetujui atau menolak permintaan dengan kunci peserta dan tim untuk mencegah kursi ganda.
create function private.review_team_join(p_join uuid,p_accept boolean) returns void language plpgsql security definer set search_path='' as $$
declare j public.team_join_requests; actor uuid;
begin
  actor=private.require_role(array['participant','admin']);
  if p_accept is null then raise exception 'Keputusan wajib diisi.'; end if;
  select * into j from public.team_join_requests where id=p_join;
  if j.id is null then raise exception 'Permintaan tidak ditemukan.'; end if;
  perform 1 from public.profiles where id=j.user_id for update;
  perform private.lock_managed_team(j.team_id);
  select * into j from public.team_join_requests where id=p_join for update;
  if j.status<>'pending' then raise exception 'Permintaan sudah diproses.'; end if;
  if p_accept then
    insert into public.team_members(user_id,team_id) values(j.user_id,j.team_id);
    update public.team_join_requests set status='rejected',reviewed_at=now(),reviewed_by=actor where user_id=j.user_id and status='pending' and id<>j.id;
  end if;
  update public.team_join_requests set status=case when p_accept then 'accepted' else 'rejected' end,reviewed_at=now(),reviewed_by=actor where id=j.id;
  insert into public.notifications(user_id,title,href) values(j.user_id,case when p_accept then 'Permintaan bergabung diterima' else 'Permintaan bergabung ditolak' end,'/peserta/tim');
end $$;
-- Menambahkan peserta langsung oleh admin dengan invariant keanggotaan yang sama.
create function private.admin_add_member(p_team uuid,p_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.require_role(array['admin']);
  perform 1 from public.profiles where id=p_user for update;
  perform private.lock_managed_team(p_team);
  insert into public.team_members(user_id,team_id) values(p_user,p_team);
  update public.team_join_requests set status='rejected',reviewed_at=now(),reviewed_by=auth.uid() where user_id=p_user and status='pending';
end $$;
-- Memindahkan kepemimpinan hanya kepada anggota tim yang sama.
create function private.transfer_team_leader(p_team uuid,p_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.lock_managed_team(p_team);
  if not exists(select 1 from public.team_members where team_id=p_team and user_id=p_user) then raise exception 'Ketua pengganti harus anggota aktif tim.'; end if;
  update public.teams set leader_id=p_user,updated_at=now() where id=p_team;
end $$;
-- Mengeluarkan diri sendiri atau anggota oleh admin tanpa menghapus karya dan riwayat tim.
create function private.leave_team(p_team uuid,p_user uuid default null,p_successor uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid; target uuid; t public.teams; total integer;
begin
  actor=private.require_role(array['participant','admin']);
  target=case when private.is_admin() then coalesce(p_user,actor) else actor end;
  perform 1 from public.profiles where id=target for update;
  select * into t from public.teams where id=p_team and not archived for update;
  if t.id is null or not exists(select 1 from public.team_members where team_id=p_team and user_id=target) then raise exception 'Anggota tidak ditemukan pada tim.'; end if;
  select count(*) into total from public.team_members where team_id=p_team;
  if t.leader_id=target then
    if total>1 then
      if p_successor is null or p_successor=target or not exists(select 1 from public.team_members where team_id=p_team and user_id=p_successor) then
        raise exception 'Alihkan ketua ke anggota aktif sebelum keluar.';
      end if;
      update public.teams set leader_id=p_successor,updated_at=now() where id=p_team;
    else
      if exists(select 1 from public.mentoring_requests where team_id=p_team and status in ('pending','revision_requested','approved')) then
        raise exception 'Tuntaskan atau batalkan pengajuan aktif sebelum mengarsipkan tim terakhir.';
      end if;
      update public.teams set archived=true,updated_at=now() where id=p_team;
    end if;
  end if;
  delete from public.team_members where team_id=p_team and user_id=target;
end $$;
-- Menyimpan draf atau karya lengkap milik tim dengan identitas pengubah yang diautentikasi.
create function private.save_work(p_team uuid,p_title text,p_description text,p_draft boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.lock_editable_team(p_team);
  insert into public.works(team_id,title,description,is_draft,updated_by)
    values(p_team,btrim(coalesce(p_title,'')),btrim(coalesce(p_description,'')),coalesce(p_draft,true),auth.uid())
    on conflict(team_id) do update set title=excluded.title,description=excluded.description,is_draft=excluded.is_draft,updated_by=excluded.updated_by,updated_at=now();
end $$;
-- Memesan kuota metadata sebelum server mengunggah file, atau menyimpan tautan Drive secara langsung.
create function private.reserve_document(p_team uuid,p_title text,p_kind text,p_url text default null,p_filename text default null,p_bytes bigint default null,p_mime text default null)
returns public.documents language plpgsql security definer set search_path='' as $$
declare d public.documents; did uuid=gen_random_uuid();
begin
  perform private.lock_editable_team(p_team);
  if p_kind='file' then
    if (select count(*) from public.documents where team_id=p_team and kind='file' and deleted_at is null)>=10
      or (select coalesce(sum(bytes),0) from public.documents where team_id=p_team and kind='file' and deleted_at is null)+coalesce(p_bytes,0)>52428800 then
      raise exception 'Kuota file tim maksimal 10 berkas dan 50 MB.';
    end if;
  end if;
  insert into public.documents(id,team_id,title,kind,drive_url,filename,bytes,mime_type,object_path,uploaded_by,ready)
    values(did,p_team,btrim(p_title),p_kind,case when p_kind='drive' then p_url end,
      case when p_kind='file' then p_filename end,case when p_kind='file' then p_bytes end,case when p_kind='file' then p_mime end,
      case when p_kind='file' then p_team::text||'/'||did::text||'/'||regexp_replace(coalesce(p_filename,''),'[^a-zA-Z0-9._-]','_','g') end,
      auth.uid(),p_kind='drive') returning * into d;
  return d;
end $$;
-- Menyelesaikan upload hanya setelah server memverifikasi ukuran objek aktual di Storage.
create function private.complete_document_upload(p_document uuid) returns void language plpgsql security definer set search_path='' as $$
declare d public.documents; meta jsonb;
begin
  select * into d from public.documents where id=p_document and kind='file' and deleted_at is null for update;
  if d.id is null then raise exception 'Reservasi dokumen tidak ditemukan.'; end if;
  select metadata into meta from storage.objects where bucket_id='team-documents' and name=d.object_path;
  if meta is null or (meta->>'size')::bigint is distinct from d.bytes or (meta->>'mimetype') is distinct from d.mime_type then
    raise exception 'Objek Storage belum tersedia atau ukuran/jenis aktual tidak sesuai reservasi.';
  end if;
  update public.documents set ready=true,updated_at=now() where id=d.id;
end $$;
-- Mengubah metadata atau menghapus akses dokumen tanpa memutus riwayat snapshot pengajuan.
create function private.update_document(p_document uuid,p_title text,p_url text default null,p_delete boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare d public.documents;
begin
  perform private.require_role(array['participant','admin']);
  select * into d from public.documents where id=p_document and deleted_at is null;
  if d.id is null then raise exception 'Dokumen tidak ditemukan.'; end if;
  perform private.lock_editable_team(d.team_id);
  if not(private.is_admin() or private.is_leader(d.team_id) or d.uploaded_by=auth.uid()) then raise exception 'Hanya pengunggah, ketua, atau admin yang dapat mengubah dokumen.'; end if;
  update public.documents set title=btrim(p_title),drive_url=case when kind='drive' then p_url else drive_url end,
    deleted_at=case when p_delete then now() else deleted_at end,updated_at=now() where id=d.id;
end $$;
-- Memvalidasi dokumen tim dan mengganti snapshot bahan pengajuan dalam transaksi yang sama.
create function private.snapshot_documents(p_request uuid,p_team uuid,p_documents uuid[]) returns void language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from unnest(coalesce(p_documents,'{}'::uuid[])) x where not exists(
    select 1 from public.documents d where d.id=x and d.team_id=p_team and d.ready and d.deleted_at is null)) then
    raise exception 'Dokumen belum siap, telah dihapus, atau bukan milik tim.';
  end if;
  delete from public.request_documents where request_id=p_request;
  insert into public.request_documents(request_id,document_id,title_snapshot)
    select p_request,d.id,d.title from public.documents d where d.id=any(coalesce(p_documents,'{}'::uuid[]));
end $$;
-- Mengirim pengajuan idempoten; pending tidak membuat booking atau mengunci slot permanen.
create function private.submit_request(p_team uuid,p_slot uuid,p_key uuid,p_documents uuid[] default '{}') returns uuid language plpgsql security definer set search_path='' as $$
declare t public.teams; w public.works; s public.mentor_slots; rid uuid; actor uuid;
begin
  actor=private.require_role(array['participant','admin']);
  t=private.lock_managed_team(p_team);
  select id into rid from public.mentoring_requests where submitted_by=actor and submission_key=p_key;
  if found then return rid; end if;
  select * into w from public.works where team_id=p_team;
  if w.team_id is null or w.is_draft or btrim(w.title)='' or btrim(w.description)='' then raise exception 'Lengkapi Identitas Karya terlebih dahulu.'; end if;
  s=private.lock_available_slot(p_slot);
  if exists(select 1 from public.bookings b where b.active and (b.mentor_id=s.mentor_id or b.team_id=p_team)
    and tstzrange(b.starts_at,b.buffer_ends_at,'[)')&&tstzrange(s.starts_at,s.buffer_ends_at,'[)')) then raise exception 'Jadwal sudah terbooking.'; end if;
  insert into public.mentoring_requests(team_id,mentor_id,slot_id,title_snapshot,description_snapshot,submitted_by,submission_key)
    values(p_team,s.mentor_id,s.id,w.title,w.description,actor,p_key) returning id into rid;
  perform private.snapshot_documents(rid,p_team,p_documents);
  perform private.record_request_event(rid,'Pengajuan dikirim','Menunggu respons admin/mentor. Slot belum terkonfirmasi.');
  return rid;
end $$;
-- Mengambil keputusan admin dan membuat booking atomik yang menolak benturan mentor maupun tim.
create function private.review_request(p_request uuid,p_decision text,p_note text default '',p_meeting_url text default null,p_revision_kind text default null)
returns void language plpgsql security definer set search_path='' as $$
declare r public.mentoring_requests; s public.mentor_slots;
begin
  perform private.require_role(array['admin']);
  select * into r from public.mentoring_requests where id=p_request for update;
  if r.id is null or r.status not in ('pending','revision_requested') then raise exception 'Pengajuan tidak sedang menunggu keputusan.'; end if;
  if p_decision is null or p_decision not in ('approved','rejected','revision_requested') then raise exception 'Keputusan tidak dikenal.'; end if;
  if p_decision in ('rejected','revision_requested') and length(btrim(coalesce(p_note,'')))=0 then raise exception 'Alasan atau catatan wajib diisi.'; end if;
  if p_decision='revision_requested' and (p_revision_kind is null or p_revision_kind not in ('work','schedule','both')) then raise exception 'Jenis revisi wajib dipilih.'; end if;
  if p_decision='approved' then
    if p_meeting_url is null or p_meeting_url!~'^https://[^[:space:]]+$' then raise exception 'Tautan pertemuan HTTPS wajib diisi.'; end if;
    s=private.lock_available_slot(r.slot_id);
    insert into public.bookings(request_id,mentor_id,team_id,starts_at,ends_at,buffer_ends_at) values(r.id,r.mentor_id,r.team_id,s.starts_at,s.ends_at,s.buffer_ends_at);
  end if;
  update public.mentoring_requests set status=p_decision,decision_note=coalesce(p_note,''),
    meeting_url=case when p_decision='approved' then p_meeting_url else null end,
    revision_kind=case when p_decision='revision_requested' then p_revision_kind else null end,updated_at=now() where id=r.id;
  perform private.record_request_event(r.id,'Keputusan: '||p_decision,p_note);
exception when exclusion_violation then raise exception 'Jadwal baru saja terbooking atau bentrok dengan sesi tim. Minta revisi jadwal.';
end $$;
-- Mengirim ulang pengajuan revisi dengan snapshot terkini dan slot yang divalidasi ulang.
create function private.resubmit_request(p_request uuid,p_slot uuid,p_documents uuid[] default '{}') returns void language plpgsql security definer set search_path='' as $$
declare r public.mentoring_requests; w public.works; s public.mentor_slots; tid uuid;
begin
  perform private.require_role(array['participant','admin']);
  select team_id into tid from public.mentoring_requests where id=p_request;
  perform private.lock_managed_team(tid);
  select * into r from public.mentoring_requests where id=p_request for update;
  if r.status is distinct from 'revision_requested' then raise exception 'Pengajuan tidak sedang memerlukan revisi.'; end if;
  select * into w from public.works where team_id=r.team_id;
  if w.team_id is null or w.is_draft or btrim(w.title)='' or btrim(w.description)='' then raise exception 'Identitas Karya belum lengkap.'; end if;
  s=private.lock_available_slot(p_slot);
  if s.mentor_id<>r.mentor_id then raise exception 'Revisi tetap menggunakan mentor yang sama; batalkan untuk memilih mentor lain.'; end if;
  if exists(select 1 from public.bookings b where b.active and (b.mentor_id=s.mentor_id or b.team_id=r.team_id)
    and tstzrange(b.starts_at,b.buffer_ends_at,'[)')&&tstzrange(s.starts_at,s.buffer_ends_at,'[)')) then raise exception 'Slot sudah terbooking.'; end if;
  update public.mentoring_requests set slot_id=s.id,status='pending',title_snapshot=w.title,description_snapshot=w.description,meeting_url=null,updated_at=now() where id=r.id;
  perform private.snapshot_documents(r.id,r.team_id,p_documents);
  perform private.record_request_event(r.id,'Revisi dikirim ulang','Menunggu keputusan; belum menjadi booking.');
end $$;
-- Membatalkan pengajuan dengan alasan; admin dapat melewati batas 24 jam untuk keadaan operasional.
create function private.cancel_request(p_request uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare r public.mentoring_requests; tid uuid;
begin
  perform private.require_role(array['participant','admin']);
  select team_id into tid from public.mentoring_requests where id=p_request;
  perform private.lock_managed_team(tid);
  select * into r from public.mentoring_requests where id=p_request for update;
  if r.status is null or r.status not in ('pending','revision_requested','approved') then raise exception 'Pengajuan sudah tidak aktif.'; end if;
  if length(btrim(coalesce(p_reason,'')))=0 then raise exception 'Alasan pembatalan wajib diisi.'; end if;
  if r.status='approved' and not private.is_admin() and exists(select 1 from public.bookings where request_id=r.id and starts_at<now()+interval '24 hours') then
    raise exception 'Batas pembatalan 24 jam telah lewat. Hubungi admin.';
  end if;
  update public.bookings set active=false where request_id=r.id;
  update public.reschedule_proposals set status='withdrawn',responded_at=now(),responded_by=auth.uid() where request_id=r.id and status='pending';
  update public.mentoring_requests set status='cancelled',decision_note=p_reason,updated_at=now() where id=r.id;
  perform private.record_request_event(r.id,'Pengajuan dibatalkan',p_reason);
end $$;
-- Menyelesaikan sesi oleh admin setelah waktu mentoring berakhir tanpa menghapus booking historis.
create function private.complete_request(p_request uuid,p_note text default '') returns void language plpgsql security definer set search_path='' as $$
declare r public.mentoring_requests;
begin
  perform private.require_role(array['admin']);
  select * into r from public.mentoring_requests where id=p_request for update;
  if r.status is distinct from 'approved' or not exists(select 1 from public.bookings where request_id=r.id and ends_at<=now()) then
    raise exception 'Hanya sesi terkonfirmasi yang sudah berakhir dapat diselesaikan.';
  end if;
  update public.mentoring_requests set status='completed',updated_at=now() where id=r.id;
  perform private.record_request_event(r.id,'Sesi selesai',p_note);
end $$;
-- Mengajukan pengganti jadwal oleh admin sambil mempertahankan booking lama sampai disepakati tim.
create function private.propose_reschedule(p_request uuid,p_slot uuid,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.mentoring_requests; s public.mentor_slots; pid uuid;
begin
  perform private.require_role(array['admin']);
  select * into r from public.mentoring_requests where id=p_request for update;
  if r.status is distinct from 'approved' then raise exception 'Hanya sesi terkonfirmasi dapat diusulkan ulang.'; end if;
  s=private.lock_available_slot(p_slot);
  if s.mentor_id<>r.mentor_id or s.id=r.slot_id then raise exception 'Pilih slot pengganti lain milik mentor yang sama.'; end if;
  insert into public.reschedule_proposals(request_id,slot_id,proposed_by,reason) values(r.id,s.id,auth.uid(),btrim(p_reason)) returning id into pid;
  perform private.record_request_event(r.id,'Usulan perubahan jadwal',p_reason);
  return pid;
end $$;
-- Menerima atau menolak usulan oleh ketua; penggantian booking terjadi atomik dan gagal tanpa melepas jadwal lama.
create function private.respond_reschedule(p_proposal uuid,p_accept boolean) returns void language plpgsql security definer set search_path='' as $$
declare p public.reschedule_proposals; r public.mentoring_requests; s public.mentor_slots;
begin
  perform private.require_role(array['participant','admin']);
  select * into p from public.reschedule_proposals where id=p_proposal;
  select * into r from public.mentoring_requests where id=p.request_id;
  perform private.lock_managed_team(r.team_id);
  select * into r from public.mentoring_requests where id=p.request_id for update;
  select * into p from public.reschedule_proposals where id=p_proposal for update;
  if p.id is null or p.status<>'pending' or r.status<>'approved' or p_accept is null then raise exception 'Usulan tidak dapat diproses.'; end if;
  if p_accept then
    s=private.lock_available_slot(p.slot_id);
    update public.bookings set starts_at=s.starts_at,ends_at=s.ends_at,buffer_ends_at=s.buffer_ends_at where request_id=r.id and active;
    if not found then raise exception 'Booking lama tidak ditemukan.'; end if;
    update public.mentoring_requests set slot_id=s.id,updated_at=now() where id=r.id;
  end if;
  update public.reschedule_proposals set status=case when p_accept then 'accepted' else 'rejected' end,responded_at=now(),responded_by=auth.uid() where id=p.id;
  perform private.record_request_event(r.id,case when p_accept then 'Jadwal pengganti disepakati' else 'Usulan jadwal ditolak' end,p.reason);
exception when exclusion_violation then raise exception 'Slot pengganti sudah bentrok. Booking lama tetap berlaku.';
end $$;
-- Membuat slot standar lengkap untuk mentor dan hari tertentu; pemanggilan ulang melewati jam yang sudah ada.
create function private.generate_mentor_slots(p_mentor uuid,p_date date) returns integer language plpgsql security definer set search_path='' as $$
declare cfg public.event_settings; cursor_time timestamptz; limit_time timestamptz; count_added integer=0; changed integer;
begin
  perform private.require_role(array['admin']);
  perform 1 from public.mentors where id=p_mentor and not archived for update;
  if not found then raise exception 'Mentor tidak ditemukan.'; end if;
  select * into cfg from public.event_settings where singleton;
  cursor_time=(p_date+cfg.day_start) at time zone 'Asia/Jakarta'; limit_time=(p_date+cfg.day_end) at time zone 'Asia/Jakarta';
  while cursor_time+make_interval(mins=>cfg.session_minutes+cfg.buffer_minutes)<=limit_time loop
    insert into public.mentor_slots(mentor_id,starts_at,ends_at,buffer_ends_at) values(p_mentor,cursor_time,
      cursor_time+make_interval(mins=>cfg.session_minutes),cursor_time+make_interval(mins=>cfg.session_minutes+cfg.buffer_minutes))
      on conflict(mentor_id,starts_at) do nothing;
    get diagnostics changed=row_count; count_added=count_added+changed;
    cursor_time=cursor_time+make_interval(mins=>cfg.session_minutes+cfg.buffer_minutes);
  end loop;
  return count_added;
end $$;
-- Menandai notifikasi milik sesi aktif tanpa memperbolehkan pembaruan notifikasi pengguna lain.
create function private.mark_notifications_read() returns void language plpgsql security definer set search_path='' as $$
begin
  perform private.require_role(array['participant','mentor_general','admin']);
  update public.notifications set read_at=now() where user_id=auth.uid() and read_at is null;
end $$;
-- Mengelola peran dan status akun oleh admin tanpa menghapus akun atau membiarkan admin terakhir dinonaktifkan.
create function private.admin_set_account(p_user uuid,p_role text,p_active boolean default true) returns void language plpgsql security definer set search_path='' as $$
declare previous public.profiles;
begin
  perform private.require_role(array['admin']);
  perform pg_advisory_xact_lock(20261022,1);
  if p_role is null or p_role not in ('participant','mentor_general','admin') or p_active is null then raise exception 'Peran/status tidak valid.'; end if;
  select * into previous from public.profiles where id=p_user for update;
  if previous.id is null then raise exception 'Akun tidak ditemukan.'; end if;
  if p_role<>'participant' and exists(select 1 from public.team_members where user_id=p_user) then raise exception 'Keluarkan akun dari tim sebelum mengubahnya menjadi staf.'; end if;
  if previous.role::text='admin' and previous.is_active and (p_role<>'admin' or not p_active)
    and (select count(*) from public.profiles where role::text='admin' and is_active)<=1 then raise exception 'Admin aktif terakhir tidak dapat dinonaktifkan.'; end if;
  update public.profiles set role=p_role::public.user_role,is_active=p_active where id=p_user;
end $$;
-- Menampilkan direktori akun dan email hanya untuk admin yang mengelola peran.
create function private.admin_accounts() returns table(id uuid,full_name text,email text,role text,is_active boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  perform private.require_role(array['admin']);
  return query select p.id,p.full_name,u.email::text,p.role::text,p.is_active from public.profiles p join auth.users u on u.id=p.id order by p.created_at;
end $$;

-- Wrapper RPC publik tetap SECURITY INVOKER; fungsi berprivilege disimpan pada skema private yang tidak diekspos.
-- Mengizinkan ketua melihat identitas dasar pemohon tanpa membuka direktori profil seluruh peserta.
create function private.is_pending_applicant(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.team_join_requests j where j.user_id=p_user and j.status='pending' and private.is_leader(j.team_id))
$$;
drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (
  (id=(select auth.uid()) and private.app_role() is not null) or private.is_admin() or private.same_team(id) or private.is_pending_applicant(id));
-- Menyajikan status terbooking lintas tim tanpa mengungkap identitas tim atau isi pengajuan tim lain.
create function private.list_mentor_slots(p_mentor uuid,p_date date)
returns table(id uuid,mentor_id uuid,starts_at timestamptz,ends_at timestamptz,buffer_ends_at timestamptz,enabled boolean,is_booked boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  perform private.require_role(array['participant','mentor_general','admin']);
  return query select s.id,s.mentor_id,s.starts_at,s.ends_at,s.buffer_ends_at,s.enabled,
    exists(select 1 from public.bookings b where b.mentor_id=s.mentor_id and b.active and tstzrange(b.starts_at,b.buffer_ends_at,'[)')&&tstzrange(s.starts_at,s.buffer_ends_at,'[)'))
    from public.mentor_slots s join public.mentors m on m.id=s.mentor_id
    where s.mentor_id=p_mentor and (s.starts_at at time zone 'Asia/Jakarta')::date=p_date
      and (private.is_staff() or (m.active and not m.archived)) order by s.starts_at;
end $$;

revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.app_role(),private.is_admin(),private.is_staff(),private.is_member(uuid),private.is_leader(uuid),
  private.can_read_team(uuid),private.can_read_request(uuid),private.same_team(uuid),private.is_pending_applicant(uuid) to authenticated;
grant execute on function private.is_admin() to anon;

-- Menghasilkan wrapper dari daftar tertutup agar nama/tipe argumen tidak berbeda dengan fungsi implementasinya.
do $wrappers$
declare fn record; names text; audience text;
begin
  for fn in select p.oid,p.proname,p.proargnames,p.pronargs,
    pg_get_function_arguments(p.oid) args,pg_get_function_identity_arguments(p.oid) identity_args,pg_get_function_result(p.oid) result
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname=any(array[
      'create_team','update_team','search_teams','request_team_join','review_team_join','admin_add_member','transfer_team_leader','leave_team',
      'save_work','reserve_document','complete_document_upload','update_document','submit_request','review_request','resubmit_request',
      'cancel_request','complete_request','propose_reschedule','respond_reschedule','generate_mentor_slots','mark_notifications_read',
      'admin_set_account','admin_accounts','list_mentor_slots']) loop
    select string_agg(quote_ident(x.name),',' order by x.ordinality) into names
      from unnest(fn.proargnames[1:fn.pronargs]) with ordinality x(name,ordinality);
    execute format('create function public.%I(%s) returns %s language sql security invoker set search_path='''' as %L',
      fn.proname,fn.args,fn.result,format('select * from private.%I(%s)',fn.proname,coalesce(names,'')));
    execute format('revoke all on function public.%I(%s) from public,anon,authenticated',fn.proname,fn.identity_args);
    audience=case when fn.proname='complete_document_upload' then 'service_role' else 'authenticated' end;
    execute format('grant execute on function public.%I(%s) to %I',fn.proname,fn.identity_args,audience);
    execute format('grant execute on function private.%I(%s) to %I',fn.proname,fn.identity_args,audience);
  end loop;
end $wrappers$;
commit;

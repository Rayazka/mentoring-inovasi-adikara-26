-- TODO: Jalankan hanya pada database uji; seluruh fixture dan helper dibatalkan pada akhir berkas.
\set ON_ERROR_STOP on
begin;
-- Menghentikan pengujian jika kondisi yang diharapkan tidak terpenuhi.
create function public.test_assert(p_ok boolean,p_message text) returns void language plpgsql as $$
begin
  if p_ok is distinct from true then raise exception 'UJI GAGAL: %',p_message; end if;
end $$;
-- Memastikan operasi yang dilarang gagal dengan alasan yang benar, bukan karena kesalahan SQL lain.
create function public.test_expect_error(p_sql text,p_fragment text) returns void language plpgsql as $$
declare failed boolean=false;
begin
  begin execute p_sql;
  exception when others then
    if position(lower(p_fragment) in lower(sqlerrm))=0 then raise exception 'Alasan tidak sesuai: %',sqlerrm; end if;
    failed=true;
  end;
  if not failed then raise exception 'UJI GAGAL: operasi seharusnya ditolak: %',p_sql; end if;
end $$;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000001','admin@example.invalid','{"full_name":"Admin Uji"}'),
 ('00000000-0000-4000-8000-000000000002','general@example.invalid','{"full_name":"Mentor General Uji"}'),
 ('00000000-0000-4000-8000-000000000003','a@example.invalid','{"full_name":"Ketua A"}'),
 ('00000000-0000-4000-8000-000000000004','b@example.invalid','{"full_name":"Ketua B"}'),
 ('00000000-0000-4000-8000-000000000005','c@example.invalid','{"full_name":"Anggota C"}'),
 ('00000000-0000-4000-8000-000000000006','d@example.invalid','{"full_name":"Anggota D"}'),
 ('00000000-0000-4000-8000-000000000007','e@example.invalid','{"full_name":"Calon E"}');
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000000001';
update public.profiles set role='mentor_general' where id='00000000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
insert into public.mentors(name,title,expertise,bio) values('Mentor Uji','Data pengujian','UI/UX','Profil pengujian') returning id as mentor_id \gset
select public.generate_mentor_slots(:'mentor_id','2026-10-24') as generated \gset
select public.test_assert(:generated=10,'Sepuluh slot lengkap per hari');
select public.generate_mentor_slots(:'mentor_id','2026-10-24') as repeated \gset
select public.test_assert(:repeated=0,'Generator tidak membuat slot duplikat');
insert into public.mentors(name,title,expertise,available_dates) values('Mentor Satu Hari','Data uji','Softdev',array[date '2026-10-24']) returning id as restricted_mentor \gset
select public.test_expect_error(format('select public.generate_mentor_slots(%L,''2026-10-25'')',:'restricted_mentor'),'tidak sesuai');
select public.generate_mentor_slots(:'restricted_mentor','2026-10-24');
select id as editable_slot from public.mentor_slots where mentor_id=:'restricted_mentor' order by starts_at limit 1 \gset
update public.mentor_slots set enabled=false where id=:'editable_slot';
update public.mentor_slots set starts_at=starts_at+interval '2 minutes',ends_at=ends_at+interval '2 minutes',buffer_ends_at=buffer_ends_at+interval '2 minutes' where id=:'editable_slot';
delete from public.mentor_slots where id=:'editable_slot';
select public.test_assert((select count(*)=9 from public.mentor_slots where mentor_id=:'restricted_mentor'),'Admin dapat mengubah dan menghapus slot yang tidak terbooking');
select id as first_slot from public.mentor_slots where mentor_id=:'mentor_id' order by starts_at limit 1 \gset
select id as second_slot from public.mentor_slots where mentor_id=:'mentor_id' order by starts_at offset 1 limit 1 \gset

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select public.create_team('Tim A Uji','UI/UX','Deskripsi A') as team_a \gset
select public.save_work(:'team_a','Karya Tim A','Deskripsi lengkap karya A',false);
select public.test_expect_error('select public.create_team(''Tim Ganda'',''UI/UX'',''Tidak boleh'')','sudah mempunyai');
select public.test_expect_error('update public.profiles set role=''admin''','permission denied');
select public.test_expect_error('select public.admin_set_account(''00000000-0000-4000-8000-000000000003'',''admin'',true)','hak akses');
select public.test_expect_error(format('select public.reserve_document(%L,''Tanpa URL'',''drive'')',:'team_a'),'check constraint');
select public.reserve_document(:'team_a','Folder riset','drive','https://drive.google.com/drive/folders/example-test') as drive \gset
select public.submit_request(:'team_a',:'first_slot','10000000-0000-4000-8000-000000000001','{}') as request_a \gset
select public.submit_request(:'team_a',:'first_slot','10000000-0000-4000-8000-000000000001','{}') as retry_request \gset
select public.test_assert(:'request_a'::uuid=:'retry_request'::uuid,'Retry submit idempoten');
select public.test_assert((select count(*)=0 from public.bookings),'Pending tidak membuat booking');
select public.test_expect_error(format('select public.submit_request(%L,%L,''10000000-0000-4000-8000-000000000003'',''{}'')',:'team_a',:'second_slot'),'duplicate key');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select public.create_team('Tim B Uji','UI/UX','Deskripsi B') as team_b \gset
select public.save_work(:'team_b','Karya B','Deskripsi B lengkap',false);
select public.test_assert((select count(*)=0 from public.works where team_id=:'team_a'),'Karya tim lain tidak terlihat');
select public.test_assert((select count(*)=0 from public.mentoring_requests where id=:'request_a'),'Pengajuan tim lain tidak terlihat');
select public.submit_request(:'team_b',:'first_slot','10000000-0000-4000-8000-000000000002','{}') as request_b \gset
select public.test_assert((select count(*)=2 from public.search_teams('Uji')),'Pencarian hanya memakai proyeksi publik');
select public.test_expect_error(format('select public.save_work(%L,''Serangan'',''Tidak boleh'',false)',:'team_a'),'Tidak berhak');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select public.test_assert((select count(*)=2 from public.mentoring_requests),'Mentor General membaca semua pengajuan');
select public.test_assert((select count(*)=2 from public.works),'Mentor General membaca karya lintas tim');
select public.test_assert((select count(*)=1 from public.profiles),'Mentor General tidak mendapat direktori peserta');
update public.profiles set full_name='Diubah' where id='00000000-0000-4000-8000-000000000002';
select public.test_assert((select full_name='Mentor General Uji' from public.profiles where id='00000000-0000-4000-8000-000000000002'),'Akun Mentor General tidak mengubah profil');
select public.test_expect_error(format('select public.review_request(%L,''approved'','''',''https://meet.example.invalid/test'')',:'request_a'),'hak akses');
update public.mentors set name='Serangan' where id=:'mentor_id';
select public.test_assert((select name='Mentor Uji' from public.mentors where id=:'mentor_id'),'Mentor General tidak mengubah profil mentor');
select public.test_expect_error(format('select public.generate_mentor_slots(%L,''2026-10-25'')',:'mentor_id'),'hak akses');
select public.test_expect_error('select * from public.admin_accounts()','hak akses');
select public.test_expect_error('select public.complete_document_upload(gen_random_uuid())','permission denied');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select public.test_expect_error(format('select public.review_request(%L,''approved'')',:'request_a'),'HTTPS');
select public.review_request(:'request_a','approved','Disetujui','https://meet.example.invalid/test');
select public.test_assert((select count(*)=1 from public.bookings where active),'ACC membuat satu booking');
select public.test_expect_error(format('select public.review_request(%L,''approved'','''',''https://meet.example.invalid/test'')',:'request_b'),'terbooking');
select public.test_assert((select status='pending' from public.mentoring_requests where id=:'request_b'),'Gagal booking tidak mengubah status');
select public.test_expect_error(format('update public.mentor_slots set enabled=false where id=%L',:'first_slot'),'dilindungi');
select public.propose_reschedule(:'request_a',:'second_slot','Perubahan jadwal uji') as proposal \gset
select public.test_assert((select slot_id=:'first_slot' from public.mentoring_requests where id=:'request_a'),'Usulan tidak memindahkan booking lama');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select public.respond_reschedule(:'proposal',true);
select public.test_assert((select slot_id=:'second_slot' from public.mentoring_requests where id=:'request_a'),'Persetujuan memindahkan slot secara atomik');
select public.test_assert((select count(*)=1 from public.bookings where active),'Tidak membuat dua booking untuk satu pengajuan');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',true);
select public.request_team_join(:'team_a','Perkenalan C') as join_c \gset
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000006',true);
select public.request_team_join(:'team_a','Perkenalan D') as join_d \gset
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000007',true);
select public.request_team_join(:'team_a','Perkenalan E') as join_e \gset
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select public.review_team_join(:'join_c',true);
select public.review_team_join(:'join_d',true);
select public.test_expect_error(format('select public.review_team_join(%L,true)',:'join_e'),'Tim penuh');
select public.test_assert((select count(*)=3 from public.team_members where team_id=:'team_a'),'Tim tetap maksimal tiga anggota');
select public.test_expect_error(format('select public.leave_team(%L)',:'team_a'),'Alihkan');
select public.transfer_team_leader(:'team_a','00000000-0000-4000-8000-000000000005');
select public.leave_team(:'team_a');
select public.test_assert((select count(*)=0 from public.works where team_id=:'team_a'),'Mantan anggota kehilangan akses karya');

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select public.cancel_request(:'request_a','Pembatalan oleh admin uji');
select public.test_assert((select count(*)=0 from public.bookings where active),'Pembatalan melepas booking');
select public.test_assert((select count(*)>0 from public.audit_events),'Audit tercatat');
select public.test_expect_error('select public.admin_set_account(''00000000-0000-4000-8000-000000000001'',''mentor_general'',true)','Admin aktif terakhir');

-- Meniru objek Storage hanya untuk menguji finalisasi server dan akses baca metadata.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select id as file_id,object_path as file_path from public.reserve_document(:'team_b','Berkas uji','file',null,'uji.pdf',123,'application/pdf') \gset
select public.test_expect_error('insert into storage.objects(bucket_id,name) values(''team-documents'',''tanpa-izin'')','permission denied');
reset role;
insert into storage.objects(bucket_id,name,metadata) values('team-documents',:'file_path','{"size":1,"mimetype":"application/pdf"}');
select set_config('request.jwt.claim.sub','',true);
set local role service_role;
select public.test_expect_error(format('select public.complete_document_upload(%L)',:'file_id'),'ukuran/jenis');
reset role;
update storage.objects set metadata='{"size":123,"mimetype":"application/pdf"}' where name=:'file_path';
set local role service_role;
select public.complete_document_upload(:'file_id');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select public.test_assert((select count(*)=1 from storage.objects where name=:'file_path'),'Mentor General membaca objek yang sudah diverifikasi');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',true);
select public.test_assert((select count(*)=0 from storage.objects where name=:'file_path'),'Anggota tim lain tidak membaca objek Storage');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
select public.update_document(:'file_id','Berkas uji',null,true);
select public.test_assert((select count(*)=0 from storage.objects where name=:'file_path'),'Dokumen terhapus tidak dapat dibaca melalui Storage');

set local role anon;
select public.test_assert((select count(*)=4 from public.resource_links),'Tautan login dapat dibaca publik');
select public.test_expect_error('select * from public.works','permission denied');
select public.test_expect_error('select public.create_team(''Anon'',''UI/UX'',''Tidak boleh'')','permission denied');
reset role;
set constraints all immediate;
rollback;
\echo 'Uji SQL rilis selesai: seluruh pemeriksaan lulus dan fixture dibatalkan.'

-- TODO: Lengkapi verifikasi ini dengan uji login nyata dan Storage API setelah aplikasi dihubungkan.
-- Berkas ini hanya membaca metadata instalasi dan aman dijalankan setelah 00_install.sql.
select c.relname as tabel,c.relrowsecurity as rls_aktif
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('profiles','event_settings','teams','team_members','team_join_requests','works',
 'mentors','mentor_slots','documents','mentoring_requests','request_documents','bookings','reschedule_proposals','request_events',
 'notifications','audit_events','resource_links') order by c.relname;
select id,public as bucket_publik,file_size_limit from storage.buckets where id='team-documents';
select proname as rpc,p.prosecdef as security_definer,has_function_privilege('anon',p.oid,'EXECUTE') as dapat_dipanggil_anon
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('create_team','submit_request','review_request','generate_mentor_slots','admin_set_account','complete_document_upload')
order by proname;
select dates,day_start,day_end,session_minutes,buffer_minutes,discord_url from public.event_settings;

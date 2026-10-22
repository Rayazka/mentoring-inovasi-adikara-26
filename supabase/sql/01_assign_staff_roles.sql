-- TODO: Ganti kedua email contoh setelah akun dibuat melalui Authentication > Users di Supabase.
-- Jalankan berkas ini setelah 00_install.sql. Jangan menulis password di SQL atau Git.
begin;
do $staff$
declare admin_email text='GANTI_EMAIL_ADMIN'; mentor_email text='GANTI_EMAIL_MENTOR_BERSAMA'; admin_id uuid; mentor_id uuid;
begin
  if admin_email like 'GANTI_%' or mentor_email like 'GANTI_%' or admin_email=mentor_email then
    raise exception 'Isi dua email berbeda sesuai akun yang sudah dibuat pada Authentication > Users.';
  end if;
  select id into admin_id from auth.users where lower(email)=lower(admin_email);
  select id into mentor_id from auth.users where lower(email)=lower(mentor_email);
  if admin_id is null or mentor_id is null then raise exception 'Buat kedua akun melalui Authentication > Users terlebih dahulu.'; end if;
  if exists(select 1 from public.team_members where user_id in (admin_id,mentor_id)) then raise exception 'Akun staf tidak boleh sedang menjadi anggota tim.'; end if;
  update public.profiles set role='admin',is_active=true where id=admin_id;
  update public.profiles set role='mentor_general',is_active=true where id=mentor_id;
end $staff$;
commit;

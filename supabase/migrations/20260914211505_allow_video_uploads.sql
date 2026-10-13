insert into storage.buckets (id, name, public, file_size_limit)
values ('user-files', 'user-files', false, 2147483648)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

alter table public.gallery_photos add column if not exists media_type text not null default 'image';
alter table public.challenges add column if not exists result_image_path text;
alter table public.challenges add column if not exists result_media_type text not null default 'image';
alter table public.sessions add column if not exists proof_media_type text not null default 'image';;

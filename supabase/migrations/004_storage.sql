-- Image backend: one public bucket `photos` for portfolio + listing photos.
-- Path convention: {auth.uid()}/{timestamp}.jpg — users write only inside
-- their own folder; everyone can read (marketplace images are public).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists photos_public_read on storage.objects;
create policy photos_public_read on storage.objects
  for select to public using (bucket_id = 'photos');

drop policy if exists photos_owner_insert on storage.objects;
create policy photos_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists photos_owner_delete on storage.objects;
create policy photos_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

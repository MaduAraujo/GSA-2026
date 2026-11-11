alter table public.challenges add column if not exists media jsonb;

-- Move o anexo único antigo (result_image) para a nova lista de anexos.
update public.challenges
set media = jsonb_build_array(
    jsonb_strip_nulls(jsonb_build_object(
      'id', 'result',
      'name', case when result_media_type = 'video' then 'Vídeo' else 'Imagem' end,
      'kind', case when result_media_type = 'video' then 'video' else 'image' end,
      'path', result_image_path,
      'url', case when result_image_path is null then result_image end
    ))
  ),
  result_image = null,
  result_image_path = null
where media is null and (result_image_path is not null or result_image is not null);

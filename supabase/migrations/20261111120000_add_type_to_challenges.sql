alter table public.challenges
  add column if not exists type text not null default 'Desafio'
  check (type in ('Desafio', 'Ação de Impacto', 'Aquecimento'));

-- Até aqui o tipo era registrado como categoria livre; move esses casos para a nova coluna.
update public.challenges
set type = case
    when lower(trim(category)) in ('ação de impacto', 'acao de impacto', 'ações de impacto', 'acoes de impacto') then 'Ação de Impacto'
    else 'Aquecimento'
  end,
  category = ''
where lower(trim(category)) in (
  'ação de impacto', 'acao de impacto', 'ações de impacto', 'acoes de impacto', 'aquecimento', 'aquecimentos'
);

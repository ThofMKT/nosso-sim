-- Tabela principal do casal
create table if not exists public.casais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  noivo1 text not null,
  noivo2 text not null,
  data_evento date,
  orcamento integer,
  cidade text,
  convidados integer,
  created_at timestamptz default now()
);

-- Habilita Row Level Security (cada casal vê só os próprios dados)
alter table public.casais enable row level security;

create policy "Casal lê próprios dados"
  on public.casais for select
  using (auth.uid() = user_id);

create policy "Casal insere próprios dados"
  on public.casais for insert
  with check (auth.uid() = user_id);

create policy "Casal atualiza próprios dados"
  on public.casais for update
  using (auth.uid() = user_id);

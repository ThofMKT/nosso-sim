-- Tabela de tarefas
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null,
  urgencia text not null default 'media',
  fase text not null default 'Inicial',
  done boolean not null default false,
  created_at timestamptz default now()
);
alter table public.tarefas enable row level security;
create policy "tarefas_select" on public.tarefas for select using (auth.uid() = user_id);
create policy "tarefas_insert" on public.tarefas for insert with check (auth.uid() = user_id);
create policy "tarefas_update" on public.tarefas for update using (auth.uid() = user_id);
create policy "tarefas_delete" on public.tarefas for delete using (auth.uid() = user_id);

-- Tabela de convidados
create table if not exists public.convidados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  telefone text,
  email text,
  prioridade text not null default 'Media',
  status text not null default 'Pendente',
  created_at timestamptz default now()
);
alter table public.convidados enable row level security;
create policy "convidados_select" on public.convidados for select using (auth.uid() = user_id);
create policy "convidados_insert" on public.convidados for insert with check (auth.uid() = user_id);
create policy "convidados_update" on public.convidados for update using (auth.uid() = user_id);
create policy "convidados_delete" on public.convidados for delete using (auth.uid() = user_id);

-- Tabela de itens de orçamento
create table if not exists public.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  categoria text not null,
  percentual_recomendado integer not null,
  valor_gasto integer not null default 0,
  created_at timestamptz default now()
);
alter table public.orcamento_itens enable row level security;
create policy "orcamento_select" on public.orcamento_itens for select using (auth.uid() = user_id);
create policy "orcamento_insert" on public.orcamento_itens for insert with check (auth.uid() = user_id);
create policy "orcamento_update" on public.orcamento_itens for update using (auth.uid() = user_id);
create policy "orcamento_delete" on public.orcamento_itens for delete using (auth.uid() = user_id);

-- Tabela de agenda
create table if not exists public.agenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  titulo text not null,
  data_hora timestamptz not null,
  local text,
  tipo text not null default 'Outro',
  created_at timestamptz default now()
);
alter table public.agenda enable row level security;
create policy "agenda_select" on public.agenda for select using (auth.uid() = user_id);
create policy "agenda_insert" on public.agenda for insert with check (auth.uid() = user_id);
create policy "agenda_update" on public.agenda for update using (auth.uid() = user_id);
create policy "agenda_delete" on public.agenda for delete using (auth.uid() = user_id);

-- Tabela de presentes
create table if not exists public.presentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  valor integer not null default 0,
  status text not null default 'Disponivel',
  reservado_por text,
  created_at timestamptz default now()
);
alter table public.presentes enable row level security;
create policy "presentes_select" on public.presentes for select using (auth.uid() = user_id);
create policy "presentes_insert" on public.presentes for insert with check (auth.uid() = user_id);
create policy "presentes_update" on public.presentes for update using (auth.uid() = user_id);
create policy "presentes_delete" on public.presentes for delete using (auth.uid() = user_id);

-- Coluna chave_pix na tabela casais (se não existir)
alter table public.casais add column if not exists chave_pix text;
alter table public.casais add column if not exists tema text;
alter table public.casais add column if not exists fonte text;

-- Novas colunas de perfil do casal (rodar no Supabase SQL Editor)
alter table public.casais add column if not exists tempo_juntos text;
alter table public.casais add column if not exists estilo_casamento text;
alter table public.casais add column if not exists cores_casamento text;

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const TAREFAS_PADRAO = [
  { label: "Definir a data do casamento", urgencia: "alta", fase: "Inicial" },
  { label: "Escolher a cidade e o espaço", urgencia: "alta", fase: "Inicial" },
  { label: "Fazer o orçamento inicial", urgencia: "alta", fase: "Inicial" },
  { label: "Criar lista de convidados", urgencia: "media", fase: "Inicial" },
  { label: "Definir identidade visual (cores e estilo)", urgencia: "media", fase: "Inicial" },
  { label: "Contratar espaço para cerimônia e recepção", urgencia: "alta", fase: "Fornecedores" },
  { label: "Contratar fotógrafo(a)", urgencia: "alta", fase: "Fornecedores" },
  { label: "Contratar buffet", urgencia: "alta", fase: "Fornecedores" },
  { label: "Contratar decorador(a)", urgencia: "media", fase: "Fornecedores" },
  { label: "Contratar música / DJ", urgencia: "media", fase: "Fornecedores" },
  { label: "Definir e encomendar o bolo", urgencia: "media", fase: "Fornecedores" },
  { label: "Enviar convites formais", urgencia: "alta", fase: "Convites" },
  { label: "Confirmar presenças (RSVP)", urgencia: "alta", fase: "Convites" },
  { label: "Montar lista de presentes", urgencia: "baixa", fase: "Convites" },
  { label: "Última prova do vestido / roupa", urgencia: "alta", fase: "Final" },
  { label: "Briefing final com todos os fornecedores", urgencia: "alta", fase: "Final" },
];

const ORCAMENTO_PADRAO = [
  { categoria: "Espaço", percentual_recomendado: 30 },
  { categoria: "Buffet", percentual_recomendado: 35 },
  { categoria: "Fotografia", percentual_recomendado: 10 },
  { categoria: "Decoração", percentual_recomendado: 10 },
  { categoria: "Vestuário", percentual_recomendado: 8 },
  { categoria: "Outros", percentual_recomendado: 7 },
];

export async function signUp(formData: {
  email: string;
  password: string;
  noivo1: string;
  noivo2: string;
  tempoJuntos: string;
  dataEvento: string;
  orcamento: string;
  cidade: string;
  convidados: string;
  estilo: string;
  paletaNome: string;
  paletaCores: string[];
}) {
  const supabase = await createClient();
  const admin = createServiceClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: { noivo1: formData.noivo1, noivo2: formData.noivo2 },
    },
  });

  if (error) return { error: error.message };

  if (data.user) {
    const userId = data.user.id;

    // Usa service client para garantir que o insert funciona
    // mesmo quando email confirmation está ativado (sem sessão ainda)
    await admin.from("casais").upsert({
      user_id: userId,
      noivo1: formData.noivo1,
      noivo2: formData.noivo2,
      data_evento: formData.dataEvento,
      orcamento: parseInt(formData.orcamento),
      cidade: formData.cidade,
      convidados: parseInt(formData.convidados),
      tempo_juntos: formData.tempoJuntos,
      estilo_casamento: formData.estilo,
      cores_casamento: JSON.stringify({
        nome: formData.paletaNome,
        cores: formData.paletaCores,
      }),
    }, { onConflict: "user_id" });

    // Cria tarefas padrão se ainda não existem
    const { count } = await admin
      .from("tarefas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!count || count === 0) {
      await admin.from("tarefas").insert(
        TAREFAS_PADRAO.map((t) => ({ ...t, user_id: userId, done: false }))
      );
    }

    // Cria itens de orçamento padrão se ainda não existem
    const { count: countOrc } = await admin
      .from("orcamento_itens")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!countOrc || countOrc === 0) {
      await admin.from("orcamento_itens").insert(
        ORCAMENTO_PADRAO.map((o) => ({
          ...o,
          user_id: userId,
          valor_gasto: 0,
        }))
      );
    }
  }

  // Se não há sessão = confirmação de email necessária
  if (!data.session) {
    redirect(`/verificar-email?email=${encodeURIComponent(formData.email)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signIn(formData: { email: string; password: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) return { error: error.message };

  // Garante que o casal tem dados iniciais (para logins via Google ou contas antigas)
  if (data.user) {
    const admin = createServiceClient();
    const { data: casal } = await admin
      .from("casais")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (casal) {
      const [{ count: cT }, { count: cO }] = await Promise.all([
        admin.from("tarefas").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
        admin.from("orcamento_itens").select("id", { count: "exact", head: true }).eq("user_id", data.user.id),
      ]);

      if (!cT || cT === 0) {
        await admin.from("tarefas").insert(
          TAREFAS_PADRAO.map((t) => ({ ...t, user_id: data.user.id, done: false }))
        );
      }
      if (!cO || cO === 0) {
        await admin.from("orcamento_itens").insert(
          ORCAMENTO_PADRAO.map((o) => ({ ...o, user_id: data.user.id, valor_gasto: 0 }))
        );
      }
    }
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

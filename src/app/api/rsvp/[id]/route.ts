import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: casal } = await supabase
    .from("casais")
    .select("noivo1, noivo2, data_evento, cidade, cores_casamento")
    .eq("id", id)
    .single();

  if (!casal) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(casal);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { nome, resposta } = await req.json();

  if (!nome?.trim() || !["sim", "nao"].includes(resposta)) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: casal } = await supabase
    .from("casais")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!casal) return NextResponse.json({ error: "not found" }, { status: 404 });

  const status = resposta === "sim" ? "Confirmado" : "Recusou";

  const { data: existente } = await supabase
    .from("convidados")
    .select("id")
    .eq("user_id", casal.user_id)
    .ilike("nome", nome.trim())
    .maybeSingle();

  if (existente) {
    await supabase
      .from("convidados")
      .update({ status })
      .eq("id", existente.id);
  } else {
    await supabase.from("convidados").insert({
      user_id: casal.user_id,
      nome: nome.trim(),
      status,
      prioridade: "Media",
    });
  }

  return NextResponse.json({ success: true, status });
}

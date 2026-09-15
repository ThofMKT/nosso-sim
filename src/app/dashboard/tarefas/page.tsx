"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Plus, X, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Urgencia = "alta" | "media" | "baixa";
type Fase = "Inicial" | "Fornecedores" | "Convites" | "Final";

type Tarefa = {
  id: string;
  user_id: string;
  label: string;
  urgencia: Urgencia;
  fase: Fase;
  done: boolean;
  created_at: string;
};

const TAREFAS_PADRAO: { label: string; urgencia: Urgencia; fase: Fase }[] = [
  { label: "Definir data e estilo do casamento", urgencia: "alta", fase: "Inicial" },
  { label: "Fechar local da festa", urgencia: "alta", fase: "Inicial" },
  { label: "Criar lista de convidados preliminar", urgencia: "alta", fase: "Inicial" },
  { label: "Definir orçamento total", urgencia: "alta", fase: "Inicial" },
  { label: "Contratar fotógrafo", urgencia: "media", fase: "Fornecedores" },
  { label: "Contratar videógrafo", urgencia: "media", fase: "Fornecedores" },
  { label: "Cotar e fechar buffet", urgencia: "alta", fase: "Fornecedores" },
  { label: "Escolher e contratar decoração", urgencia: "media", fase: "Fornecedores" },
  { label: "Contratar DJ ou banda", urgencia: "media", fase: "Fornecedores" },
  { label: "Escolher vestido / traje", urgencia: "media", fase: "Fornecedores" },
  { label: "Criar e enviar convites", urgencia: "alta", fase: "Convites" },
  { label: "Criar lista de presentes", urgencia: "baixa", fase: "Convites" },
  { label: "Confirmar presença dos convidados", urgencia: "media", fase: "Convites" },
  { label: "Degustação do buffet", urgencia: "media", fase: "Final" },
  { label: "Prova do vestido / roupa", urgencia: "alta", fase: "Final" },
  { label: "Reunião final com todos os fornecedores", urgencia: "alta", fase: "Final" },
];

const FASES: Fase[] = ["Inicial", "Fornecedores", "Convites", "Final"];

const URGENCIA_CORES: Record<Urgencia, string> = {
  alta: "bg-red-100 text-red-700 border border-red-200",
  media: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  baixa: "bg-green-100 text-green-700 border border-green-200",
};

const URGENCIA_LABELS: Record<Urgencia, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroUrgencia, setFiltroUrgencia] = useState<Urgencia | "todas">("todas");
  const [novaLabel, setNovaLabel] = useState("");
  const [novaUrgencia, setNovaUrgencia] = useState<Urgencia>("media");
  const [novaFase, setNovaFase] = useState<Fase>("Inicial");
  const [adicionando, setAdicionando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarTarefas();
  }, []);

  async function carregarTarefas() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("tarefas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (error) { setLoading(false); return; }

    if (!data || data.length === 0) {
      const seedData = TAREFAS_PADRAO.map((t) => ({
        user_id: user.id,
        label: t.label,
        urgencia: t.urgencia,
        fase: t.fase,
        done: false,
      }));
      const { data: inserted } = await supabase.from("tarefas").insert(seedData).select();
      setTarefas((inserted as Tarefa[]) || []);
    } else {
      setTarefas(data as Tarefa[]);
    }
    setLoading(false);
  }

  async function toggleDone(tarefa: Tarefa) {
    const supabase = createClient();
    const { data } = await supabase
      .from("tarefas")
      .update({ done: !tarefa.done })
      .eq("id", tarefa.id)
      .select()
      .single();
    if (data) {
      setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? (data as Tarefa) : t)));
    }
  }

  async function deletarTarefa(id: string) {
    const supabase = createClient();
    await supabase.from("tarefas").delete().eq("id", id);
    setTarefas((prev) => prev.filter((t) => t.id !== id));
  }

  async function adicionarTarefa() {
    if (!novaLabel.trim()) return;
    setSalvando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }

    const { data } = await supabase
      .from("tarefas")
      .insert({ user_id: user.id, label: novaLabel.trim(), urgencia: novaUrgencia, fase: novaFase, done: false })
      .select()
      .single();

    if (data) {
      setTarefas((prev) => [...prev, data as Tarefa]);
    }
    setNovaLabel("");
    setNovaUrgencia("media");
    setNovaFase("Inicial");
    setAdicionando(false);
    setSalvando(false);
  }

  const tarefasFiltradas = filtroUrgencia === "todas"
    ? tarefas
    : tarefas.filter((t) => t.urgencia === filtroUrgencia);

  const total = tarefas.length;
  const feitas = tarefas.filter((t) => t.done).length;
  const progresso = total > 0 ? Math.round((feitas / total) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#f9efcc] animate-pulse rounded-xl h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "Playfair Display, serif" }}>
          Lista de Tarefas
        </h1>
        <p className="text-sm text-[#9a6e0a] mt-1">
          {feitas} de {total} tarefas concluídas
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-2">
        <div className="flex justify-between text-sm text-[#664708]">
          <span>Progresso geral</span>
          <span>{progresso}%</span>
        </div>
        <div className="w-full bg-[#f9efcc] rounded-full h-3">
          <div
            className="bg-[#d4a017] h-3 rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["todas", "alta", "media", "baixa"] as const).map((u) => (
          <button
            key={u}
            onClick={() => setFiltroUrgencia(u)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filtroUrgencia === u
                ? "bg-[#d4a017] text-white"
                : "bg-white border border-[#f2dc93] text-[#664708] hover:border-[#d4a017]"
            }`}
          >
            {u === "todas" ? "Todas" : URGENCIA_LABELS[u]}
          </button>
        ))}
      </div>

      {FASES.map((fase) => {
        const tarefasFase = tarefasFiltradas.filter((t) => t.fase === fase);
        if (tarefasFase.length === 0) return null;
        return (
          <div key={fase} className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-3">
            <h2 className="text-base font-bold text-[#664708]">{fase}</h2>
            <div className="space-y-2">
              {tarefasFase.map((tarefa) => (
                <div
                  key={tarefa.id}
                  className="flex items-center gap-3 py-2 border-b border-[#f9efcc] last:border-0 group"
                >
                  <button onClick={() => toggleDone(tarefa)} className="flex-shrink-0">
                    {tarefa.done
                      ? <CheckCircle2 size={20} className="text-[#d4a017]" />
                      : <Circle size={20} className="text-[#f2dc93]" />
                    }
                  </button>
                  <span className={`flex-1 text-sm ${tarefa.done ? "line-through text-[#9a6e0a]/50" : "text-[#1a1208]"}`}>
                    {tarefa.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCIA_CORES[tarefa.urgencia]}`}>
                    {URGENCIA_LABELS[tarefa.urgencia]}
                  </span>
                  <button
                    onClick={() => deletarTarefa(tarefa.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {tarefasFiltradas.length === 0 && !adicionando && (
        <div className="text-center py-10 text-[#9a6e0a] text-sm">
          Nenhuma tarefa encontrada.
        </div>
      )}

      {!adicionando ? (
        <button
          onClick={() => setAdicionando(true)}
          className="w-full bg-white border border-dashed border-[#d4a017] text-[#d4a017] hover:bg-[#fdf9ee] rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Adicionar tarefa
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#664708]">Nova tarefa</span>
            <button onClick={() => setAdicionando(false)} className="text-[#9a6e0a] hover:text-[#664708]">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Descrição da tarefa..."
            value={novaLabel}
            onChange={(e) => setNovaLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && adicionarTarefa()}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
          />
          <div className="flex gap-2">
            <select
              value={novaUrgencia}
              onChange={(e) => setNovaUrgencia(e.target.value as Urgencia)}
              className="flex-1 border border-[#f2dc93] bg-white rounded-xl px-3 py-2 text-[#1a1208] text-sm focus:outline-none focus:border-[#d4a017]"
            >
              <option value="alta">Urgência: Alta</option>
              <option value="media">Urgência: Média</option>
              <option value="baixa">Urgência: Baixa</option>
            </select>
            <select
              value={novaFase}
              onChange={(e) => setNovaFase(e.target.value as Fase)}
              className="flex-1 border border-[#f2dc93] bg-white rounded-xl px-3 py-2 text-[#1a1208] text-sm focus:outline-none focus:border-[#d4a017]"
            >
              {FASES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <button
            onClick={adicionarTarefa}
            disabled={salvando || !novaLabel.trim()}
            className="bg-[#d4a017] hover:bg-[#b8860b] text-white font-bold rounded-xl px-5 py-3 transition-all w-full disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      )}
    </div>
  );
}

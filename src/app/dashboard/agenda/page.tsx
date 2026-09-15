"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Plus, X, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type TipoCompromisso = "Fornecedor" | "Prova" | "Degustação" | "Outro";

type Compromisso = {
  id: string;
  user_id: string;
  titulo: string;
  data_hora: string;
  local: string | null;
  tipo: TipoCompromisso;
  created_at: string;
};

const TIPO_CORES: Record<TipoCompromisso, string> = {
  Fornecedor: "bg-blue-100 text-blue-700 border border-blue-200",
  Prova: "bg-purple-100 text-purple-700 border border-purple-200",
  Degustação: "bg-green-100 text-green-700 border border-green-200",
  Outro: "bg-[#f9efcc] text-[#664708] border border-[#f2dc93]",
};

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function AgendaPage() {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [loading, setLoading] = useState(true);
  const [adicionando, setAdicionando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("");
  const [tipo, setTipo] = useState<TipoCompromisso>("Outro");

  useEffect(() => {
    carregarCompromissos();
  }, []);

  async function carregarCompromissos() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("agenda")
      .select("*")
      .eq("user_id", user.id)
      .order("data_hora");

    setCompromissos((data as Compromisso[]) || []);
    setLoading(false);
  }

  async function adicionarCompromisso() {
    if (!titulo.trim() || !data || !horario) return;
    setSalvando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }

    const dataHora = `${data}T${horario}:00`;

    const { data: inserted } = await supabase
      .from("agenda")
      .insert({
        user_id: user.id,
        titulo: titulo.trim(),
        data_hora: dataHora,
        local: local.trim() || null,
        tipo,
      })
      .select()
      .single();

    if (inserted) {
      setCompromissos((prev) =>
        [...prev, inserted as Compromisso].sort(
          (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
        )
      );
    }
    setTitulo("");
    setData("");
    setHorario("");
    setLocal("");
    setTipo("Outro");
    setAdicionando(false);
    setSalvando(false);
  }

  async function deletarCompromisso(id: string) {
    const supabase = createClient();
    await supabase.from("agenda").delete().eq("id", id);
    setCompromissos((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#f9efcc] animate-pulse rounded-xl h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "Playfair Display, serif" }}>
          Agenda
        </h1>
        <p className="text-sm text-[#9a6e0a] mt-1">{compromissos.length} compromisso{compromissos.length !== 1 ? "s" : ""}</p>
      </div>

      {compromissos.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Calendar size={40} className="mx-auto text-[#f2dc93]" />
          <p className="text-[#9a6e0a] text-sm">Nenhum compromisso. Agende sua primeira visita!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {compromissos.map((c) => {
            const dt = new Date(c.data_hora);
            const dia = dt.getDate();
            const mes = MESES[dt.getMonth()];
            const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-[#f9efcc] p-4 flex gap-4 group">
                <div className="flex-shrink-0 w-14 h-14 bg-[#fdf9ee] rounded-xl flex flex-col items-center justify-center border border-[#f2dc93]">
                  <span className="text-xl font-bold text-[#d4a017] leading-tight">{dia}</span>
                  <span className="text-xs text-[#9a6e0a] uppercase">{mes}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1a1208]">{c.titulo}</p>
                    <button
                      onClick={() => deletarCompromisso(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-[#9a6e0a]">
                      <Clock size={11} />
                      {hora}
                    </span>
                    {c.local && (
                      <span className="flex items-center gap-1 text-xs text-[#9a6e0a] truncate">
                        <MapPin size={11} />
                        {c.local}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_CORES[c.tipo]}`}>
                      {c.tipo}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!adicionando ? (
        <button
          onClick={() => setAdicionando(true)}
          className="w-full bg-white border border-dashed border-[#d4a017] text-[#d4a017] hover:bg-[#fdf9ee] rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Adicionar compromisso
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#664708]">Novo compromisso</span>
            <button onClick={() => setAdicionando(false)} className="text-[#9a6e0a] hover:text-[#664708]">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Título *"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="flex-1 border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] text-sm"
            />
            <input
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="flex-1 border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] text-sm"
            />
          </div>
          <input
            type="text"
            placeholder="Local (opcional)"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCompromisso)}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] text-sm"
          >
            <option value="Fornecedor">Fornecedor</option>
            <option value="Prova">Prova</option>
            <option value="Degustação">Degustação</option>
            <option value="Outro">Outro</option>
          </select>
          <button
            onClick={adicionarCompromisso}
            disabled={salvando || !titulo.trim() || !data || !horario}
            className="bg-[#d4a017] hover:bg-[#b8860b] text-white font-bold rounded-xl px-5 py-3 transition-all w-full disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      )}
    </div>
  );
}

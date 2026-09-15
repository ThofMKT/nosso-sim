"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, X, Trash2, Link2, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Prioridade = "Alta" | "Media" | "Substituivel";
type Status = "Pendente" | "Confirmado" | "Recusou";
type Aba = "Todos" | "Confirmados" | "Pendentes";

type Convidado = {
  id: string;
  user_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  prioridade: Prioridade;
  status: Status;
  created_at: string;
};

const STATUS_CICLO: Record<Status, Status> = {
  Pendente: "Confirmado",
  Confirmado: "Recusou",
  Recusou: "Pendente",
};

const STATUS_CORES: Record<Status, string> = {
  Pendente: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Confirmado: "bg-green-100 text-green-700 border border-green-200",
  Recusou: "bg-red-100 text-red-700 border border-red-200",
};

const PRIORIDADE_CORES: Record<Prioridade, string> = {
  Alta: "bg-[#f2dc93] text-[#664708]",
  Media: "bg-[#f9efcc] text-[#9a6e0a]",
  Substituivel: "bg-gray-100 text-gray-500",
};

export default function ConvidadosPage() {
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<Aba>("Todos");
  const [adicionando, setAdicionando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("Alta");
  const [casalId, setCasalId] = useState<string | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  useEffect(() => {
    carregarConvidados();
  }, []);

  async function carregarConvidados() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: convidadosData }, { data: casalData }] = await Promise.all([
      supabase.from("convidados").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("casais").select("id").eq("user_id", user.id).single(),
    ]);

    setConvidados((convidadosData as Convidado[]) || []);
    if (casalData) setCasalId(casalData.id);
    setLoading(false);
  }

  function copiarLinkRSVP() {
    if (!casalId) return;
    const url = `${window.location.origin}/rsvp/${casalId}`;
    navigator.clipboard.writeText(url);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2500);
  }

  async function adicionarConvidado() {
    if (!nome.trim()) return;
    setSalvando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }

    const { data } = await supabase
      .from("convidados")
      .insert({
        user_id: user.id,
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        prioridade,
        status: "Pendente",
      })
      .select()
      .single();

    if (data) {
      setConvidados((prev) => [...prev, data as Convidado]);
    }
    setNome("");
    setTelefone("");
    setPrioridade("Alta");
    setAdicionando(false);
    setSalvando(false);
  }

  async function alterarStatus(convidado: Convidado) {
    const novoStatus = STATUS_CICLO[convidado.status];
    const supabase = createClient();
    const { data } = await supabase
      .from("convidados")
      .update({ status: novoStatus })
      .eq("id", convidado.id)
      .select()
      .single();
    if (data) {
      setConvidados((prev) => prev.map((c) => (c.id === convidado.id ? (data as Convidado) : c)));
    }
  }

  async function deletarConvidado(id: string) {
    const supabase = createClient();
    await supabase.from("convidados").delete().eq("id", id);
    setConvidados((prev) => prev.filter((c) => c.id !== id));
  }

  const filtrados = convidados
    .filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((c) => {
      if (aba === "Confirmados") return c.status === "Confirmado";
      if (aba === "Pendentes") return c.status === "Pendente";
      return true;
    });

  const total = convidados.length;
  const confirmados = convidados.filter((c) => c.status === "Confirmado").length;
  const pendentes = convidados.filter((c) => c.status === "Pendente").length;
  const recusaram = convidados.filter((c) => c.status === "Recusou").length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#f9efcc] animate-pulse rounded-xl h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "Playfair Display, serif" }}>
          Lista de Convidados
        </h1>
      </div>

      {/* RSVP Link */}
      {casalId && (
        <div className="bg-[#1a1208] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={14} className="text-[#d4a017]" />
            <span className="text-xs font-bold text-[#eac85a] uppercase tracking-wide">Link de Confirmação (RSVP)</span>
          </div>
          <p className="text-white/60 text-xs mb-3">
            Compartilhe com seus convidados para eles confirmarem presença online.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 rounded-xl px-3 py-2.5 text-[#eac85a] text-xs font-mono truncate">
              {typeof window !== "undefined" ? `${window.location.origin}/rsvp/${casalId}` : `/rsvp/${casalId}`}
            </div>
            <button
              onClick={copiarLinkRSVP}
              className="bg-[#d4a017] hover:bg-[#b8860b] text-white rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold transition-all flex-shrink-0"
            >
              {linkCopiado ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Confirme sua presença no nosso casamento! ${typeof window !== "undefined" ? window.location.origin : ""}/rsvp/${casalId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-3 py-2 text-xs font-bold transition-all flex-shrink-0"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", valor: total, cor: "text-[#1a1208]" },
          { label: "Confirmados", valor: confirmados, cor: "text-green-600" },
          { label: "Pendentes", valor: pendentes, cor: "text-yellow-600" },
          { label: "Recusaram", valor: recusaram, cor: "text-red-600" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-[#f9efcc] p-4 text-center">
            <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
            <p className="text-xs text-[#9a6e0a] mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["Todos", "Confirmados", "Pendentes"] as Aba[]).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              aba === a
                ? "bg-[#d4a017] text-white"
                : "bg-white border border-[#f2dc93] text-[#664708] hover:border-[#d4a017]"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a6e0a]" />
        <input
          type="text"
          placeholder="Buscar convidado..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full border border-[#f2dc93] bg-white rounded-xl pl-9 pr-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Users size={40} className="mx-auto text-[#f2dc93]" />
          <p className="text-[#9a6e0a] text-sm">
            {convidados.length === 0
              ? "Nenhum convidado ainda. Adicione o primeiro!"
              : "Nenhum convidado encontrado."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-[#f9efcc] p-4 flex items-center gap-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1208] truncate">{c.nome}</p>
                {c.telefone && (
                  <p className="text-xs text-[#9a6e0a] mt-0.5">{c.telefone}</p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORIDADE_CORES[c.prioridade]}`}>
                {c.prioridade}
              </span>
              <button
                onClick={() => alterarStatus(c)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-all ${STATUS_CORES[c.status]}`}
              >
                {c.status}
              </button>
              <button
                onClick={() => deletarConvidado(c.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!adicionando ? (
        <button
          onClick={() => setAdicionando(true)}
          className="w-full bg-white border border-dashed border-[#d4a017] text-[#d4a017] hover:bg-[#fdf9ee] rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Adicionar convidado
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#664708]">Novo convidado</span>
            <button onClick={() => setAdicionando(false)} className="text-[#9a6e0a] hover:text-[#664708]">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Nome do convidado *"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
          />
          <input
            type="text"
            placeholder="Telefone (opcional)"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
          />
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as Prioridade)}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] text-sm"
          >
            <option value="Alta">Alta prioridade</option>
            <option value="Media">Média prioridade</option>
            <option value="Substituivel">Substituível</option>
          </select>
          <button
            onClick={adicionarConvidado}
            disabled={salvando || !nome.trim()}
            className="bg-[#d4a017] hover:bg-[#b8860b] text-white font-bold rounded-xl px-5 py-3 transition-all w-full disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      )}
    </div>
  );
}

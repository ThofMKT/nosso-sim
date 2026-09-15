"use client";

import { useState, useEffect } from "react";
import { Gift, Plus, X, Trash2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type StatusPresente = "Disponivel" | "Reservado" | "Entregue";

type Presente = {
  id: string;
  user_id: string;
  nome: string;
  valor: number;
  status: StatusPresente;
  reservado_por: string | null;
  created_at: string;
};

const STATUS_CICLO: Record<StatusPresente, StatusPresente> = {
  Disponivel: "Reservado",
  Reservado: "Entregue",
  Entregue: "Disponivel",
};

const STATUS_CORES: Record<StatusPresente, string> = {
  Disponivel: "bg-[#f9efcc] text-[#664708] border border-[#f2dc93]",
  Reservado: "bg-blue-100 text-blue-700 border border-blue-200",
  Entregue: "bg-green-100 text-green-700 border border-green-200",
};

const STATUS_LABELS: Record<StatusPresente, string> = {
  Disponivel: "Disponível",
  Reservado: "Reservado",
  Entregue: "Entregue",
};

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

export default function PresentesPage() {
  const [presentes, setPresentes] = useState<Presente[]>([]);
  const [loading, setLoading] = useState(true);
  const [adicionando, setAdicionando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [editandoPix, setEditandoPix] = useState(false);
  const [salvandoPix, setSalvandoPix] = useState(false);
  const [pixInput, setPixInput] = useState("");
  const [casalId, setCasalId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [presentesRes, casalRes] = await Promise.all([
      supabase.from("presentes").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("casais").select("id, chave_pix").eq("user_id", user.id).maybeSingle(),
    ]);

    setPresentes((presentesRes.data as Presente[]) || []);
    if (casalRes.data) {
      setCasalId(casalRes.data.id);
      setChavePix(casalRes.data.chave_pix || "");
      setPixInput(casalRes.data.chave_pix || "");
    }
    setLoading(false);
  }

  async function adicionarPresente() {
    if (!nome.trim()) return;
    setSalvando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }

    const { data } = await supabase
      .from("presentes")
      .insert({
        user_id: user.id,
        nome: nome.trim(),
        valor: parseInt(valor.replace(/\D/g, ""), 10) || 0,
        status: "Disponivel",
      })
      .select()
      .single();

    if (data) {
      setPresentes((prev) => [...prev, data as Presente]);
    }
    setNome("");
    setValor("");
    setAdicionando(false);
    setSalvando(false);
  }

  async function alterarStatus(presente: Presente) {
    const novoStatus = STATUS_CICLO[presente.status];
    const supabase = createClient();
    const { data } = await supabase
      .from("presentes")
      .update({ status: novoStatus })
      .eq("id", presente.id)
      .select()
      .single();
    if (data) {
      setPresentes((prev) => prev.map((p) => (p.id === presente.id ? (data as Presente) : p)));
    }
  }

  async function deletarPresente(id: string) {
    const supabase = createClient();
    await supabase.from("presentes").delete().eq("id", id);
    setPresentes((prev) => prev.filter((p) => p.id !== id));
  }

  async function salvarPix() {
    if (!casalId) return;
    setSalvandoPix(true);
    const supabase = createClient();
    await supabase.from("casais").update({ chave_pix: pixInput.trim() }).eq("id", casalId);
    setChavePix(pixInput.trim());
    setEditandoPix(false);
    setSalvandoPix(false);
  }

  const totalItens = presentes.length;
  const valorTotal = presentes.reduce((acc, p) => acc + p.valor, 0);
  const valorRecebido = presentes
    .filter((p) => p.status === "Entregue")
    .reduce((acc, p) => acc + p.valor, 0);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#f9efcc] animate-pulse rounded-xl h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "Playfair Display, serif" }}>
          Lista de Presentes
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-4 text-center">
          <p className="text-2xl font-bold text-[#1a1208]">{totalItens}</p>
          <p className="text-xs text-[#9a6e0a] mt-1">Total de itens</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-4 text-center">
          <p className="text-lg font-bold text-[#d4a017]">{formatBRL(valorTotal)}</p>
          <p className="text-xs text-[#9a6e0a] mt-1">Valor total</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-4 text-center">
          <p className="text-lg font-bold text-green-600">{formatBRL(valorRecebido)}</p>
          <p className="text-xs text-[#9a6e0a] mt-1">Recebido</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#664708]">Chave PIX</p>
          {!editandoPix && (
            <button
              onClick={() => setEditandoPix(true)}
              className="text-xs text-[#d4a017] hover:text-[#b8860b] font-medium transition-all"
            >
              {chavePix ? "Editar" : "Adicionar"}
            </button>
          )}
        </div>
        {editandoPix ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua chave PIX..."
              value={pixInput}
              onChange={(e) => setPixInput(e.target.value)}
              className="flex-1 border border-[#f2dc93] bg-white rounded-xl px-4 py-2 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
              autoFocus
            />
            <button
              onClick={salvarPix}
              disabled={salvandoPix}
              className="bg-[#d4a017] hover:bg-[#b8860b] text-white rounded-xl p-2 transition-all"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => { setEditandoPix(false); setPixInput(chavePix); }}
              className="border border-[#f2dc93] text-[#9a6e0a] hover:text-[#664708] rounded-xl p-2 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <p className={`text-sm ${chavePix ? "text-[#1a1208] font-mono" : "text-[#9a6e0a] italic"}`}>
            {chavePix || "Nenhuma chave PIX cadastrada"}
          </p>
        )}
      </div>

      {presentes.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Gift size={40} className="mx-auto text-[#f2dc93]" />
          <p className="text-[#9a6e0a] text-sm">Nenhum presente na lista. Adicione o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {presentes.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#f9efcc] p-4 flex items-center gap-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1208] truncate">{p.nome}</p>
                <p className="text-sm font-bold text-[#d4a017] mt-0.5">{formatBRL(p.valor)}</p>
              </div>
              <button
                onClick={() => alterarStatus(p)}
                className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-all ${STATUS_CORES[p.status]}`}
              >
                {STATUS_LABELS[p.status]}
              </button>
              <button
                onClick={() => deletarPresente(p.id)}
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
          Adicionar presente
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#664708]">Novo presente</span>
            <button onClick={() => setAdicionando(false)} className="text-[#9a6e0a] hover:text-[#664708]">
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Nome do presente *"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
          />
          <input
            type="number"
            placeholder="Valor em R$ (opcional)"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
          />
          <button
            onClick={adicionarPresente}
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

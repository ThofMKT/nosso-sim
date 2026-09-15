"use client";

import { useState, useEffect } from "react";
import { DollarSign, AlertTriangle, Plus, X, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type OrcamentoItem = {
  id: string;
  user_id: string;
  categoria: string;
  percentual_recomendado: number;
  valor_gasto: number;
  created_at: string;
};

type ItemComUI = OrcamentoItem & {
  lancando: boolean;
  novoValor: string;
};

const CATEGORIAS_PADRAO = [
  { categoria: "Espaço / Local", percentual_recomendado: 30 },
  { categoria: "Buffet / Alimentação", percentual_recomendado: 35 },
  { categoria: "Fotografia / Vídeo", percentual_recomendado: 10 },
  { categoria: "Decoração / Flores", percentual_recomendado: 10 },
  { categoria: "Vestuário", percentual_recomendado: 8 },
  { categoria: "Outros", percentual_recomendado: 7 },
];

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

export default function OrcamentoPage() {
  const [itens, setItens] = useState<ItemComUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [orcamentoTotal, setOrcamentoTotal] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem("nosso-sim-onboarding");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const total = Number(parsed.orcamento || parsed.budget || 0);
        setOrcamentoTotal(total);
      } catch {
        setOrcamentoTotal(0);
      }
    }
    carregarItens();
  }, []);

  async function carregarItens() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("orcamento_itens")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (error) { setLoading(false); return; }

    if (!data || data.length === 0) {
      const seedData = CATEGORIAS_PADRAO.map((c) => ({
        user_id: user.id,
        categoria: c.categoria,
        percentual_recomendado: c.percentual_recomendado,
        valor_gasto: 0,
      }));
      const { data: inserted } = await supabase.from("orcamento_itens").insert(seedData).select();
      setItens(((inserted as OrcamentoItem[]) || []).map((i) => ({ ...i, lancando: false, novoValor: "" })));
    } else {
      setItens((data as OrcamentoItem[]).map((i) => ({ ...i, lancando: false, novoValor: "" })));
    }
    setLoading(false);
  }

  function abrirLancamento(id: string) {
    setItens((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, lancando: true, novoValor: i.valor_gasto > 0 ? String(i.valor_gasto) : "" }
          : { ...i, lancando: false }
      )
    );
  }

  async function salvarGasto(item: ItemComUI) {
    const valor = parseInt(item.novoValor.replace(/\D/g, ""), 10) || 0;
    const supabase = createClient();
    const { data } = await supabase
      .from("orcamento_itens")
      .update({ valor_gasto: valor })
      .eq("id", item.id)
      .select()
      .single();
    if (data) {
      setItens((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...(data as OrcamentoItem), lancando: false, novoValor: "" } : i
        )
      );
    }
  }

  function cancelarLancamento(id: string) {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, lancando: false, novoValor: "" } : i)));
  }

  const gastoTotal = itens.reduce((acc, i) => acc + i.valor_gasto, 0);
  const restante = orcamentoTotal - gastoTotal;
  const progressoTotal = orcamentoTotal > 0 ? Math.min(100, Math.round((gastoTotal / orcamentoTotal) * 100)) : 0;

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
          Orçamento
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-[#9a6e0a] mb-1">Orçamento total</p>
            <p className="text-lg font-bold text-[#1a1208]">{formatBRL(orcamentoTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-[#9a6e0a] mb-1">Gasto até agora</p>
            <p className="text-lg font-bold text-[#d4a017]">{formatBRL(gastoTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-[#9a6e0a] mb-1">Restante</p>
            <p className={`text-lg font-bold ${restante < 0 ? "text-red-600" : "text-green-600"}`}>
              {formatBRL(restante)}
            </p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-[#9a6e0a] mb-1">
            <span>Progresso geral</span>
            <span>{progressoTotal}%</span>
          </div>
          <div className="w-full bg-[#f9efcc] rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${progressoTotal > 100 ? "bg-red-500" : "bg-[#d4a017]"}`}
              style={{ width: `${Math.min(progressoTotal, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {itens.map((item) => {
          const valorRecomendado = Math.round((item.percentual_recomendado / 100) * orcamentoTotal);
          const progressoCat = valorRecomendado > 0 ? Math.min(100, Math.round((item.valor_gasto / valorRecomendado) * 100)) : 0;
          const excedido = item.valor_gasto > valorRecomendado && valorRecomendado > 0;

          return (
            <div key={item.id} className="bg-white rounded-2xl border border-[#f9efcc] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1a1208]">{item.categoria}</p>
                  <p className="text-xs text-[#9a6e0a] mt-0.5">
                    Recomendado: {item.percentual_recomendado}% — {formatBRL(valorRecomendado)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold ${excedido ? "text-red-600" : "text-[#d4a017]"}`}>
                    {formatBRL(item.valor_gasto)}
                  </p>
                  {excedido && (
                    <div className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                      <AlertTriangle size={11} />
                      Excedido
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full bg-[#f9efcc] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${excedido ? "bg-red-500" : "bg-[#d4a017]"}`}
                  style={{ width: `${progressoCat}%` }}
                />
              </div>

              {item.lancando ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Valor gasto (R$)"
                    value={item.novoValor}
                    onChange={(e) =>
                      setItens((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, novoValor: e.target.value } : i))
                      )
                    }
                    onKeyDown={(e) => e.key === "Enter" && salvarGasto(item)}
                    className="flex-1 border border-[#f2dc93] bg-white rounded-xl px-4 py-2 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => salvarGasto(item)}
                    className="bg-[#d4a017] hover:bg-[#b8860b] text-white rounded-xl p-2 transition-all"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => cancelarLancamento(item.id)}
                    className="border border-[#f2dc93] text-[#9a6e0a] hover:text-[#664708] rounded-xl p-2 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => abrirLancamento(item.id)}
                  className="text-xs text-[#d4a017] hover:text-[#b8860b] font-medium flex items-center gap-1 transition-all"
                >
                  <Plus size={13} />
                  Lançar gasto
                </button>
              )}
            </div>
          );
        })}
      </div>

      {orcamentoTotal === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <DollarSign size={18} className="text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            Orçamento total não definido. Configure no onboarding para ver as recomendações.
          </p>
        </div>
      )}
    </div>
  );
}

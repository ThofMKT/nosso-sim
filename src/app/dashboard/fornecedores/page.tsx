"use client";

import { useState } from "react";
import { Search, Star, MapPin, Phone, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

type Categoria = "Fotografia" | "Buffet" | "Decoração" | "Música" | "Espaço" | "Bolo" | "Cerimonialista";

type Fornecedor = {
  id: number;
  nome: string;
  categoria: Categoria;
  avaliacao: number;
  precoMin: number;
  precoMax: number;
  cidade: string;
  recomendado: boolean;
};

const FORNECEDORES: Fornecedor[] = [
  { id: 1, nome: "Studio Luz & Sombra", categoria: "Fotografia", avaliacao: 4.9, precoMin: 5000, precoMax: 12000, cidade: "São Paulo, SP", recomendado: true },
  { id: 2, nome: "Buffet Sabor & Arte", categoria: "Buffet", avaliacao: 4.7, precoMin: 15000, precoMax: 40000, cidade: "São Paulo, SP", recomendado: true },
  { id: 3, nome: "Flor & Forma Decorações", categoria: "Decoração", avaliacao: 4.8, precoMin: 8000, precoMax: 20000, cidade: "Campinas, SP", recomendado: false },
  { id: 4, nome: "Banda Alegria Total", categoria: "Música", avaliacao: 4.5, precoMin: 3000, precoMax: 8000, cidade: "São Paulo, SP", recomendado: true },
  { id: 5, nome: "Espaço Villa Real", categoria: "Espaço", avaliacao: 4.9, precoMin: 12000, precoMax: 30000, cidade: "Barueri, SP", recomendado: false },
  { id: 6, nome: "Confeitaria Bolo dos Sonhos", categoria: "Bolo", avaliacao: 4.6, precoMin: 800, precoMax: 3000, cidade: "São Paulo, SP", recomendado: true },
  { id: 7, nome: "Ana Paula Eventos", categoria: "Cerimonialista", avaliacao: 4.8, precoMin: 5000, precoMax: 15000, cidade: "São Paulo, SP", recomendado: false },
  { id: 8, nome: "DJ Master Hits", categoria: "Música", avaliacao: 4.4, precoMin: 2000, precoMax: 5000, cidade: "Santo André, SP", recomendado: false },
];

const CATEGORIAS: Categoria[] = ["Fotografia", "Buffet", "Decoração", "Música", "Espaço", "Bolo", "Cerimonialista"];

function formatPreco(min: number, max: number): string {
  const fmt = (v: number) =>
    v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`;
  return `${fmt(min)} – ${fmt(max)}`;
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(nota) ? "text-[#d4a017] fill-[#d4a017]" : "text-[#f2dc93]"}
        />
      ))}
      <span className="text-xs text-[#9a6e0a] ml-1">{nota}</span>
    </div>
  );
}

export default function FornecedoresPage() {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | "Todos">("Todos");

  const filtrados = FORNECEDORES.filter((f) => {
    const matchCat = filtroCategoria === "Todos" || f.categoria === filtroCategoria;
    const matchBusca =
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      f.cidade.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "var(--font-playfair)" }}>
              Fornecedores
            </h1>
            <span className="bg-[#d4a017] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={9} />
              IA
            </span>
          </div>
          <p className="text-sm text-[#9a6e0a]">Busca inteligente por região e orçamento</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a6e0a]" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou cidade..."
          className="w-full border border-[#f2dc93] bg-white rounded-xl pl-10 pr-4 py-3 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltroCategoria("Todos")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            filtroCategoria === "Todos"
              ? "bg-[#d4a017] text-white border-[#d4a017]"
              : "bg-white text-[#9a6e0a] border-[#f2dc93] hover:border-[#d4a017]"
          }`}
        >
          Todos
        </button>
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            onClick={() => setFiltroCategoria(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              filtroCategoria === c
                ? "bg-[#d4a017] text-white border-[#d4a017]"
                : "bg-white text-[#9a6e0a] border-[#f2dc93] hover:border-[#d4a017]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtrados.map((f) => (
          <div key={f.id} className="bg-white rounded-2xl border border-[#f9efcc] p-5 flex flex-col gap-3 hover:border-[#eac85a] hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[#1a1208] text-sm">{f.nome}</p>
                <span className="text-[10px] font-semibold text-[#9a6e0a] bg-[#fdf9ee] px-2 py-0.5 rounded-full">
                  {f.categoria}
                </span>
              </div>
              {f.recomendado && (
                <span className="text-[10px] font-bold text-[#d4a017] bg-[#f9efcc] px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1">
                  <Star size={9} className="fill-[#d4a017]" />
                  Recomendado
                </span>
              )}
            </div>

            <Estrelas nota={f.avaliacao} />

            <div className="flex items-center gap-4 text-xs text-[#9a6e0a]">
              <span className="font-semibold text-[#664708]">{formatPreco(f.precoMin, f.precoMax)}</span>
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {f.cidade}
              </span>
            </div>

            <button className="mt-auto flex items-center justify-center gap-1.5 border border-[#d4a017] text-[#d4a017] hover:bg-[#d4a017] hover:text-white font-semibold rounded-xl py-2.5 text-sm transition-all">
              <Phone size={13} />
              Ver contato
            </button>
          </div>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-16 text-[#9a6e0a]">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum fornecedor encontrado</p>
        </div>
      )}

      <div className="bg-[#fdf9ee] rounded-2xl border border-[#f2dc93] p-4 flex items-center gap-3">
        <Sparkles size={18} className="text-[#d4a017] flex-shrink-0" />
        <p className="text-xs text-[#664708]">
          <strong>Em breve:</strong> integração com IA para busca personalizada por orçamento e região.
          Os dados acima são exemplos ilustrativos.
        </p>
      </div>
    </div>
  );
}

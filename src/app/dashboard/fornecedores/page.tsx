"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles, Star, MapPin, Phone, MessageCircle, Globe,
  Bookmark, BookmarkCheck, ChevronRight, Loader2,
  RefreshCw, AlertCircle, CheckCircle2, DollarSign,
  Camera, UtensilsCrossed, Flower2, Music2, Cake,
  ClipboardList, Scissors, Car,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Fornecedor = {
  nome: string;
  especialidade: string;
  bairro: string;
  descricao: string;
  precoMin: number;
  precoMax: number;
  avaliacao: number;
  telefone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  site?: string | null;
  adequado: boolean;
  salvo?: boolean;
};

type CategoriaData = {
  fornecedores: Fornecedor[];
  atualizadoEm: string;
};

type FornecedoresDB = {
  cidade: string;
  orcamento: string;
  convidados: string;
  categorias: Record<string, CategoriaData>;
};

const CATEGORIAS = [
  { id: "Fotografia", label: "Fotografia & Filme", icon: Camera, cor: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "Buffet", label: "Buffet & Gastronomia", icon: UtensilsCrossed, cor: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "Decoração", label: "Decoração & Flores", icon: Flower2, cor: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "Música", label: "Música & DJ", icon: Music2, cor: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "Bolo", label: "Bolo & Doces", icon: Cake, cor: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { id: "Cerimonialista", label: "Cerimonialista", icon: ClipboardList, cor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "Beleza", label: "Maquiagem & Cabelo", icon: Scissors, cor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  { id: "Transporte", label: "Transporte & Carro", icon: Car, cor: "bg-sky-50 text-sky-700 border-sky-200" },
];

function formatPreco(min: number, max: number) {
  const fmt = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`;
  return `${fmt(min)} – ${fmt(max)}`;
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={10} className={s <= Math.round(nota) ? "fill-[#d4a017] text-[#d4a017]" : "text-[#f2dc93]"} />
      ))}
      <span className="text-[10px] text-[#9a6e0a] ml-1">{nota.toFixed(1)}</span>
    </div>
  );
}

async function carregarDoSupabase(): Promise<FornecedoresDB | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: casal } = await supabase
      .from("casais")
      .select("fornecedores_data, cidade, orcamento, convidados")
      .eq("user_id", user.id)
      .single();
    if (casal?.fornecedores_data) return JSON.parse(casal.fornecedores_data) as FornecedoresDB;
    if (casal) {
      return {
        cidade: casal.cidade ?? "",
        orcamento: String(casal.orcamento ?? "60000"),
        convidados: String(casal.convidados ?? "200"),
        categorias: {},
      };
    }
  } catch {}
  const local = localStorage.getItem("nosso-sim-fornecedores");
  if (local) return JSON.parse(local) as FornecedoresDB;
  return null;
}

async function salvarNoBanco(dados: FornecedoresDB) {
  localStorage.setItem("nosso-sim-fornecedores", JSON.stringify(dados));
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("casais").update({ fornecedores_data: JSON.stringify(dados) }).eq("user_id", user.id);
  } catch {}
}

export default function FornecedoresPage() {
  const [db, setDb] = useState<FornecedoresDB>({ cidade: "", orcamento: "60000", convidados: "200", categorias: {} });
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [fornecedorAberto, setFornecedorAberto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const dados = await carregarDoSupabase();
      if (dados) {
        setDb(dados);
        const primeiraComDados = Object.keys(dados.categorias)[0];
        if (primeiraComDados) setCategoriaSelecionada(primeiraComDados);
      }
      if (!dados?.cidade) {
        const stored = localStorage.getItem("nosso-sim-onboarding");
        if (stored) {
          const d = JSON.parse(stored);
          setDb(prev => ({ ...prev, cidade: d.cidade ?? "", orcamento: d.orcamento ?? "60000", convidados: d.convidados ?? "200" }));
        }
      }
      setLoadingInicial(false);
    }
    init();
  }, []);

  function selecionarCategoria(id: string) {
    setCategoriaSelecionada(id);
    setFornecedorAberto(null);
    setErro(null);
  }

  async function buscarFornecedores() {
    if (!categoriaSelecionada) return;
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: categoriaSelecionada,
          cidade: db.cidade,
          orcamento: db.orcamento,
          convidados: db.convidados,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErro(data.error ?? "Erro ao buscar fornecedores.");
        setLoading(false);
        return;
      }
      if (data.fornecedores && Array.isArray(data.fornecedores)) {
        const anteriores = db.categorias[categoriaSelecionada]?.fornecedores ?? [];
        const comMarcacoes = (data.fornecedores as Fornecedor[]).map(novo => {
          const ant = anteriores.find(a => a.nome === novo.nome);
          return { ...novo, salvo: ant?.salvo };
        });
        const novoDb: FornecedoresDB = {
          ...db,
          categorias: {
            ...db.categorias,
            [categoriaSelecionada]: { fornecedores: comMarcacoes, atualizadoEm: new Date().toISOString() },
          },
        };
        setDb(novoDb);
        await salvarNoBanco(novoDb);
      }
    } catch {
      setErro("Não consegui conectar. Verifique sua conexão e tente novamente.");
    }
    setLoading(false);
  }

  async function toggleSalvo(nome: string) {
    if (!categoriaSelecionada) return;
    const lista = db.categorias[categoriaSelecionada]?.fornecedores ?? [];
    const atualizada = lista.map(f => f.nome === nome ? { ...f, salvo: !f.salvo } : f);
    const novoDb: FornecedoresDB = {
      ...db,
      categorias: {
        ...db.categorias,
        [categoriaSelecionada]: { ...db.categorias[categoriaSelecionada], fornecedores: atualizada },
      },
    };
    setDb(novoDb);
    await salvarNoBanco(novoDb);
  }

  if (loadingInicial) {
    return (
      <div className="min-h-screen bg-[#fdf9ee] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f2dc93] border-t-[#d4a017] rounded-full animate-spin" />
      </div>
    );
  }

  const categoriaInfo = CATEGORIAS.find(c => c.id === categoriaSelecionada);
  const fornecedoresDaCategoria = categoriaSelecionada ? (db.categorias[categoriaSelecionada]?.fornecedores ?? []) : [];
  const temDados = fornecedoresDaCategoria.length > 0;
  const totalSalvos = Object.values(db.categorias).flatMap(c => c.fornecedores).filter(f => f.salvo).length;

  return (
    <div className="min-h-screen bg-[#fdf9ee] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-[#d4a017]" />
            <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "var(--font-playfair)" }}>
              Fornecedores
            </h1>
            <span className="text-[10px] font-bold bg-[#d4a017] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={9} /> IA
            </span>
          </div>
          <p className="text-[#9a6e0a] text-sm">
            {db.cidade
              ? `Sugestões em ${db.cidade}, salvas automaticamente por categoria.`
              : "Sugestões personalizadas por categoria, salvas automaticamente."}
          </p>
        </div>

        {/* Favoritos globais */}
        {totalSalvos > 0 && (
          <div className="bg-[#fdf9ee] border border-[#f2dc93] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#9a6e0a] mb-3 flex items-center gap-1.5">
              <Bookmark size={12} className="fill-[#d4a017] text-[#d4a017]" />
              {totalSalvos} fornecedor{totalSalvos > 1 ? "es" : ""} salvos
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(db.categorias).flatMap(([cat, data]) =>
                data.fornecedores
                  .filter(f => f.salvo)
                  .map(f => (
                    <span key={`${cat}-${f.nome}`} className="text-xs bg-white border border-[#f2dc93] text-[#664708] px-2.5 py-1 rounded-full font-medium">
                      {f.nome}
                      <span className="ml-1 text-[#c9a84c]">· {cat}</span>
                    </span>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Grade de Categorias */}
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5">
          <p className="font-semibold text-[#1a1208] text-sm mb-4">Escolha a categoria</p>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIAS.map(({ id, label, icon: Icon, cor }) => {
              const temCache = !!db.categorias[id]?.fornecedores?.length;
              const ativa = categoriaSelecionada === id;
              return (
                <button
                  key={id}
                  onClick={() => selecionarCategoria(id)}
                  className={`relative flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    ativa ? "border-[#d4a017] bg-[#fdf9ee]" : "border-[#f9efcc] hover:border-[#eac85a] bg-white"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${cor}`}>
                    <Icon size={17} />
                  </div>
                  <span className="text-xs font-semibold text-[#1a1208] leading-tight">{label}</span>
                  {!ativa && temCache && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d4a017]" />
                  )}
                  {ativa && (
                    <CheckCircle2 size={14} className="absolute top-2 right-2 text-[#d4a017]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resultado da categoria selecionada */}
        {categoriaSelecionada && (
          <div className="space-y-4">

            {/* Controle buscar/atualizar */}
            <div className="bg-white rounded-2xl border border-[#f9efcc] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#1a1208] text-sm">{categoriaInfo?.label}</p>
                  {db.categorias[categoriaSelecionada]?.atualizadoEm && (
                    <p className="text-[10px] text-[#c9a84c] mt-0.5">
                      Atualizado em {new Date(db.categorias[categoriaSelecionada].atualizadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                {temDados && (
                  <button
                    onClick={buscarFornecedores}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs text-[#d4a017] hover:text-[#b8860b] font-medium disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Atualizar
                  </button>
                )}
              </div>

              {!temDados && (
                <button
                  onClick={buscarFornecedores}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#1a1208] hover:bg-[#3d2a03] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Buscando com IA...</>
                  ) : (
                    <><Sparkles size={16} className="text-[#d4a017]" /> Buscar {categoriaInfo?.label} com IA</>
                  )}
                </button>
              )}

              {loading && temDados && (
                <div className="flex items-center gap-2 text-sm text-[#9a6e0a]">
                  <Loader2 size={14} className="animate-spin text-[#d4a017]" /> Atualizando sugestões...
                </div>
              )}
            </div>

            {/* Erro */}
            {erro && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Não consegui buscar os fornecedores</p>
                  <p className="text-xs text-red-600 mt-0.5">{erro}</p>
                </div>
              </div>
            )}

            {/* Cards de fornecedores */}
            {fornecedoresDaCategoria.map((f, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border-2 transition-all ${
                  fornecedorAberto === f.nome ? "border-[#d4a017] shadow-md" : "border-[#f9efcc] hover:border-[#eac85a]"
                }`}
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setFornecedorAberto(fornecedorAberto === f.nome ? null : f.nome)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-[#1a1208]">{f.nome}</h3>
                        {f.adequado && (
                          <span className="text-[10px] font-bold bg-[#fdf9ee] text-[#b8860b] border border-[#f2dc93] px-2 py-0.5 rounded-full">
                            Recomendado
                          </span>
                        )}
                        {f.salvo && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Bookmark size={8} className="fill-amber-600" /> Salvo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9a6e0a]">{f.especialidade}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {fornecedorAberto === f.nome ? (
                        <div className="w-7 h-7 rounded-full bg-[#d4a017] flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-[#f2dc93]" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-[#664708] italic mb-3">&ldquo;{f.descricao}&rdquo;</p>

                  <div className="flex items-center gap-3 text-xs text-[#9a6e0a] flex-wrap">
                    <Estrelas nota={f.avaliacao} />
                    <span className="flex items-center gap-1">
                      <DollarSign size={11} /> {formatPreco(f.precoMin, f.precoMax)}
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                      <MapPin size={10} /> {f.bairro}
                    </span>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {fornecedorAberto === f.nome && (
                  <div className="border-t border-[#f9efcc] px-5 pb-5 pt-4 space-y-4">
                    {(f.telefone || f.whatsapp || f.instagram || f.site) && (
                      <div className="grid grid-cols-2 gap-2">
                        {f.telefone && (
                          <a
                            href={`tel:${f.telefone.replace(/\D/g, "")}`}
                            className="flex items-center gap-2 bg-[#fdf9ee] border border-[#f2dc93] rounded-xl px-3 py-2.5 text-xs font-medium text-[#664708] hover:bg-[#f9efcc] transition-all"
                          >
                            <Phone size={13} className="text-[#d4a017] flex-shrink-0" />
                            <span className="truncate">{f.telefone}</span>
                          </a>
                        )}
                        {f.whatsapp && (
                          <a
                            href={`https://wa.me/${f.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-all"
                          >
                            <MessageCircle size={13} className="text-green-600 flex-shrink-0" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {f.instagram && (
                          <a
                            href={`https://instagram.com/${f.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2.5 text-xs font-medium text-pink-700 hover:bg-pink-100 transition-all"
                          >
                            <span className="text-pink-600 font-bold text-sm flex-shrink-0">@</span>
                            <span className="truncate">{f.instagram}</span>
                          </a>
                        )}
                        {f.site && (
                          <a
                            href={f.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-all"
                          >
                            <Globe size={13} className="text-blue-600 flex-shrink-0" />
                            <span>Site</span>
                          </a>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-[#c9a84c] flex items-center gap-1">
                      <Sparkles size={9} /> Sugestão da IA — confirme os dados antes de entrar em contato.
                    </p>

                    <button
                      onClick={() => toggleSalvo(f.nome)}
                      className={`w-full font-bold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                        f.salvo
                          ? "bg-amber-100 border border-amber-300 text-amber-700"
                          : "bg-[#d4a017] hover:bg-[#b8860b] text-white"
                      }`}
                    >
                      {f.salvo
                        ? <><BookmarkCheck size={15} /> Salvo nos favoritos</>
                        : <><Bookmark size={15} /> Salvar fornecedor</>
                      }
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Próxima etapa */}
        {Object.keys(db.categorias).length > 0 && (
          <Link
            href="/dashboard/orcamento"
            className="flex items-center gap-4 rounded-2xl p-5 text-white active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #d4a017, #b8860b)" }}
          >
            <div className="flex-1">
              <p className="text-xs font-semibold opacity-75 mb-0.5">Próxima etapa</p>
              <p className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-playfair)" }}>
                Controlar o Orçamento
              </p>
              <p className="text-xs opacity-75 mt-0.5">Registre os contratos e acompanhe o gasto real.</p>
            </div>
            <ChevronRight size={22} />
          </Link>
        )}

      </div>
    </div>
  );
}

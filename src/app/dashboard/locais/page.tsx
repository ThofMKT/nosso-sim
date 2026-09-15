"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin, Search, Sparkles, Star, Users, DollarSign,
  ChevronRight, Loader2, RefreshCw, CheckCircle2,
  Phone, MessageCircle, Globe, Bookmark, BookmarkCheck,
  CalendarCheck, AlertCircle, ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MapaLocais = dynamic(() => import("@/components/MapaLocais"), { ssr: false });

type Local = {
  nome: string;
  tipo: string;
  bairro: string;
  endereco?: string | null;
  capacidade: string;
  faixaPreco: string;
  destaque: string;
  adequado: boolean;
  telefone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  site?: string | null;
  salvo?: boolean;
  visitaAgendada?: boolean;
};

type LocalData = {
  cidade: string;
  orcamento: string;
  convidados: string;
  locais: Local[];
  atualizadoEm: string;
};

type Coords = { lat: number; lng: number };

async function geocodeCidade(cidade: string): Promise<Coords | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cidade + ", Brasil")}&format=json&limit=1`,
      { headers: { "Accept-Language": "pt-BR" } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

const TIPO_CORES: Record<string, string> = {
  Salão: "bg-blue-50 text-blue-700",
  Fazenda: "bg-green-50 text-green-700",
  Jardim: "bg-emerald-50 text-emerald-700",
  Clube: "bg-purple-50 text-purple-700",
  Hotel: "bg-indigo-50 text-indigo-700",
  Haras: "bg-orange-50 text-orange-700",
};

async function carregarDoSupabase(): Promise<LocalData | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: casal } = await supabase
      .from("casais")
      .select("locais_data")
      .eq("user_id", user.id)
      .single();
    if (casal?.locais_data) return JSON.parse(casal.locais_data) as LocalData;
  } catch {}
  // fallback: localStorage
  const local = localStorage.getItem("nosso-sim-locais");
  if (local) return JSON.parse(local) as LocalData;
  return null;
}

async function salvarNoBanco(dados: LocalData) {
  localStorage.setItem("nosso-sim-locais", JSON.stringify(dados));
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("casais")
      .update({ locais_data: JSON.stringify(dados) })
      .eq("user_id", user.id);
  } catch {}
}

export default function LocaisPage() {
  const [cidade, setCidade] = useState("");
  const [cidadeInput, setCidadeInput] = useState("");
  const [orcamento, setOrcamento] = useState("60000");
  const [convidados, setConvidados] = useState("200");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMapa, setLoadingMapa] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [localSelecionado, setLocalSelecionado] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<"cidade" | "mapa" | "lista">("cidade");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem("nosso-sim-onboarding");
      if (stored) {
        const d = JSON.parse(stored);
        setCidadeInput(d.cidade ?? "");
        setOrcamento(d.orcamento ?? "60000");
        setConvidados(d.convidados ?? "200");
      }
      const dados = await carregarDoSupabase();
      if (dados?.locais?.length) {
        setLocais(dados.locais);
        setCidade(dados.cidade);
        setCidadeInput(dados.cidade);
        setOrcamento(dados.orcamento);
        setConvidados(dados.convidados);
        const c = await geocodeCidade(dados.cidade);
        setCoords(c ?? { lat: -23.5505, lng: -46.6333 });
        setEtapa("lista");
      }
      setLoadingInicial(false);
    }
    init();
  }, []);

  async function buscarCidade() {
    if (!cidadeInput.trim()) return;
    setLoadingMapa(true);
    const c = await geocodeCidade(cidadeInput);
    setCidade(cidadeInput);
    setCoords(c ?? { lat: -23.5505, lng: -46.6333 });
    setEtapa("mapa");
    setLoadingMapa(false);
  }

  async function buscarLocaisIA() {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/locais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade, orcamento, convidados }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErro(data.error ?? "Erro ao buscar espaços. Tente novamente.");
        setLoading(false);
        return;
      }
      if (data.locais && Array.isArray(data.locais)) {
        // Preserva marcações de salvo/visita se já existiam
        const locaisComMarcacoes = (data.locais as Local[]).map((novo) => {
          const anterior = locais.find(l => l.nome === novo.nome);
          return { ...novo, salvo: anterior?.salvo, visitaAgendada: anterior?.visitaAgendada };
        });
        setLocais(locaisComMarcacoes);
        setEtapa("lista");
        const novosDados: LocalData = {
          cidade,
          orcamento,
          convidados,
          locais: locaisComMarcacoes,
          atualizadoEm: new Date().toISOString(),
        };
        await salvarNoBanco(novosDados);
      }
    } catch {
      setErro("Não consegui conectar ao servidor. Verifique sua conexão e tente novamente.");
    }
    setLoading(false);
  }

  async function toggleSalvo(nome: string) {
    const atualizados = locais.map(l =>
      l.nome === nome ? { ...l, salvo: !l.salvo } : l
    );
    setLocais(atualizados);
    await salvarNoBanco({ cidade, orcamento, convidados, locais: atualizados, atualizadoEm: new Date().toISOString() });
  }

  async function toggleVisita(nome: string) {
    const atualizados = locais.map(l =>
      l.nome === nome ? { ...l, visitaAgendada: !l.visitaAgendada } : l
    );
    setLocais(atualizados);
    await salvarNoBanco({ cidade, orcamento, convidados, locais: atualizados, atualizadoEm: new Date().toISOString() });
  }

  function useGeolocalizacao() {
    if (!navigator.geolocation) return;
    setLoadingMapa(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`
        );
        const data = await res.json();
        const c = data.address?.city ?? data.address?.town ?? data.address?.state ?? "Sua localização";
        setCidade(c);
        setCidadeInput(c);
        setEtapa("mapa");
        setLoadingMapa(false);
      },
      () => setLoadingMapa(false)
    );
  }

  if (loadingInicial) {
    return (
      <div className="min-h-screen bg-[#fdf9ee] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f2dc93] border-t-[#d4a017] rounded-full animate-spin" />
      </div>
    );
  }

  const locaisSalvos = locais.filter(l => l.salvo);

  return (
    <div className="min-h-screen bg-[#fdf9ee] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={20} className="text-[#d4a017]" />
            <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "var(--font-playfair)" }}>
              Espaço da Festa
            </h1>
            <span className="text-[10px] font-bold bg-[#d4a017] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={9} /> IA
            </span>
          </div>
          <p className="text-[#9a6e0a] text-sm">
            Sugestões personalizadas de espaços na sua cidade, salvas automaticamente.
          </p>
        </div>

        {/* ETAPA 1 — Cidade */}
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5">
          <p className="font-semibold text-[#1a1208] text-sm mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#d4a017] text-white text-[10px] font-bold flex items-center justify-center">1</span>
            Onde vai ser o casamento?
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a84c]" />
              <input
                type="text"
                placeholder="Ex: São Paulo, SP"
                value={cidadeInput}
                onChange={(e) => setCidadeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscarCidade()}
                className="w-full pl-8 pr-3 py-3 border border-[#f2dc93] bg-white rounded-xl text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 text-sm"
              />
            </div>
            <button
              onClick={buscarCidade}
              disabled={!cidadeInput.trim() || loadingMapa}
              className="bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl transition-all text-sm flex items-center gap-2"
            >
              {loadingMapa ? <Loader2 size={14} className="animate-spin" /> : "Buscar"}
            </button>
          </div>
          <button
            onClick={useGeolocalizacao}
            className="mt-2 flex items-center gap-1.5 text-xs text-[#d4a017] hover:text-[#b8860b] font-medium"
          >
            <MapPin size={12} /> Usar minha localização atual
          </button>
        </div>

        {/* ETAPA 2 — Mapa */}
        {etapa !== "cidade" && coords && (
          <div className="bg-white rounded-2xl border border-[#f9efcc] overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#f9efcc]">
              <p className="font-semibold text-[#1a1208] text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4a017] text-white text-[10px] font-bold flex items-center justify-center">2</span>
                {cidade}
              </p>
              <button
                onClick={() => { setEtapa("cidade"); setCoords(null); setLocais([]); setErro(null); }}
                className="text-xs text-[#9a6e0a] hover:text-[#d4a017]"
              >
                Trocar cidade
              </button>
            </div>

            <div className="p-4">
              <MapaLocais lat={coords.lat} lng={coords.lng} cidade={cidade} />
            </div>

            {/* Erro da IA */}
            {erro && (
              <div className="mx-5 mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Não consegui buscar os espaços</p>
                  <p className="text-xs text-red-600 mt-0.5">{erro}</p>
                </div>
              </div>
            )}

            <div className="px-5 pb-5">
              <button
                onClick={buscarLocaisIA}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#1a1208] hover:bg-[#3d2a03] text-white font-bold py-3.5 rounded-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Buscando espaços com IA...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-[#d4a017]" />
                    Buscar espaços para {convidados} convidados
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Favoritos */}
        {locaisSalvos.length > 0 && (
          <div className="bg-[#fdf9ee] border border-[#f2dc93] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#9a6e0a] mb-3 flex items-center gap-1.5">
              <Bookmark size={12} className="fill-[#d4a017] text-[#d4a017]" />
              {locaisSalvos.length} espaço{locaisSalvos.length > 1 ? "s" : ""} salvos
            </p>
            <div className="flex flex-wrap gap-2">
              {locaisSalvos.map((l, i) => (
                <span key={i} className="text-xs bg-white border border-[#f2dc93] text-[#664708] px-2.5 py-1 rounded-full font-medium">
                  {l.nome}
                  {l.visitaAgendada && <span className="ml-1 text-[#d4a017]">· visita ✓</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ETAPA 3 — Lista de Locais */}
        {locais.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#1a1208] text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4a017] text-white text-[10px] font-bold flex items-center justify-center">3</span>
                {locais.length} espaços encontrados
              </p>
              <button
                onClick={buscarLocaisIA}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-[#d4a017] hover:text-[#b8860b] font-medium disabled:opacity-50"
              >
                <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Atualizar
              </button>
            </div>

            {/* Erro inline quando atualiza e falha */}
            {erro && etapa === "lista" && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Não consegui atualizar</p>
                  <p className="text-xs text-red-600 mt-0.5">{erro} Os resultados anteriores foram mantidos.</p>
                </div>
              </div>
            )}

            {locais.map((local, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border-2 transition-all ${
                  localSelecionado === local.nome
                    ? "border-[#d4a017] shadow-md"
                    : "border-[#f9efcc] hover:border-[#eac85a]"
                }`}
              >
                {/* Cabeçalho do card — clicável */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setLocalSelecionado(localSelecionado === local.nome ? null : local.nome)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-[#1a1208]">{local.nome}</h3>
                        {local.adequado && (
                          <span className="text-[10px] font-bold bg-[#fdf9ee] text-[#b8860b] border border-[#f2dc93] px-2 py-0.5 rounded-full">
                            Recomendado
                          </span>
                        )}
                        {local.salvo && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Bookmark size={8} className="fill-amber-600" /> Salvo
                          </span>
                        )}
                        {local.visitaAgendada && (
                          <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <CalendarCheck size={8} /> Visita
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TIPO_CORES[local.tipo] ?? "bg-gray-50 text-gray-600"}`}>
                          {local.tipo}
                        </span>
                        <span className="text-xs text-[#9a6e0a] flex items-center gap-1">
                          <MapPin size={10} /> {local.bairro}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {localSelecionado === local.nome ? (
                        <div className="w-7 h-7 rounded-full bg-[#d4a017] flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-[#f2dc93]" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-[#664708] italic mb-3">&ldquo;{local.destaque}&rdquo;</p>

                  <div className="flex items-center gap-4 text-xs text-[#9a6e0a]">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {local.capacidade}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={11} /> {local.faixaPreco}
                    </span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={10} className={s <= 4 ? "fill-[#d4a017] text-[#d4a017]" : "text-[#f2dc93]"} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {localSelecionado === local.nome && (
                  <div className="border-t border-[#f9efcc] px-5 pb-5 pt-4 space-y-4">

                    {/* Endereço */}
                    {local.endereco && (
                      <div className="flex items-start gap-2 text-sm text-[#664708]">
                        <MapPin size={14} className="text-[#d4a017] flex-shrink-0 mt-0.5" />
                        <span>{local.endereco}</span>
                      </div>
                    )}

                    {/* Buscar contatos reais no Google */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-[#9a6e0a] uppercase tracking-wide">Buscar contatos reais</p>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`https://www.google.com/maps/search/${encodeURIComponent(local.nome + " " + local.bairro + " " + cidade)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-all"
                        >
                          <MapPin size={13} className="text-blue-600 flex-shrink-0" />
                          <span>Google Maps</span>
                          <ExternalLink size={10} className="ml-auto opacity-60" />
                        </a>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(local.nome + " " + cidade + " espaço casamento contato")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-[#fdf9ee] border border-[#f2dc93] rounded-xl px-3 py-2.5 text-xs font-medium text-[#664708] hover:bg-[#f9efcc] transition-all"
                        >
                          <Globe size={13} className="text-[#d4a017] flex-shrink-0" />
                          <span>Pesquisar</span>
                          <ExternalLink size={10} className="ml-auto opacity-60" />
                        </a>
                        <a
                          href={`https://www.instagram.com/explore/search/?q=${encodeURIComponent(local.nome)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2.5 text-xs font-medium text-pink-700 hover:bg-pink-100 transition-all"
                        >
                          <span className="text-pink-600 font-bold text-sm flex-shrink-0">@</span>
                          <span>Instagram</span>
                          <ExternalLink size={10} className="ml-auto opacity-60" />
                        </a>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent("Olá! Vi o " + local.nome + " e gostaria de saber disponibilidade para casamento.")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-all"
                        >
                          <MessageCircle size={13} className="text-green-600 flex-shrink-0" />
                          <span>WhatsApp</span>
                          <ExternalLink size={10} className="ml-auto opacity-60" />
                        </a>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => toggleVisita(local.nome)}
                        className={`flex-1 font-bold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                          local.visitaAgendada
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-[#d4a017] hover:bg-[#b8860b] text-white"
                        }`}
                      >
                        <CalendarCheck size={14} />
                        {local.visitaAgendada ? "Visita marcada ✓" : "Marcar visita"}
                      </button>
                      <button
                        onClick={() => toggleSalvo(local.nome)}
                        className={`px-4 font-medium text-sm py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
                          local.salvo
                            ? "bg-amber-100 border border-amber-300 text-amber-700"
                            : "bg-[#fdf9ee] hover:bg-[#f9efcc] border border-[#f2dc93] text-[#9a6e0a]"
                        }`}
                      >
                        {local.salvo
                          ? <><BookmarkCheck size={14} /> Salvo</>
                          : <><Bookmark size={14} /> Salvar</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link
              href="/dashboard/decoracao"
              className="flex items-center gap-4 rounded-2xl p-5 text-white active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #d4a017, #b8860b)" }}
            >
              <div className="flex-1">
                <p className="text-xs font-semibold opacity-75 mb-0.5">Próxima etapa</p>
                <p className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-playfair)" }}>
                  Criar Decoração com IA
                </p>
                <p className="text-xs opacity-75 mt-0.5">Tire uma foto do espaço e a IA cria a proposta ideal.</p>
              </div>
              <ChevronRight size={22} />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

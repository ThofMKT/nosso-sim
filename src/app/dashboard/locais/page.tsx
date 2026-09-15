"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPin, Search, Sparkles, Star, Users, DollarSign,
  ChevronRight, Loader2, RefreshCw, CheckCircle2,
} from "lucide-react";

const MapaLocais = dynamic(() => import("@/components/MapaLocais"), { ssr: false });

type Local = {
  nome: string;
  tipo: string;
  bairro: string;
  capacidade: string;
  faixaPreco: string;
  destaque: string;
  adequado: boolean;
};

type Coords = { lat: number; lng: number };

async function geocodeCidade(cidade: string): Promise<Coords | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cidade + ", Brasil")}&format=json&limit=1`,
      { headers: { "Accept-Language": "pt-BR" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
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

export default function LocaisPage() {
  const [cidade, setCidade] = useState("");
  const [cidadeInput, setCidadeInput] = useState("");
  const [orcamento, setOrcamento] = useState("60000");
  const [convidados, setConvidados] = useState("200");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMapa, setLoadingMapa] = useState(false);
  const [localSelecionado, setLocalSelecionado] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<"cidade" | "mapa" | "lista">("cidade");

  useEffect(() => {
    const stored = localStorage.getItem("nosso-sim-onboarding");
    if (stored) {
      const d = JSON.parse(stored);
      setCidadeInput(d.cidade ?? "");
      setOrcamento(d.orcamento ?? "60000");
      setConvidados(d.convidados ?? "200");
    }
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
    setLocais([]);
    try {
      const res = await fetch("/api/locais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade, orcamento, convidados }),
      });
      const data = await res.json();
      if (data.locais) {
        setLocais(data.locais);
        setEtapa("lista");
      }
    } catch {
      setLocais([]);
    }
    setLoading(false);
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
            Encontre espaços disponíveis na sua região com sugestões personalizadas.
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
                onClick={() => { setEtapa("cidade"); setCoords(null); setLocais([]); }}
                className="text-xs text-[#9a6e0a] hover:text-[#d4a017]"
              >
                Trocar cidade
              </button>
            </div>

            <div className="p-4">
              <MapaLocais lat={coords.lat} lng={coords.lng} cidade={cidade} />
            </div>

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
                className="flex items-center gap-1 text-xs text-[#d4a017] hover:text-[#b8860b] font-medium"
              >
                <RefreshCw size={11} /> Atualizar
              </button>
            </div>

            {locais.map((local, i) => (
              <div
                key={i}
                onClick={() => setLocalSelecionado(localSelecionado === local.nome ? null : local.nome)}
                className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  localSelecionado === local.nome
                    ? "border-[#d4a017] shadow-md"
                    : "border-[#f9efcc] hover:border-[#eac85a]"
                }`}
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
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={10} className={s <= 4 ? "fill-[#d4a017] text-[#d4a017]" : "text-[#f2dc93]"} />
                    ))}
                  </div>
                </div>

                {localSelecionado === local.nome && (
                  <div className="mt-4 pt-4 border-t border-[#f9efcc] flex gap-2">
                    <button className="flex-1 bg-[#d4a017] hover:bg-[#b8860b] text-white font-bold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                      <ChevronRight size={14} /> Marcar visita
                    </button>
                    <button className="px-4 bg-[#fdf9ee] hover:bg-[#f9efcc] text-[#9a6e0a] font-medium text-sm py-2.5 rounded-xl transition-all">
                      Salvar
                    </button>
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart, Calendar, DollarSign, Users, CheckCircle2,
  Sparkles, ChevronRight, TrendingUp, MapPin, Lock,
  ChevronDown, Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CasalData = {
  noivo1: string;
  noivo2: string;
  data_evento: string;
  orcamento: number;
  cidade: string;
  convidados: number;
  tempo_juntos?: string;
  estilo_casamento?: string;
  cores_casamento?: string;
};

type Paleta = {
  nome: string;
  cores: string[];
};

function getDaysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
}

function getInitials(n1: string, n2: string) {
  return `${n1.charAt(0).toUpperCase()}${n2.charAt(0).toUpperCase()}`;
}

function parsePaleta(raw?: string): Paleta | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Paleta;
  } catch {
    return null;
  }
}

const TEMPO_LABELS: Record<string, string> = {
  menos_1_ano: "menos de 1 ano",
  "1_2_anos": "1 a 2 anos",
  "2_5_anos": "2 a 5 anos",
  "5_10_anos": "5 a 10 anos",
  mais_10_anos: "mais de 10 anos",
};

const ESTILO_LABELS: Record<string, string> = {
  classico: "Clássico 🕊️",
  romantico: "Romântico 🌸",
  rustico: "Rústico / Boho 🌿",
  moderno: "Moderno ✨",
  luxo: "Luxo 💎",
  praia: "Praia 🌊",
};

const ETAPAS = [
  {
    id: "identidade",
    numero: "01",
    titulo: "Identidade Visual",
    descricao: "Crie o monograma e a identidade visual com as iniciais e cores de vocês.",
    href: "/dashboard/identidade",
    icon: <Sparkles size={22} />,
  },
  {
    id: "local",
    numero: "02",
    titulo: "Escolher o Espaço",
    descricao: "Busque espaços de festa na sua cidade com mapa e sugestões por IA.",
    href: "/dashboard/locais",
    icon: <MapPin size={22} />,
  },
  {
    id: "orcamento",
    numero: "03",
    titulo: "Montar o Orçamento",
    descricao: "Distribua seu orçamento entre as categorias e acompanhe os gastos.",
    href: "/dashboard/orcamento",
    icon: <DollarSign size={22} />,
  },
  {
    id: "convidados",
    numero: "04",
    titulo: "Lista de Convidados",
    descricao: "Organize quem vai e defina prioridades para a lista.",
    href: "/dashboard/convidados",
    icon: <Users size={22} />,
  },
  {
    id: "fornecedores",
    numero: "05",
    titulo: "Fornecedores",
    descricao: "Encontre fotógrafo, buffet, decoração e mais na sua região.",
    href: "/dashboard/fornecedores",
    icon: <TrendingUp size={22} />,
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<CasalData | null>(null);
  const [guiaAberto, setGuiaAberto] = useState(true);
  const [etapaConcluida] = useState(0);

  useEffect(() => {
    async function carregarCasal() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: casal } = await supabase
        .from("casais")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (casal) setData(casal as CasalData);
    }
    carregarCasal();
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#fdf9ee] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f2dc93] border-t-[#d4a017] rounded-full animate-spin" />
      </div>
    );
  }

  const daysLeft = getDaysUntil(data.data_evento);
  const initials = getInitials(data.noivo1, data.noivo2);
  const paleta = parsePaleta(data.cores_casamento);
  const etapaAtual = etapaConcluida < ETAPAS.length ? etapaConcluida : -1;
  const tempoLabel = data.tempo_juntos ? TEMPO_LABELS[data.tempo_juntos] : null;

  return (
    <div className="min-h-screen bg-[#fdf9ee] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* HERO — Contador */}
        <div
          className="rounded-3xl p-6 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a1208 0%, #3d2a03 60%, #664708 100%)" }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#d4a017] opacity-10 -translate-y-1/2 translate-x-1/2" />

          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-[#eac85a] text-xs font-semibold mb-1">📍 {data.cidade}</p>
              <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                {data.noivo1} <span className="text-[#d4a017]">&</span> {data.noivo2}
              </h1>
              <p className="text-[#c9a84c] text-xs">
                {new Date(data.data_evento + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              {tempoLabel && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock size={11} className="text-[#9a6e0a]" />
                  <span className="text-[#9a6e0a] text-xs">Juntos há {tempoLabel}</span>
                </div>
              )}
            </div>

            {/* Monograma mini com cores da paleta */}
            <div
              className="w-14 h-14 rounded-2xl border-2 border-[#d4a017] flex items-center justify-center flex-shrink-0"
              style={{
                background: paleta && paleta.cores.length >= 2
                  ? `linear-gradient(135deg, ${paleta.cores[0]}, ${paleta.cores[1]})`
                  : "linear-gradient(135deg, #3d2a03, #664708)",
              }}
            >
              <span
                className="text-xl font-bold"
                style={{
                  fontFamily: "var(--font-playfair)",
                  color: paleta && paleta.cores.length >= 2 ? "#1a1208" : "#d4a017",
                }}
              >
                {initials}
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2 mt-4">
            <span className="text-5xl font-bold text-[#d4a017] leading-none">{daysLeft}</span>
            <div className="pb-1">
              <div className="text-white font-semibold">dias</div>
              <div className="text-[#eac85a] text-xs">para o grande dia</div>
            </div>
          </div>

          {/* Paleta de cores */}
          {paleta && paleta.cores.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-[#9a6e0a]">{paleta.nome}</span>
              <div className="flex gap-1.5">
                {paleta.cores.map((cor, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GUIA DE INÍCIO */}
        <div className="bg-white rounded-2xl border border-[#f9efcc] overflow-hidden">
          <button
            onClick={() => setGuiaAberto(!guiaAberto)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#fdf9ee] flex items-center justify-center">
                <Sparkles size={16} className="text-[#d4a017]" />
              </div>
              <div className="text-left">
                <p className="font-bold text-[#1a1208] text-sm">Fase Inicial — Por onde começar</p>
                <p className="text-[#9a6e0a] text-xs">
                  {etapaAtual === -1 ? "Todas as etapas concluídas!" : `Etapa ${etapaAtual + 1} de ${ETAPAS.length}`}
                </p>
              </div>
            </div>
            <ChevronDown
              size={18}
              className={`text-[#9a6e0a] transition-transform ${guiaAberto ? "rotate-180" : ""}`}
            />
          </button>

          <div className="h-1 bg-[#f9efcc] mx-5">
            <div
              className="h-1 bg-[#d4a017] rounded-full transition-all"
              style={{ width: `${(etapaConcluida / ETAPAS.length) * 100}%` }}
            />
          </div>

          {guiaAberto && (
            <div className="divide-y divide-[#fdf9ee]">
              {ETAPAS.map((etapa, i) => {
                const isAtual = i === etapaAtual;
                const bloqueada = i > etapaAtual && etapaAtual !== -1;
                return (
                  <Link
                    key={etapa.id}
                    href={bloqueada ? "#" : etapa.href}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                      bloqueada ? "opacity-40 cursor-not-allowed" : isAtual ? "bg-[#fdf9ee]" : "hover:bg-[#fdf9ee]/50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      i < etapaConcluida ? "bg-[#d4a017]" : isAtual ? "bg-[#1a1208]" : "bg-[#f9efcc]"
                    }`}>
                      {i < etapaConcluida ? (
                        <CheckCircle2 size={18} className="text-white" />
                      ) : bloqueada ? (
                        <Lock size={14} className="text-[#c9a84c]" />
                      ) : (
                        <span className={isAtual ? "text-[#d4a017]" : "text-[#c9a84c]"}>
                          {etapa.icon}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${i < etapaConcluida ? "line-through text-[#c9a84c]" : "text-[#1a1208]"}`}>
                          {etapa.titulo}
                        </p>
                        {isAtual && (
                          <span className="text-[10px] font-bold bg-[#d4a017] text-white px-2 py-0.5 rounded-full">
                            AGORA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9a6e0a] mt-0.5 truncate">{etapa.descricao}</p>
                    </div>
                    {!bloqueada && <ChevronRight size={16} className="text-[#c9a84c] flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* PRÓXIMA ETAPA destaque */}
        {etapaAtual >= 0 && (
          <Link
            href={ETAPAS[etapaAtual].href}
            className="flex items-center gap-4 rounded-2xl p-5 text-white active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #d4a017, #b8860b)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {ETAPAS[etapaAtual].icon}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold opacity-75 mb-0.5">Próxima etapa</p>
              <p className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-playfair)" }}>
                {ETAPAS[etapaAtual].titulo}
              </p>
              <p className="text-xs opacity-75 mt-0.5">{ETAPAS[etapaAtual].descricao}</p>
            </div>
            <ChevronRight size={20} />
          </Link>
        )}

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Calendar size={16} />, label: "Dias", value: daysLeft },
            { icon: <Users size={16} />, label: "Convidados", value: data.convidados },
            { icon: <CheckCircle2 size={16} />, label: "Tarefas", value: "0/16" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#f9efcc] p-4 text-center">
              <div className="flex justify-center text-[#d4a017] mb-2">{s.icon}</div>
              <div className="font-bold text-[#1a1208] text-lg">{s.value}</div>
              <div className="text-[#9a6e0a] text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* MÓDULOS RÁPIDOS */}
        <div>
          <p className="font-bold text-[#1a1208] text-sm mb-3 px-1">Acesso rápido</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/dashboard/tarefas", icon: <CheckCircle2 size={18} />, title: "Tarefas", sub: "Cronograma do casamento" },
              { href: "/dashboard/orcamento", icon: <DollarSign size={18} />, title: "Orçamento", sub: "Acompanhar gastos" },
              { href: "/dashboard/convidados", icon: <Users size={18} />, title: "Convidados", sub: "Lista e prioridades" },
              { href: "/dashboard/agenda", icon: <Calendar size={18} />, title: "Agenda", sub: "Compromissos" },
              { href: "/dashboard/fornecedores", icon: <TrendingUp size={18} />, title: "Fornecedores", sub: "Buscar na região" },
              { href: "/dashboard/presentes", icon: <Heart size={18} />, title: "Presentes", sub: "Lista + PIX" },
            ].map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="bg-white border border-[#f9efcc] rounded-2xl p-4 flex items-center gap-3 hover:border-[#eac85a] hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#fdf9ee] group-hover:bg-[#f9efcc] flex items-center justify-center text-[#d4a017] flex-shrink-0 transition-colors">
                  {m.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#1a1208] text-sm">{m.title}</p>
                  <p className="text-[#9a6e0a] text-xs truncate">{m.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* DICA IA */}
        <div className="bg-[#1a1208] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-[#d4a017]" />
            <span className="text-xs font-bold text-[#eac85a] uppercase tracking-wide">Dica do Nosso Sim</span>
          </div>
          <p className="text-white text-sm leading-relaxed">
            Com <strong className="text-[#d4a017]">{daysLeft} dias</strong> para o casamento de{" "}
            <strong>{data.noivo1} & {data.noivo2}</strong>
            {data.estilo_casamento && ` — estilo ${ESTILO_LABELS[data.estilo_casamento] ?? data.estilo_casamento}`},
            comece pelo espaço da festa. Tudo depende dele: buffet, decoração e o número exato de convidados.
          </p>
          <Link
            href="/dashboard/locais"
            className="mt-4 inline-flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <MapPin size={13} /> Buscar espaços em {data.cidade}
          </Link>
        </div>

      </div>
    </div>
  );
}

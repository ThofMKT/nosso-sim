"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Download, Check, Palette, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Tema = {
  id: string;
  nome: string;
  emoji: string;
  desc: string;
  cores: string[];
  fundo: string;
  texto: string;
  acento: string;
};

type PaletaOnboarding = {
  nome: string;
  cores: string[];
};

const TEMAS: Tema[] = [
  {
    id: "classico",
    nome: "Clássico",
    emoji: "🕊️",
    desc: "Elegância atemporal com dourado",
    cores: ["#d4a017", "#1a1208", "#ffffff", "#f9efcc", "#b8860b"],
    fundo: "#1a1208",
    texto: "#d4a017",
    acento: "#f9efcc",
  },
  {
    id: "romantico",
    nome: "Romântico",
    emoji: "🌸",
    desc: "Rose gold e tons suaves de blush",
    cores: ["#c8846b", "#f2c4b0", "#ffffff", "#f9e8e0", "#a0614d"],
    fundo: "#5c2d2d",
    texto: "#f2c4b0",
    acento: "#c8846b",
  },
  {
    id: "rustico",
    nome: "Rústico / Boho",
    emoji: "🌿",
    desc: "Tons terrosos, madeira e natureza",
    cores: ["#7c5c3a", "#c4a882", "#f5efe6", "#e8d5b7", "#4a3520"],
    fundo: "#4a3520",
    texto: "#c4a882",
    acento: "#e8d5b7",
  },
  {
    id: "moderno",
    nome: "Moderno",
    emoji: "✨",
    desc: "Minimalista e sofisticado",
    cores: ["#1a1a1a", "#888888", "#ffffff", "#f0f0f0", "#333333"],
    fundo: "#1a1a1a",
    texto: "#ffffff",
    acento: "#888888",
  },
  {
    id: "luxo",
    nome: "Luxo",
    emoji: "💎",
    desc: "Preto profundo com dourado intenso",
    cores: ["#0a0a0a", "#CFB53B", "#ffffff", "#f0e6c8", "#8B7536"],
    fundo: "#0a0a0a",
    texto: "#CFB53B",
    acento: "#f0e6c8",
  },
  {
    id: "praia",
    nome: "Praia",
    emoji: "🌊",
    desc: "Azul oceano e areia tropical",
    cores: ["#1a5276", "#85c1e9", "#f5f0e8", "#d4e8f5", "#0e3460"],
    fundo: "#1a5276",
    texto: "#f5f0e8",
    acento: "#85c1e9",
  },
];

const FONTES = [
  { id: "playfair", nome: "Elegante", estilo: "var(--font-playfair)", preview: "A & B" },
  { id: "serif", nome: "Clássica", estilo: "Georgia, serif", preview: "A & B" },
  { id: "cursive", nome: "Cursiva", estilo: "cursive", preview: "A & B" },
];

type CoresJson = {
  nome?: string;
  cores?: string[];
  tema?: string;
  fonte?: string;
};

export default function IdentidadePage() {
  const [noivo1, setNoivo1] = useState("");
  const [noivo2, setNoivo2] = useState("");
  const [nomeCompleto1, setNomeCompleto1] = useState("");
  const [nomeCompleto2, setNomeCompleto2] = useState("");
  const [temaSelecionado, setTemaSelecionado] = useState("classico");
  const [fonteSelecionada, setFonteSelecionada] = useState("playfair");
  const [paletaOnboarding, setPaletaOnboarding] = useState<PaletaOnboarding | null>(null);
  const [coresJsonAtual, setCoresJsonAtual] = useState<CoresJson>({});
  const [copiado, setCopiado] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const monogramaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function carregarDados() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCarregando(false); return; }

      // Seleciona apenas colunas garantidas (tema e fonte são guardados dentro do JSON de cores_casamento)
      const { data: casal } = await supabase
        .from("casais")
        .select("noivo1, noivo2, estilo_casamento, cores_casamento")
        .eq("user_id", user.id)
        .single();

      if (casal) {
        const n1 = casal.noivo1 ?? "";
        const n2 = casal.noivo2 ?? "";
        setNoivo1(n1.charAt(0).toUpperCase());
        setNoivo2(n2.charAt(0).toUpperCase());
        setNomeCompleto1(n1);
        setNomeCompleto2(n2);

        let coresObj: CoresJson = {};
        if (casal.cores_casamento) {
          try {
            coresObj = JSON.parse(casal.cores_casamento) as CoresJson;
          } catch { /* ignora */ }
        }
        setCoresJsonAtual(coresObj);

        // Paleta escolhida no onboarding
        if (coresObj.cores && coresObj.cores.length > 0) {
          setPaletaOnboarding({ nome: coresObj.nome ?? "Sua paleta", cores: coresObj.cores });
        }

        // Tema: prefere o salvo em cores_casamento.tema, depois estilo_casamento, depois "classico"
        const temaInicial = coresObj.tema ?? casal.estilo_casamento ?? "classico";
        setTemaSelecionado(TEMAS.find(t => t.id === temaInicial)?.id ?? "classico");

        // Fonte: prefere o salvo em cores_casamento.fonte
        if (coresObj.fonte) setFonteSelecionada(coresObj.fonte);
      }
      setCarregando(false);
    }
    carregarDados();
  }, []);

  const tema = TEMAS.find((t) => t.id === temaSelecionado) ?? TEMAS[0];
  const fonte = FONTES.find((f) => f.id === fonteSelecionada) ?? FONTES[0];

  function copiarCores() {
    const cores = paletaOnboarding?.cores ?? tema.cores;
    navigator.clipboard.writeText(cores.join(", "));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function salvar() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Salva tema e fonte dentro do JSON de cores_casamento (preservando paleta e nome)
    const novoJson: CoresJson = {
      ...coresJsonAtual,
      tema: temaSelecionado,
      fonte: fonteSelecionada,
    };

    await supabase
      .from("casais")
      .update({
        estilo_casamento: temaSelecionado,
        cores_casamento: JSON.stringify(novoJson),
      })
      .eq("user_id", user.id);

    setCoresJsonAtual(novoJson);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  async function baixarMonograma() {
    setBaixando(true);
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      const size = 800;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = tema.fundo;
      ctx.fillRect(0, 0, size, size);

      const grad = ctx.createRadialGradient(size * 0.3, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.7);
      grad.addColorStop(0, "rgba(255,255,255,0.08)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      const fontFamily = fonteSelecionada === "playfair"
        ? "Playfair Display, Georgia, serif"
        : fonteSelecionada === "cursive"
        ? "cursive"
        : "Georgia, serif";

      ctx.fillStyle = tema.texto;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold 220px ${fontFamily}`;
      ctx.fillText(noivo1 || "A", size * 0.3, size * 0.42);
      ctx.font = `normal 80px ${fontFamily}`;
      ctx.globalAlpha = 0.6;
      ctx.fillText("&", size * 0.5, size * 0.42);
      ctx.globalAlpha = 1;
      ctx.font = `bold 220px ${fontFamily}`;
      ctx.fillText(noivo2 || "B", size * 0.7, size * 0.42);

      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = tema.texto;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(size * 0.2, size * 0.6);
      ctx.lineTo(size * 0.8, size * 0.6);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.font = `18px ${fontFamily}`;
      ctx.fillStyle = tema.texto;
      ctx.globalAlpha = 0.7;
      const nome1 = nomeCompleto1 || "Noivo 1";
      const nome2 = nomeCompleto2 || "Noivo 2";
      ctx.fillText(
        `${nome1.toUpperCase()} & ${nome2.toUpperCase()}`,
        size * 0.5,
        size * 0.68
      );
      ctx.globalAlpha = 1;

      ctx.font = "20px serif";
      ctx.fillStyle = tema.acento;
      ctx.fillText("♥", size * 0.5, size * 0.77);

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nome1}_${nome2}_monograma.png`;
      a.click();
    } finally {
      setBaixando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#fdf9ee] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f2dc93] border-t-[#d4a017] rounded-full animate-spin" />
      </div>
    );
  }

  const coresExibidas = paletaOnboarding?.cores?.length ? paletaOnboarding.cores : tema.cores;
  const nomePaleta = paletaOnboarding?.nome ?? tema.nome;

  return (
    <div className="min-h-screen bg-[#fdf9ee] pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Identidade Visual
          </h1>
          <p className="text-[#9a6e0a] text-sm">
            Monograma gerado com os nomes e o estilo que vocês escolheram.
          </p>
        </div>

        {/* MONOGRAMA */}
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-6">
          <p className="font-semibold text-[#1a1208] text-sm mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-[#d4a017]" /> Monograma
          </p>

          <div
            ref={monogramaRef}
            className="rounded-2xl flex flex-col items-center justify-center mb-4 relative overflow-hidden select-none"
            style={{ background: tema.fundo, minHeight: 240 }}
          >
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "radial-gradient(circle at 30% 30%, #fff 0%, transparent 60%)" }} />

            <div className="relative text-center px-6 py-8">
              <div className="leading-none mb-3 flex items-center justify-center gap-2"
                style={{ color: tema.texto, fontFamily: fonte.estilo }}>
                <span className="text-[80px] sm:text-[96px] font-bold">{noivo1 || "A"}</span>
                <span className="text-3xl font-light opacity-50 pb-4">&</span>
                <span className="text-[80px] sm:text-[96px] font-bold">{noivo2 || "B"}</span>
              </div>

              <p className="text-xs sm:text-sm font-medium tracking-[0.25em] uppercase opacity-60"
                style={{ color: tema.texto, fontFamily: fonte.estilo }}>
                {nomeCompleto1 || "Noivo 1"} & {nomeCompleto2 || "Noivo 2"}
              </p>

              <div className="flex items-center gap-3 justify-center mt-3">
                <div className="h-px w-14 opacity-25" style={{ background: tema.texto }} />
                <span className="text-sm opacity-50" style={{ color: tema.acento }}>♥</span>
                <div className="h-px w-14 opacity-25" style={{ background: tema.texto }} />
              </div>
            </div>
          </div>

          <button
            onClick={baixarMonograma}
            disabled={baixando}
            className="w-full flex items-center justify-center gap-2 border border-[#f2dc93] hover:bg-[#fdf9ee] text-[#9a6e0a] font-medium text-sm py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {baixando
              ? <><RefreshCw size={14} className="animate-spin" /> Gerando...</>
              : <><Download size={14} /> Baixar monograma</>
            }
          </button>
        </div>

        {/* PALETA — sempre visível (onboarding ou do tema) */}
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-[#1a1208] text-sm flex items-center gap-2">
                <Palette size={15} className="text-[#d4a017]" /> Paleta do casamento
              </p>
              <p className="text-[#9a6e0a] text-xs mt-0.5">{nomePaleta}</p>
            </div>
            <button
              onClick={copiarCores}
              className="text-xs text-[#d4a017] hover:text-[#b8860b] font-medium flex items-center gap-1"
            >
              {copiado ? <><Check size={11} /> Copiado!</> : "Copiar hex"}
            </button>
          </div>
          <div className="flex gap-2">
            {coresExibidas.map((cor, i) => (
              <div key={i} className="flex-1 text-center">
                <div
                  className="w-full aspect-square rounded-xl border border-black/5 shadow-sm mb-1.5"
                  style={{ background: cor }}
                />
                <p className="text-[9px] text-[#9a6e0a] font-mono">{cor}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TEMAS */}
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5">
          <p className="font-semibold text-[#1a1208] text-sm mb-1">Tema do monograma</p>
          <p className="text-[#9a6e0a] text-xs mb-4">
            Baseado no estilo que vocês escolheram, mas pode trocar quando quiser.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TEMAS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemaSelecionado(t.id)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  temaSelecionado === t.id ? "border-[#d4a017]" : "border-[#f9efcc] hover:border-[#eac85a]"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: t.fundo }}
                  >
                    <span style={{ color: t.texto, fontFamily: "serif", fontWeight: "bold", fontSize: 13 }}>
                      {t.id === temaSelecionado ? "✓" : t.emoji}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {t.cores.slice(0, 3).map((c, i) => (
                      <div key={i} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <p className="font-semibold text-[#1a1208] text-xs">{t.nome}</p>
                <p className="text-[#9a6e0a] text-[10px] mt-0.5 leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* FONTES */}
        <div className="bg-white rounded-2xl border border-[#f9efcc] p-5">
          <p className="font-semibold text-[#1a1208] text-sm mb-4">Estilo de fonte</p>
          <div className="grid grid-cols-3 gap-3">
            {FONTES.map((f) => (
              <button
                key={f.id}
                onClick={() => setFonteSelecionada(f.id)}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  fonteSelecionada === f.id ? "border-[#d4a017] bg-[#fdf9ee]" : "border-[#f9efcc] hover:border-[#eac85a]"
                }`}
              >
                <p className="text-2xl text-[#1a1208] mb-1" style={{ fontFamily: f.estilo }}>
                  {f.preview}
                </p>
                <p className="text-[10px] font-semibold text-[#9a6e0a]">{f.nome}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={salvar}
          className="w-full flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] text-white font-bold py-4 rounded-2xl transition-all shadow-md text-base"
        >
          {salvo ? <><Check size={18} /> Salvo!</> : <><Sparkles size={16} /> Salvar identidade visual</>}
        </button>

        <Link
          href="/dashboard/locais"
          className="flex items-center gap-4 rounded-2xl p-5 text-white active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #d4a017, #b8860b)" }}
        >
          <div className="flex-1">
            <p className="text-xs font-semibold opacity-75 mb-0.5">Próxima etapa</p>
            <p className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-playfair)" }}>
              Escolher o Espaço
            </p>
            <p className="text-xs opacity-75 mt-0.5">Encontre espaços de festa na sua cidade com mapa e IA.</p>
          </div>
          <ChevronRight size={22} />
        </Link>

      </div>
    </div>
  );
}

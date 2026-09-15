"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera, Sparkles, ChevronRight, RotateCcw,
  Upload, CheckCircle2, AlertCircle, Lightbulb, Palette,
} from "lucide-react";

type Sugestao = {
  estilo: string;
  descricao: string;
  cores: string[];
  nomes_cores: string[];
  elementos: string[];
  orcamento_decoracao: string;
  dica_principal: string;
  pontos_positivos: string[];
  atencao: string;
};

export default function DecoracaoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imagemBase64, setImagemBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [sugestao, setSugestao] = useState<Sugestao | null>(null);
  const [erro, setErro] = useState("");
  const [orcamento, setOrcamento] = useState("60000");
  const [convidados, setConvidados] = useState("200");
  const [tema, setTema] = useState("Clássico");

  useEffect(() => {
    const stored = localStorage.getItem("nosso-sim-onboarding");
    if (stored) {
      const d = JSON.parse(stored);
      setOrcamento(d.orcamento ?? "60000");
      setConvidados(d.convidados ?? "200");
    }
    const temaStored = localStorage.getItem("nosso-sim-tema");
    if (temaStored) {
      const t = JSON.parse(temaStored);
      const temaMap: Record<string, string> = {
        classico: "Clássico", romantico: "Romântico",
        rustico: "Rústico", moderno: "Moderno",
      };
      if (t.tema) setTema(temaMap[t.tema] ?? "Clássico");
    }
  }, []);

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSugestao(null);
    setErro("");
    setMediaType(file.type || "image/jpeg");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      const base64 = result.split(",")[1];
      setImagemBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function analisarEspaco() {
    if (!imagemBase64) return;
    setLoading(true);
    setErro("");
    setSugestao(null);

    try {
      const res = await fetch("/api/decoracao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagemBase64, mediaType, orcamento, convidados, tema }),
      });
      const data = await res.json();
      if (data.sugestao) {
        setSugestao(data.sugestao);
      } else {
        setErro("Não foi possível analisar a imagem. Tente novamente.");
      }
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    }
    setLoading(false);
  }

  function reiniciar() {
    setPreview(null);
    setImagemBase64(null);
    setSugestao(null);
    setErro("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-[#fdf9ee] pb-28">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera size={20} className="text-[#d4a017]" />
            <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "var(--font-playfair)" }}>
              IA de Decoração
            </h1>
            <span className="text-[10px] font-bold bg-[#d4a017] text-white px-2 py-0.5 rounded-full">
              NOVO
            </span>
          </div>
          <p className="text-[#9a6e0a] text-sm">
            Tire uma foto do espaço e a IA cria uma proposta de decoração personalizada para vocês.
          </p>
        </div>

        {/* ETAPA 1 — Foto */}
        {!preview && (
          <div className="bg-white rounded-2xl border border-[#f9efcc] p-6">
            <p className="font-semibold text-[#1a1208] text-sm mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#d4a017] text-white text-[10px] font-bold flex items-center justify-center">1</span>
              Fotografe o espaço
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFoto}
              className="hidden"
            />

            {/* Botão câmera */}
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#f2dc93] hover:border-[#d4a017] bg-[#fdf9ee] hover:bg-[#f9efcc] rounded-2xl p-10 flex flex-col items-center gap-4 transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#d4a017] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Camera size={28} className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#1a1208]">Tirar foto do espaço</p>
                <p className="text-[#9a6e0a] text-xs mt-1">Abre a câmera do seu celular</p>
              </div>
            </button>

            {/* Upload alternativo */}
            <button
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.removeAttribute("capture");
                  inputRef.current.click();
                  setTimeout(() => inputRef.current?.setAttribute("capture", "environment"), 100);
                }
              }}
              className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-[#9a6e0a] hover:text-[#d4a017] font-medium transition-colors"
            >
              <Upload size={14} /> Ou enviar da galeria
            </button>

            {/* Dica */}
            <div className="mt-5 bg-[#fdf9ee] rounded-xl p-4 flex gap-3">
              <Lightbulb size={16} className="text-[#d4a017] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#664708] leading-relaxed">
                Para um resultado melhor, fotografe o espaço inteiro de frente, com boa iluminação.
                A IA analisa o ambiente e cria a decoração ideal para o espaço real de vocês.
              </p>
            </div>
          </div>
        )}

        {/* ETAPA 2 — Preview + Analisar */}
        {preview && !sugestao && (
          <div className="bg-white rounded-2xl border border-[#f9efcc] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f9efcc] flex items-center justify-between">
              <p className="font-semibold text-[#1a1208] text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4a017] text-white text-[10px] font-bold flex items-center justify-center">2</span>
                Analisar com IA
              </p>
              <button onClick={reiniciar} className="flex items-center gap-1 text-xs text-[#9a6e0a] hover:text-[#d4a017]">
                <RotateCcw size={12} /> Nova foto
              </button>
            </div>

            {/* Preview da foto */}
            <div className="relative">
              <img src={preview} alt="Espaço" className="w-full max-h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="p-5">
              {erro && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {erro}
                </div>
              )}

              <button
                onClick={analisarEspaco}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#1a1208] hover:bg-[#3d2a03] disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-all text-base"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analisando o espaço...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="text-[#d4a017]" />
                    Gerar proposta de decoração
                  </>
                )}
              </button>

              {loading && (
                <p className="text-center text-xs text-[#9a6e0a] mt-3">
                  A IA está analisando o espaço e criando a proposta ideal para vocês...
                </p>
              )}
            </div>
          </div>
        )}

        {/* ETAPA 3 — Resultado da IA */}
        {sugestao && (
          <div className="space-y-4">
            {/* Header do resultado */}
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#1a1208] flex items-center gap-2">
                <Sparkles size={16} className="text-[#d4a017]" />
                Proposta criada
              </p>
              <button onClick={reiniciar} className="flex items-center gap-1 text-xs text-[#9a6e0a] hover:text-[#d4a017]">
                <RotateCcw size={12} /> Nova foto
              </button>
            </div>

            {/* Foto + Estilo */}
            <div className="bg-white rounded-2xl border border-[#f9efcc] overflow-hidden">
              {preview && (
                <img src={preview} alt="Espaço" className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <div className="inline-flex items-center gap-2 bg-[#fdf9ee] border border-[#f2dc93] px-3 py-1.5 rounded-full mb-3">
                  <Sparkles size={12} className="text-[#d4a017]" />
                  <span className="text-xs font-bold text-[#b8860b]">{sugestao.estilo}</span>
                </div>
                <p className="text-[#664708] text-sm leading-relaxed">{sugestao.descricao}</p>
              </div>
            </div>

            {/* Paleta de cores */}
            <div className="bg-white rounded-2xl border border-[#f9efcc] p-5">
              <p className="font-semibold text-[#1a1208] text-sm mb-4 flex items-center gap-2">
                <Palette size={15} className="text-[#d4a017]" /> Paleta sugerida
              </p>
              <div className="flex gap-3">
                {sugestao.cores.map((cor, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className="w-full aspect-square rounded-xl border border-black/5 shadow-sm mb-2"
                      style={{ background: cor }}
                    />
                    <p className="text-[10px] text-[#9a6e0a] font-semibold leading-tight">
                      {sugestao.nomes_cores[i]}
                    </p>
                    <p className="text-[9px] text-[#c9a84c] font-mono">{cor}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Elementos decorativos */}
            <div className="bg-white rounded-2xl border border-[#f9efcc] p-5">
              <p className="font-semibold text-[#1a1208] text-sm mb-4">Elementos decorativos</p>
              <div className="space-y-2">
                {sugestao.elementos.map((el, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#fdf9ee] rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-[#d4a017] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[9px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-[#1a1208]">{el}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Orçamento + Dica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1208] rounded-2xl p-4">
                <p className="text-[#eac85a] text-xs font-semibold mb-1">Estimativa</p>
                <p className="text-white font-bold text-sm">{sugestao.orcamento_decoracao}</p>
                <p className="text-[#c9a84c] text-[10px] mt-1">só decoração</p>
              </div>
              <div className="bg-[#fdf9ee] rounded-2xl border border-[#f2dc93] p-4">
                <p className="text-[#9a6e0a] text-xs font-semibold mb-1">Pontos fortes</p>
                {sugestao.pontos_positivos.map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5 mt-1">
                    <CheckCircle2 size={11} className="text-[#d4a017] flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-[#664708] leading-tight">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dica principal */}
            <div className="bg-white rounded-2xl border-2 border-[#f2dc93] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={15} className="text-[#d4a017]" />
                <p className="font-semibold text-[#1a1208] text-sm">Dica da IA</p>
              </div>
              <p className="text-[#664708] text-sm leading-relaxed">{sugestao.dica_principal}</p>
            </div>

            {/* Atenção */}
            {sugestao.atencao && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-xs mb-1">Ponto de atenção</p>
                  <p className="text-amber-700 text-sm">{sugestao.atencao}</p>
                </div>
              </div>
            )}

            {/* Próxima etapa */}
            <Link
              href="/dashboard/orcamento"
              className="flex items-center gap-4 rounded-2xl p-5 text-white active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #d4a017, #b8860b)" }}
            >
              <div className="flex-1">
                <p className="text-xs font-semibold opacity-75 mb-0.5">Próxima etapa</p>
                <p className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-playfair)" }}>
                  Montar o Orçamento
                </p>
                <p className="text-xs opacity-75 mt-0.5">
                  Com o espaço definido, distribua o orçamento por categoria.
                </p>
              </div>
              <ChevronRight size={22} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

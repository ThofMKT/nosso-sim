"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Heart, Calendar, DollarSign, MapPin, Users,
  ChevronRight, ChevronLeft, Sparkles, Mail, Lock,
  Eye, EyeOff, AlertCircle, Clock, Palette,
} from "lucide-react";
import { signUp } from "@/app/actions/auth";

type FormData = {
  noivo1: string;
  noivo2: string;
  tempoJuntos: string;
  dataEvento: string;
  cidade: string;
  convidados: string;
  orcamento: string;
  estilo: string;
  paletaNome: string;
  paletaCores: string[];
  email: string;
  password: string;
};

const STEPS = [
  {
    id: "nomes",
    title: "Quem são os noivos?",
    subtitle: "Vamos personalizar tudo para vocês dois.",
    icon: <Heart size={28} className="text-[#d4a017]" />,
  },
  {
    id: "data",
    title: "Quando vai ser o grande dia?",
    subtitle: "Usamos a data para montar o cronograma personalizado de vocês.",
    icon: <Calendar size={28} className="text-[#d4a017]" />,
  },
  {
    id: "local",
    title: "Onde vai ser a festa?",
    subtitle: "A IA usa isso para buscar espaços, fotógrafos e fornecedores da sua região.",
    icon: <MapPin size={28} className="text-[#d4a017]" />,
  },
  {
    id: "convidados",
    title: "Quantos convidados?",
    subtitle: "Não precisa ser o número exato agora.",
    icon: <Users size={28} className="text-[#d4a017]" />,
  },
  {
    id: "orcamento",
    title: "Qual é o orçamento de vocês?",
    subtitle: "Uma estimativa já ajuda muito. Dá para ajustar depois.",
    icon: <DollarSign size={28} className="text-[#d4a017]" />,
  },
  {
    id: "estilo",
    title: "Qual o estilo do casamento?",
    subtitle: "A IA cria sugestões de decoração, espaço e identidade visual com base nisso.",
    icon: <Sparkles size={28} className="text-[#d4a017]" />,
  },
  {
    id: "cores",
    title: "Qual será a paleta de cores?",
    subtitle: "Escolha as cores do casamento ou deixe a IA sugerir com base no estilo.",
    icon: <Palette size={28} className="text-[#d4a017]" />,
  },
  {
    id: "conta",
    title: "Quase lá! Crie sua conta.",
    subtitle: "Seus dados ficam salvos na nuvem, seguros e acessíveis em qualquer dispositivo.",
    icon: <Sparkles size={28} className="text-[#d4a017]" />,
  },
];

const TEMPO_JUNTOS_OPTIONS = [
  { label: "Menos de 1 ano", value: "menos_1_ano" },
  { label: "1 a 2 anos", value: "1_2_anos" },
  { label: "2 a 5 anos", value: "2_5_anos" },
  { label: "5 a 10 anos", value: "5_10_anos" },
  { label: "Mais de 10 anos", value: "mais_10_anos" },
];

const ORCAMENTO_OPTIONS = [
  { label: "Até R$ 15.000", value: "15000" },
  { label: "R$ 15.000 – R$ 30.000", value: "30000" },
  { label: "R$ 30.000 – R$ 60.000", value: "60000" },
  { label: "R$ 60.000 – R$ 100.000", value: "100000" },
  { label: "Acima de R$ 100.000", value: "150000" },
];

const CONVIDADOS_OPTIONS = [
  { label: "Até 50", value: "50" },
  { label: "51 – 100", value: "100" },
  { label: "101 – 200", value: "200" },
  { label: "201 – 400", value: "400" },
  { label: "Mais de 400", value: "500" },
];

const ESTILOS = [
  { id: "classico", nome: "Clássico", emoji: "🕊️", desc: "Elegância atemporal" },
  { id: "romantico", nome: "Romântico", emoji: "🌸", desc: "Delicado e florido" },
  { id: "rustico", nome: "Rústico / Boho", emoji: "🌿", desc: "Natural e aconchegante" },
  { id: "moderno", nome: "Moderno", emoji: "✨", desc: "Clean e sofisticado" },
  { id: "luxo", nome: "Luxo", emoji: "💎", desc: "Grandioso e imponente" },
  { id: "praia", nome: "Praia", emoji: "🌊", desc: "Leve e tropical" },
];

const PALETAS = [
  { nome: "Branco & Dourado", cores: ["#FFFFFF", "#D4A017", "#1a1208"] },
  { nome: "Rosa & Nude", cores: ["#F8BBD9", "#F5E6D3", "#9E7E7E"] },
  { nome: "Verde Sálvia & Bege", cores: ["#87A878", "#D4C5A9", "#8B7355"] },
  { nome: "Azul & Lavanda", cores: ["#92A8D1", "#C8B2E0", "#F7F0FF"] },
  { nome: "Marsala & Rose Gold", cores: ["#955251", "#EAB8A0", "#F5E6D3"] },
  { nome: "Lilás & Branco", cores: ["#C8A2C8", "#E8D5E8", "#FFFFFF"] },
  { nome: "Preto & Dourado", cores: ["#1a1208", "#D4A017", "#FFFFFF"] },
  { nome: "Sugestão da IA", cores: [], ia: true },
];

export default function CadastroPage() {
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    noivo1: "",
    noivo2: "",
    tempoJuntos: "",
    dataEvento: "",
    cidade: "",
    convidados: "",
    orcamento: "",
    estilo: "",
    paletaNome: "",
    paletaCores: [],
    email: "",
    password: "",
  });

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const canAdvance = () => {
    if (step === 0) return form.noivo1.trim() && form.noivo2.trim() && form.tempoJuntos;
    if (step === 1) return form.dataEvento;
    if (step === 2) return form.cidade.trim();
    if (step === 3) return form.convidados;
    if (step === 4) return form.orcamento;
    if (step === 5) return form.estilo;
    if (step === 6) return form.paletaNome;
    if (step === 7) return form.email.trim() && form.password.length >= 6;
    return false;
  };

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    setError("");
    const result = await signUp(form);
    if (result?.error) {
      setError(traduzirErro(result.error));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf9ee] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <Image src="/logo.png" alt="Nosso Sim" width={1230} height={1278} className="h-10 w-auto object-contain" />
        <span className="text-sm text-[#9a6e0a]">
          {step + 1} de {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-[#f2dc93]">
        <div
          className="h-full bg-[#d4a017] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 anim-fade">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-[#f2dc93] shadow-sm mb-5">
              {current.icon}
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#1a1208] mb-2"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {current.title}
            </h1>
            <p className="text-[#664708] text-sm">{current.subtitle}</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4 mb-8">
            {/* STEP 0: Nomes + Tempo Juntos */}
            {step === 0 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
                    Nome do Noivo / Noiva 1
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ana"
                    value={form.noivo1}
                    onChange={(e) => setForm({ ...form, noivo1: e.target.value })}
                    className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3.5 text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
                    Nome do Noivo / Noiva 2
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos"
                    value={form.noivo2}
                    onChange={(e) => setForm({ ...form, noivo2: e.target.value })}
                    className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3.5 text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-base"
                  />
                </div>

                {form.noivo1.trim() && form.noivo2.trim() && (
                  <div>
                    <label className="block text-xs font-semibold text-[#9a6e0a] mb-2 uppercase tracking-wide">
                      Há quanto tempo {form.noivo1} e {form.noivo2} estão juntos?
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {TEMPO_JUNTOS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setForm({ ...form, tempoJuntos: opt.value })}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all text-sm font-medium ${
                            form.tempoJuntos === opt.value
                              ? "border-[#d4a017] bg-[#d4a017] text-white"
                              : "border-[#f2dc93] bg-white text-[#1a1208] hover:border-[#eac85a]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock size={14} className={form.tempoJuntos === opt.value ? "text-white/80" : "text-[#c9a84c]"} />
                            {opt.label}
                          </div>
                          {form.tempoJuntos === opt.value && <Heart size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 1: Data */}
            {step === 1 && (
              <div>
                <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
                  Data do casamento
                </label>
                <input
                  type="date"
                  value={form.dataEvento}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, dataEvento: e.target.value })}
                  className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3.5 text-[#1a1208] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-base"
                />
                <div className="mt-4 bg-[#1a1208] rounded-xl p-4 text-center">
                  <p className="text-[#eac85a] text-xs mb-1">O grande dia de</p>
                  <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-playfair)" }}>
                    {form.noivo1} <span className="text-[#d4a017]">&</span> {form.noivo2}
                  </p>
                  {form.dataEvento && (
                    <p className="text-[#c9a84c] text-sm mt-1">
                      {new Date(form.dataEvento + "T12:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Cidade */}
            {step === 2 && (
              <div>
                <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
                  Cidade / Região
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c]" />
                  <input
                    type="text"
                    placeholder="Ex: São Paulo, SP"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full pl-10 border border-[#f2dc93] bg-white rounded-xl px-4 py-3.5 text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-base"
                  />
                </div>
                <div className="mt-3 bg-[#fdf9ee] border border-[#f2dc93] rounded-xl p-3 flex items-start gap-2">
                  <Sparkles size={14} className="text-[#d4a017] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#664708]">
                    Com a cidade, a IA busca automaticamente <strong>espaços para eventos</strong>, <strong>fotógrafos</strong>, <strong>buffets</strong> e <strong>decoradores</strong> próximos a vocês.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: Convidados */}
            {step === 3 && (
              <div className="grid grid-cols-1 gap-3">
                {CONVIDADOS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, convidados: opt.value })}
                    className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 text-left transition-all font-medium ${
                      form.convidados === opt.value
                        ? "border-[#d4a017] bg-[#d4a017] text-white"
                        : "border-[#f2dc93] bg-white text-[#1a1208] hover:border-[#eac85a]"
                    }`}
                  >
                    {opt.label} convidados
                    {form.convidados === opt.value && <Sparkles size={16} />}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 4: Orçamento */}
            {step === 4 && (
              <div className="grid grid-cols-1 gap-3">
                {ORCAMENTO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm({ ...form, orcamento: opt.value })}
                    className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 text-left transition-all font-medium ${
                      form.orcamento === opt.value
                        ? "border-[#d4a017] bg-[#d4a017] text-white"
                        : "border-[#f2dc93] bg-white text-[#1a1208] hover:border-[#eac85a]"
                    }`}
                  >
                    {opt.label}
                    {form.orcamento === opt.value && <Sparkles size={16} />}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 5: Estilo */}
            {step === 5 && (
              <div className="grid grid-cols-2 gap-3">
                {ESTILOS.map((estilo) => (
                  <button
                    key={estilo.id}
                    onClick={() => setForm({ ...form, estilo: estilo.id })}
                    className={`flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-2xl border-2 transition-all ${
                      form.estilo === estilo.id
                        ? "border-[#d4a017] bg-[#d4a017] text-white"
                        : "border-[#f2dc93] bg-white text-[#1a1208] hover:border-[#eac85a]"
                    }`}
                  >
                    <span className="text-2xl">{estilo.emoji}</span>
                    <div className="text-center">
                      <p className="font-bold text-sm">{estilo.nome}</p>
                      <p className={`text-xs mt-0.5 ${form.estilo === estilo.id ? "text-white/75" : "text-[#9a6e0a]"}`}>
                        {estilo.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 6: Paleta de Cores */}
            {step === 6 && (
              <div className="grid grid-cols-2 gap-3">
                {PALETAS.map((paleta) => (
                  <button
                    key={paleta.nome}
                    onClick={() => setForm({ ...form, paletaNome: paleta.nome, paletaCores: paleta.cores })}
                    className={`flex flex-col gap-3 px-4 py-4 rounded-2xl border-2 transition-all text-left ${
                      form.paletaNome === paleta.nome
                        ? "border-[#d4a017] bg-[#fdf3e0]"
                        : "border-[#f2dc93] bg-white hover:border-[#eac85a]"
                    }`}
                  >
                    {paleta.cores.length > 0 ? (
                      <div className="flex gap-1.5">
                        {paleta.cores.map((cor, i) => (
                          <div
                            key={i}
                            className="w-7 h-7 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-xl">✨</div>
                    )}
                    <p className={`text-xs font-semibold leading-tight ${form.paletaNome === paleta.nome ? "text-[#b8860b]" : "text-[#664708]"}`}>
                      {paleta.nome}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 7: Conta */}
            {step === 7 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c]" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3.5 border border-[#f2dc93] bg-white rounded-xl text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
                    Senha (mín. 6 caracteres)
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c]" />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-3.5 border border-[#f2dc93] bg-white rounded-xl text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c] hover:text-[#d4a017]"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="bg-[#1a1208] rounded-xl p-4">
                  <p className="text-[#eac85a] text-xs font-semibold mb-2">Resumo do seu casamento</p>
                  <p className="text-white font-bold text-xl mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
                    {form.noivo1} <span className="text-[#d4a017]">&</span> {form.noivo2}
                  </p>
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs text-[#c9a84c]">
                    {form.cidade && <span>📍 {form.cidade}</span>}
                    {form.dataEvento && (
                      <span>📅 {new Date(form.dataEvento + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    )}
                    {form.convidados && <span>👥 Até {form.convidados} convidados</span>}
                    {form.estilo && <span>✨ {ESTILOS.find((e) => e.id === form.estilo)?.nome}</span>}
                  </div>
                  {form.paletaCores.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-[#9a6e0a]">Paleta:</span>
                      <div className="flex gap-1.5">
                        {form.paletaCores.map((cor, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border-2 border-[#d4a017]/40"
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-[#c9a84c]">{form.paletaNome}</span>
                    </div>
                  )}
                  {form.paletaNome === "Sugestão da IA" && (
                    <div className="flex items-center gap-2 mt-3">
                      <Sparkles size={12} className="text-[#d4a017]" />
                      <span className="text-xs text-[#c9a84c]">A IA vai criar uma paleta personalizada para vocês</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-[#f2dc93] text-[#9a6e0a] font-medium hover:bg-[#f9efcc] transition-all"
              >
                <ChevronLeft size={16} />
                Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canAdvance() || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : step === STEPS.length - 1 ? (
                <>
                  <Sparkles size={16} />
                  Criar minha conta!
                </>
              ) : (
                <>
                  Continuar
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 h-2 bg-[#d4a017]"
                    : i < step
                    ? "w-2 h-2 bg-[#d4a017]"
                    : "w-2 h-2 bg-[#f2dc93]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "Este email já está cadastrado. Tente entrar.";
  if (msg.includes("Password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (msg.includes("Unable to validate email"))
    return "Email inválido. Verifique e tente novamente.";
  return "Erro ao criar conta. Tente novamente.";
}

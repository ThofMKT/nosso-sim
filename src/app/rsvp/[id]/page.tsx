"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Heart, MapPin, Calendar, Check, X } from "lucide-react";

type CasalPublico = {
  noivo1: string;
  noivo2: string;
  data_evento: string;
  cidade: string;
  cores_casamento?: string;
};

type Etapa = "form" | "enviando" | "confirmado" | "recusou" | "erro";

export default function RSVPPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [casal, setCasal] = useState<CasalPublico | null>(null);
  const [nome, setNome] = useState("");
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/rsvp/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setNotFound(true);
        else setCasal(data as CasalPublico);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  async function responder(resposta: "sim" | "nao") {
    if (!nome.trim()) return;
    setEtapa("enviando");
    try {
      const res = await fetch(`/api/rsvp/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), resposta }),
      });
      if (res.ok) {
        setEtapa(resposta === "sim" ? "confirmado" : "recusou");
      } else {
        setEtapa("erro");
      }
    } catch {
      setEtapa("erro");
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#fdf9ee] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">😢</p>
          <h1 className="text-xl font-bold text-[#1a1208] mb-2">Link inválido</h1>
          <p className="text-sm text-[#9a6e0a]">Este link de confirmação não existe ou expirou.</p>
        </div>
      </div>
    );
  }

  if (!casal) {
    return (
      <div className="min-h-screen bg-[#fdf9ee] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f2dc93] border-t-[#d4a017] rounded-full animate-spin" />
      </div>
    );
  }

  const dataFormatada = new Date(casal.data_evento + "T12:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const iniciais = `${casal.noivo1.charAt(0)}${casal.noivo2.charAt(0)}`;

  if (etapa === "confirmado") {
    return (
      <div className="min-h-screen bg-[#fdf9ee] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check size={36} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Presença confirmada! 🎉
        </h1>
        <p className="text-[#664708] mb-2">
          <strong>{nome}</strong>, mal podemos esperar para celebrar com você!
        </p>
        <p className="text-sm text-[#9a6e0a]">
          {casal.noivo1} & {casal.noivo2} — {dataFormatada}
        </p>
        <div className="mt-8 w-16 h-16 rounded-2xl border-2 border-[#d4a017] flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1a1208, #3d2a03)" }}>
          <span className="text-2xl font-bold text-[#d4a017]" style={{ fontFamily: "var(--font-playfair)" }}>
            {iniciais}
          </span>
        </div>
      </div>
    );
  }

  if (etapa === "recusou") {
    return (
      <div className="min-h-screen bg-[#fdf9ee] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#f9efcc] flex items-center justify-center mb-6">
          <Heart size={32} className="text-[#d4a017]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          Recebemos sua resposta
        </h1>
        <p className="text-[#664708] mb-2">
          <strong>{nome}</strong>, sentiremos sua falta! Obrigado por avisar.
        </p>
        <p className="text-sm text-[#9a6e0a]">
          {casal.noivo1} & {casal.noivo2} — {dataFormatada}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf9ee] flex flex-col">
      {/* Hero */}
      <div
        className="w-full px-6 py-12 flex flex-col items-center text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1208 0%, #3d2a03 60%, #664708 100%)" }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#d4a017] opacity-10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#d4a017] opacity-10 translate-y-1/2 -translate-x-1/2" />

        <div className="w-20 h-20 rounded-2xl border-2 border-[#d4a017] flex items-center justify-center mb-5 relative"
          style={{ background: "linear-gradient(135deg, #3d2a03, #664708)" }}>
          <span className="text-3xl font-bold text-[#d4a017]" style={{ fontFamily: "var(--font-playfair)" }}>
            {iniciais}
          </span>
        </div>

        <p className="text-[#eac85a] text-xs font-semibold uppercase tracking-widest mb-2">Você está convidado</p>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
          {casal.noivo1} <span className="text-[#d4a017]">&</span> {casal.noivo2}
        </h1>
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <div className="flex items-center gap-1.5 text-[#c9a84c] text-sm">
            <Calendar size={13} />
            {dataFormatada}
          </div>
          {casal.cidade && (
            <div className="flex items-center gap-1.5 text-[#c9a84c] text-sm">
              <MapPin size={13} />
              {casal.cidade}
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
              Confirme sua presença
            </h2>
            <p className="text-sm text-[#9a6e0a]">
              {casal.noivo1} e {casal.noivo2} adorariam contar com você!
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
              Seu nome completo
            </label>
            <input
              type="text"
              placeholder="Como você quer ser chamado(a)?"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && nome.trim() && responder("sim")}
              className="w-full border border-[#f2dc93] bg-white rounded-xl px-4 py-3.5 text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-base"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => responder("sim")}
              disabled={!nome.trim() || etapa === "enviando"}
              className="w-full flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-md text-base active:scale-95"
            >
              {etapa === "enviando" ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  Sim, vou estar lá! 🎉
                </>
              )}
            </button>

            <button
              onClick={() => responder("nao")}
              disabled={!nome.trim() || etapa === "enviando"}
              className="w-full flex items-center justify-center gap-2 border-2 border-[#f2dc93] hover:border-[#eac85a] hover:bg-[#fdf9ee] disabled:opacity-40 disabled:cursor-not-allowed text-[#9a6e0a] font-medium py-3.5 rounded-2xl transition-all text-sm"
            >
              <X size={15} />
              Não poderei comparecer
            </button>
          </div>

          {etapa === "erro" && (
            <p className="text-center text-red-500 text-sm">
              Ocorreu um erro. Tente novamente.
            </p>
          )}

          <p className="text-center text-xs text-[#c9a84c]">
            Feito com <span className="text-[#d4a017]">♥</span> pelo Nosso Sim
          </p>
        </div>
      </div>
    </div>
  );
}

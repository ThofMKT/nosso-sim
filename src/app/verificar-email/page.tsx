"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, RefreshCw, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function VerificarEmailConteudo() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);

  async function reenviar() {
    if (!email) return;
    setReenviando(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setReenviado(true);
    setReenviando(false);
  }

  return (
    <div className="min-h-screen bg-[#fdf9ee] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm text-center space-y-6">
        <Link href="/">
          <Image src="/logo.png" alt="Nosso Sim" width={1230} height={1278} className="h-16 w-auto object-contain mx-auto" />
        </Link>

        <div className="w-20 h-20 rounded-full bg-[#f9efcc] flex items-center justify-center mx-auto">
          <Mail size={36} className="text-[#d4a017]" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
            Verifique seu email
          </h1>
          <p className="text-[#664708] text-sm leading-relaxed">
            Enviamos um link de confirmação para{" "}
            {email && <strong className="text-[#d4a017]">{email}</strong>}.
            <br />Clique no link para ativar sua conta.
          </p>
        </div>

        <div className="bg-white border border-[#f2dc93] rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-[#9a6e0a] uppercase tracking-wide">Não recebeu?</p>
          <p className="text-xs text-[#664708]">Verifique a pasta de spam. Pode levar até 2 minutos.</p>
        </div>

        {reenviado ? (
          <div className="flex items-center justify-center gap-2 text-green-700 text-sm font-medium">
            <Check size={16} /> Email reenviado!
          </div>
        ) : (
          <button
            onClick={reenviar}
            disabled={reenviando}
            className="w-full flex items-center justify-center gap-2 border border-[#f2dc93] bg-white hover:bg-[#fdf9ee] text-[#9a6e0a] font-medium py-3 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {reenviando ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Reenviar email de confirmação
          </button>
        )}

        <p className="text-sm text-[#9a6e0a]">
          Já confirmou?{" "}
          <Link href="/login" className="text-[#d4a017] font-semibold hover:text-[#b8860b]">
            Entrar na conta
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerificarEmailConteudo />
    </Suspense>
  );
}

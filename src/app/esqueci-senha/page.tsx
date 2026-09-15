"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ChevronLeft, Send, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErro("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-senha`,
    });

    if (error) {
      setErro("Não foi possível enviar o email. Verifique o endereço e tente novamente.");
    } else {
      setEnviado(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#fdf9ee] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/">
            <Image src="/logo.png" alt="Nosso Sim" width={1230} height={1278} className="h-16 w-auto object-contain mx-auto" />
          </Link>
        </div>

        {enviado ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check size={36} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[#1a1208]" style={{ fontFamily: "var(--font-playfair)" }}>
              Email enviado!
            </h1>
            <p className="text-sm text-[#664708]">
              Enviamos as instruções para <strong className="text-[#d4a017]">{email}</strong>.
              <br />Verifique também o spam.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-[#d4a017] font-semibold text-sm hover:text-[#b8860b]">
              <ChevronLeft size={14} /> Voltar para o login
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#f9efcc] p-7 shadow-sm space-y-5">
            <div>
              <h1 className="text-xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                Recuperar senha
              </h1>
              <p className="text-sm text-[#9a6e0a]">
                Digite seu email e enviaremos um link para criar uma nova senha.
              </p>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c]" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border border-[#f2dc93] bg-white rounded-xl text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Send size={15} /> Enviar link de recuperação</>
                }
              </button>
            </form>

            <Link href="/login" className="flex items-center gap-1.5 text-sm text-[#9a6e0a] hover:text-[#664708]">
              <ChevronLeft size={14} /> Voltar para o login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Eye, EyeOff, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setErro("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setErro("As senhas não coincidem."); return; }

    setLoading(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErro("Não foi possível atualizar a senha. O link pode ter expirado.");
    } else {
      setConcluido(true);
      setTimeout(() => router.push("/dashboard"), 2000);
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

        {concluido ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check size={36} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-[#1a1208]" style={{ fontFamily: "var(--font-playfair)" }}>
              Senha atualizada!
            </h1>
            <p className="text-sm text-[#664708]">Redirecionando para o dashboard...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#f9efcc] p-7 shadow-sm space-y-5">
            <div>
              <h1 className="text-xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                Nova senha
              </h1>
              <p className="text-sm text-[#9a6e0a]">Escolha uma nova senha segura para sua conta.</p>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">Nova senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c]" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3.5 border border-[#f2dc93] bg-white rounded-xl text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c]">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">Confirmar senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c]" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3.5 border border-[#f2dc93] bg-white rounded-xl text-[#1a1208] placeholder:text-[#c9a84c] focus:outline-none focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/20 transition-all text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : "Salvar nova senha"
                }
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

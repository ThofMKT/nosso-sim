"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { signIn, signInWithGoogle } from "@/app/actions/auth";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn({ email, password });
    if (result?.error) {
      setError(traduzirErro(result.error));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signInWithGoogle();
  }

  return (
    <div className="min-h-screen bg-[#fdf9ee] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="Nosso Sim" width={1230} height={1278} className="h-20 w-auto object-contain mx-auto" />
          </Link>
          <p className="text-[#9a6e0a] text-sm mt-2">Bem-vindo(a) de volta 💍</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-7 shadow-sm">
          <h1
            className="text-xl font-bold text-[#1a1208] mb-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Entrar na sua conta
          </h1>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
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

            <div>
              <label className="block text-xs font-semibold text-[#9a6e0a] mb-1.5 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c9a84c]" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            <div className="flex justify-end">
              <Link href="/esqueci-senha" className="text-xs text-[#d4a017] hover:text-[#b8860b] transition-colors">
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Heart size={16} />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#f2dc93]" />
            <span className="text-xs text-[#c9a84c]">ou</span>
            <div className="flex-1 h-px bg-[#f2dc93]" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full border border-[#f2dc93] bg-white hover:bg-[#fdf9ee] text-[#1a1208] font-medium py-3.5 rounded-xl transition-all text-sm disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>
        </div>

        <p className="text-center text-sm text-[#9a6e0a] mt-6">
          Novo por aqui?{" "}
          <Link href="/cadastro" className="text-[#d4a017] font-semibold hover:text-[#b8860b]">
            Criar conta grátis
          </Link>
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-[#c9a84c]">
          <Sparkles size={12} />
          Seus dados estão seguros e criptografados
        </div>
      </div>
    </div>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar.";
  if (msg.includes("Too many requests")) return "Muitas tentativas. Aguarde alguns minutos.";
  return "Erro ao entrar. Tente novamente.";
}

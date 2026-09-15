import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  Sparkles,
  ChevronRight,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-[#f2dc93]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image src="/logo.png" alt="Nosso Sim" width={1230} height={1278} className="h-10 w-auto object-contain" priority />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm text-[#7d5808] hover:text-[#d4a017] font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Começar grátis
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-[#f9efcc] opacity-40 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#fdf9ee] opacity-60 blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="anim-fade inline-flex items-center gap-2 bg-[#fdf9ee] border border-[#f2dc93] text-[#9a6e0a] text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Sparkles size={12} className="text-[#d4a017]" />
            Planejamento inteligente com IA
          </div>

          <h1
            className="anim-fade-1 text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] mb-6 text-[#1a1208]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Seu casamento dos{" "}
            <span className="shimmer-text italic">sonhos,</span>
            <br />
            do zero ao altar.
          </h1>

          <p className="anim-fade-2 text-lg sm:text-xl text-[#664708] max-w-2xl mx-auto mb-10 leading-relaxed">
            Chega de planilhas, grupos de WhatsApp e estresse. O{" "}
            <strong>Nosso Sim</strong> organiza tudo automaticamente — cronograma,
            orçamento, fornecedores e convidados — em um só lugar.
          </p>

          <div className="anim-fade-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/cadastro"
              className="ring-pulse flex items-center gap-2.5 bg-[#d4a017] hover:bg-[#b8860b] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <Heart size={18} />
              Criar meu plano gratuito
            </Link>
            <Link
              href="#como-funciona"
              className="text-[#7d5808] hover:text-[#d4a017] font-medium text-sm flex items-center gap-1.5 transition-colors"
            >
              Ver como funciona
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Social proof */}
          <div className="anim-fade-4 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#9a6e0a]">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {(["A", "M", "J", "R"] as const).map((l, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      backgroundColor: ["#d4a017", "#b8860b", "#e4b530", "#9a6e0a"][i],
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <span>+2.400 casais planejando</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} className="fill-[#d4a017] text-[#d4a017]" />
              ))}
              <span className="ml-1">4.9 de avaliação</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 px-6 bg-[#fdf9ee]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4a017] font-semibold text-sm uppercase tracking-widest mb-3">
              Como funciona
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#1a1208]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              3 minutos. Pronto para começar.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <Calendar size={28} />,
                title: "Responda 4 perguntas",
                desc: "Data, orçamento, cidade e número de convidados. O app faz o resto sozinho.",
              },
              {
                step: "02",
                icon: <CheckCircle2 size={28} />,
                title: "Receba seu cronograma",
                desc: "Tarefas na ordem certa, com prazos reais. Sem adivinhar o que fazer primeiro.",
              },
              {
                step: "03",
                icon: <DollarSign size={28} />,
                title: "Acompanhe tudo",
                desc: "Gastos, convidados, fornecedores e datas em tempo real. Com alertas antes de estourar.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="glass-card rounded-2xl p-8 hover:shadow-lg transition-shadow group"
              >
                <div
                  className="font-bold text-5xl font-mono mb-4 leading-none"
                  style={{ color: "#f2dc93" }}
                >
                  {item.step}
                </div>
                <div className="text-[#d4a017] mb-4 group-hover:scale-110 transition-transform inline-block">
                  {item.icon}
                </div>
                <h3 className="font-bold text-[#1a1208] text-lg mb-2">{item.title}</h3>
                <p className="text-[#664708] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#d4a017] font-semibold text-sm uppercase tracking-widest mb-3">
              Funcionalidades
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold text-[#1a1208]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Tudo que você precisa.
              <br />
              <span className="italic gold-gradient-text">Nada que você não precisa.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-[#f9efcc] rounded-2xl p-6 hover:border-[#eac85a] hover:shadow-md transition-all group bg-white"
              >
                <div className="w-11 h-11 rounded-xl bg-[#fdf9ee] flex items-center justify-center text-[#d4a017] mb-4 group-hover:bg-[#f9efcc] transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#1a1208] mb-2">{f.title}</h3>
                <p className="text-[#664708] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ICPs */}
      <section className="py-20 px-6 bg-[#1a1208]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-4xl sm:text-5xl font-bold text-white"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Feito para{" "}
              <span className="shimmer-text italic">você,</span> de verdade.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-[#664708] rounded-2xl p-8">
              <div className="text-3xl mb-4">💍</div>
              <h3 className="font-bold text-white text-xl mb-3">
                &ldquo;Quero fazer tudo, mas falta tempo&rdquo;
              </h3>
              <p className="text-[#eac85a] text-sm leading-relaxed">
                Você resolve tudo sozinha, é detalhista e quer o casamento perfeito
                — mas não tem horas para ficar pesquisando. O Nosso Sim centraliza
                tudo e te diz exatamente o que fazer a seguir.
              </p>
            </div>
            <div className="border border-[#664708] rounded-2xl p-8">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="font-bold text-white text-xl mb-3">
                &ldquo;Quero casar bem, mas sem pagar assessoria&rdquo;
              </h3>
              <p className="text-[#eac85a] text-sm leading-relaxed">
                Assessoria custa caro. O Nosso Sim entrega o mesmo valor —
                cronograma inteligente, controle financeiro e sugestões de
                fornecedores — por uma fração do preço.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="float inline-block text-5xl mb-6">💍</div>
          <h2
            className="text-4xl sm:text-5xl font-bold text-[#1a1208] mb-5"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Pronto para dizer{" "}
            <span className="italic gold-gradient-text">sim</span>?
          </h2>
          <p className="text-[#664708] text-lg mb-10">
            Comece agora. Grátis. Sem cartão de crédito.
          </p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-3 bg-[#d4a017] hover:bg-[#b8860b] text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-95"
          >
            <Heart size={20} />
            Criar meu planejamento
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#f9efcc] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/logo.png" alt="Nosso Sim" width={1230} height={1278} className="h-9 w-auto object-contain" />
          <p className="text-sm text-[#9a6e0a]">
            © 2025 Nosso Sim. Feito com amor para casais brasileiros.
          </p>
          <div className="flex gap-5 text-sm text-[#9a6e0a]">
            <Link href="/privacidade" className="hover:text-[#d4a017] transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-[#d4a017] transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: <Calendar size={20} />,
    title: "Cronograma automático",
    desc: "Gerado com base na sua data. Tarefas na ordem certa, sem depender de ninguém.",
  },
  {
    icon: <DollarSign size={20} />,
    title: "Controle de orçamento",
    desc: "Acompanhe cada gasto e receba alertas antes de estourar o limite.",
  },
  {
    icon: <Users size={20} />,
    title: "Lista de convidados",
    desc: "Com prioridade (essencial, médio, substituível) e pré-confirmação online.",
  },
  {
    icon: <Sparkles size={20} />,
    title: "IA para fornecedores",
    desc: "Sugestões de fotógrafos, buffet, decoração e mais, na sua cidade e orçamento.",
  },
  {
    icon: <Heart size={20} />,
    title: "Lista de presentes",
    desc: "Plataforma integrada com PIX. Seus convidados presenteiam direto pelo app.",
  },
  {
    icon: <Star size={20} />,
    title: "IA de identidade visual",
    desc: "Gera o logo com as iniciais dos noivos e a identidade visual do casamento.",
  },
  {
    icon: <CheckCircle2 size={20} />,
    title: "Agenda dos noivos",
    desc: "Compromissos com fornecedores, degustações e provas de roupa com alertas.",
  },
  {
    icon: <ChevronRight size={20} />,
    title: "Exportar e imprimir",
    desc: "Baixe sua lista de tarefas, orçamento e convidados em PDF.",
  },
  {
    icon: <Calendar size={20} />,
    title: "Contador regressivo",
    desc: "Veja quantos dias faltam com os nomes dos noivos em destaque.",
  },
];

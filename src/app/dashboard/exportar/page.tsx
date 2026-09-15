"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Users, DollarSign, Calendar, FileDown, Cloud, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CasalData = {
  noivo1: string;
  noivo2: string;
  data_evento: string;
  cidade: string;
  orcamento: number;
};

type ExportTipo = "tarefas" | "convidados" | "orcamento" | "agenda" | null;

function headerHTML(casal: CasalData) {
  const data = new Date(casal.data_evento + "T12:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });
  return `
    <div class="header">
      <div class="monograma">${casal.noivo1[0]}${casal.noivo2[0]}</div>
      <div class="nomes">${casal.noivo1} &amp; ${casal.noivo2}</div>
      <div class="info">${data} &nbsp;·&nbsp; ${casal.cidade}</div>
    </div>`;
}

function baseCSS() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; color: #1a1208; padding: 40px; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #d4a017; padding-bottom: 20px; margin-bottom: 28px; }
    .monograma { font-size: 52px; font-weight: bold; color: #d4a017; }
    .nomes { font-size: 13px; letter-spacing: 5px; text-transform: uppercase; color: #664708; margin-top: 4px; }
    .info { font-size: 11px; color: #9a6e0a; margin-top: 4px; }
    .titulo-secao { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #9a6e0a; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px 10px; background: #f9efcc; color: #664708; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 8px 10px; border-bottom: 1px solid #f2dc93; vertical-align: top; }
    .stats { display: flex; gap: 12px; margin-bottom: 20px; }
    .stat { flex: 1; background: #fdf9ee; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #f2dc93; }
    .stat-num { font-size: 22px; font-weight: bold; color: #d4a017; }
    .stat-label { font-size: 9px; text-transform: uppercase; color: #9a6e0a; margin-top: 2px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
    .badge-alta { background: #f9efcc; color: #664708; }
    .badge-media { background: #fdf9ee; color: #9a6e0a; }
    .badge-sub { background: #f0f0f0; color: #888; }
    .badge-confirmado { background: #dcfce7; color: #16a34a; }
    .badge-pendente { background: #fef9c3; color: #ca8a04; }
    .badge-recusou { background: #fee2e2; color: #dc2626; }
    .badge-feita { background: #dcfce7; color: #16a34a; }
    .badge-aberta { background: #f9efcc; color: #664708; }
    .fase { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #9a6e0a; padding: 12px 0 4px; letter-spacing: 1px; }
    .rodape { margin-top: 32px; text-align: center; font-size: 10px; color: #c9a84c; }
    @media print { body { padding: 20px; } @page { margin: 15mm; } }
  `;
}

function abrirJanela(titulo: string, conteudo: string, casal: CasalData) {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>${titulo} — ${casal.noivo1} &amp; ${casal.noivo2}</title>
    <style>${baseCSS()}</style></head><body>
    ${headerHTML(casal)}
    ${conteudo}
    <div class="rodape">Gerado pelo Nosso Sim · ${new Date().toLocaleDateString("pt-BR")}</div>
    <script>window.onload = () => { window.print(); }</script>
    </body></html>`;

  const janela = window.open("", "_blank");
  if (janela) {
    janela.document.write(html);
    janela.document.close();
  }
}

export default function ExportarPage() {
  const [casal, setCasal] = useState<CasalData | null>(null);
  const [exportando, setExportando] = useState<ExportTipo>(null);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("casais")
        .select("noivo1, noivo2, data_evento, cidade, orcamento")
        .eq("user_id", user.id)
        .single();
      if (data) setCasal(data as CasalData);
    }
    carregar();
  }, []);

  async function exportar(tipo: ExportTipo) {
    if (!casal || !tipo) return;
    setExportando(tipo);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setExportando(null); return; }

    try {
      if (tipo === "convidados") {
        const { data } = await supabase
          .from("convidados")
          .select("*")
          .eq("user_id", user.id)
          .order("prioridade");

        const rows = data ?? [];
        const total = rows.length;
        const confirmados = rows.filter((c) => c.status === "Confirmado").length;
        const pendentes = rows.filter((c) => c.status === "Pendente").length;
        const recusaram = rows.filter((c) => c.status === "Recusou").length;

        const conteudo = `
          <p class="titulo-secao">Lista de Convidados</p>
          <div class="stats">
            <div class="stat"><div class="stat-num">${total}</div><div class="stat-label">Total</div></div>
            <div class="stat"><div class="stat-num">${confirmados}</div><div class="stat-label">Confirmados</div></div>
            <div class="stat"><div class="stat-num">${pendentes}</div><div class="stat-label">Pendentes</div></div>
            <div class="stat"><div class="stat-num">${recusaram}</div><div class="stat-label">Recusaram</div></div>
          </div>
          <table>
            <thead><tr><th>#</th><th>Nome</th><th>Contato</th><th>Prioridade</th><th>Status</th></tr></thead>
            <tbody>
              ${rows.map((c, i) => `<tr>
                <td>${i + 1}</td>
                <td>${c.nome}</td>
                <td>${c.telefone || c.email || "—"}</td>
                <td><span class="badge badge-${c.prioridade === "Substituivel" ? "sub" : c.prioridade.toLowerCase()}">${c.prioridade}</span></td>
                <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
              </tr>`).join("")}
            </tbody>
          </table>`;
        abrirJanela("Lista de Convidados", conteudo, casal);
      }

      if (tipo === "tarefas") {
        const { data } = await supabase
          .from("tarefas")
          .select("*")
          .eq("user_id", user.id)
          .order("fase")
          .order("created_at");

        const rows = data ?? [];
        const fases = [...new Set(rows.map((t) => t.fase as string))];
        const feitas = rows.filter((t) => t.done).length;

        const conteudo = `
          <p class="titulo-secao">Cronograma de Tarefas</p>
          <div class="stats">
            <div class="stat"><div class="stat-num">${rows.length}</div><div class="stat-label">Total</div></div>
            <div class="stat"><div class="stat-num">${feitas}</div><div class="stat-label">Concluídas</div></div>
            <div class="stat"><div class="stat-num">${rows.length - feitas}</div><div class="stat-label">Pendentes</div></div>
          </div>
          <table>
            <thead><tr><th>Fase</th><th>Tarefa</th><th>Urgência</th><th>Status</th></tr></thead>
            <tbody>
              ${fases.map((fase) => rows
                .filter((t) => t.fase === fase)
                .map((t) => `<tr>
                  <td>${t.fase}</td>
                  <td>${t.label}</td>
                  <td>${t.urgencia}</td>
                  <td><span class="badge badge-${t.done ? "feita" : "aberta"}">${t.done ? "Feita" : "Aberta"}</span></td>
                </tr>`).join("")
              ).join("")}
            </tbody>
          </table>`;
        abrirJanela("Cronograma de Tarefas", conteudo, casal);
      }

      if (tipo === "orcamento") {
        const { data } = await supabase
          .from("orcamento_itens")
          .select("*")
          .eq("user_id", user.id)
          .order("categoria");

        const rows = data ?? [];
        const totalGasto = rows.reduce((s, r) => s + (r.valor_gasto ?? 0), 0);
        const orcamento = casal.orcamento ?? 0;

        const conteudo = `
          <p class="titulo-secao">Orçamento Detalhado</p>
          <div class="stats">
            <div class="stat"><div class="stat-num">R$ ${orcamento.toLocaleString("pt-BR")}</div><div class="stat-label">Orçamento Total</div></div>
            <div class="stat"><div class="stat-num">R$ ${totalGasto.toLocaleString("pt-BR")}</div><div class="stat-label">Gasto até agora</div></div>
            <div class="stat"><div class="stat-num">R$ ${(orcamento - totalGasto).toLocaleString("pt-BR")}</div><div class="stat-label">Disponível</div></div>
          </div>
          <table>
            <thead><tr><th>Categoria</th><th>% Recomendado</th><th>Valor Sugerido</th><th>Valor Gasto</th><th>Saldo</th></tr></thead>
            <tbody>
              ${rows.map((r) => {
                const sugerido = Math.round((r.percentual_recomendado / 100) * orcamento);
                const saldo = sugerido - (r.valor_gasto ?? 0);
                return `<tr>
                  <td>${r.categoria}</td>
                  <td>${r.percentual_recomendado}%</td>
                  <td>R$ ${sugerido.toLocaleString("pt-BR")}</td>
                  <td>R$ ${(r.valor_gasto ?? 0).toLocaleString("pt-BR")}</td>
                  <td style="color: ${saldo >= 0 ? "#16a34a" : "#dc2626"}">R$ ${saldo.toLocaleString("pt-BR")}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>`;
        abrirJanela("Orçamento Detalhado", conteudo, casal);
      }

      if (tipo === "agenda") {
        const { data } = await supabase
          .from("agenda")
          .select("*")
          .eq("user_id", user.id)
          .order("data_hora");

        const rows = data ?? [];

        const conteudo = `
          <p class="titulo-secao">Agenda de Compromissos</p>
          <table>
            <thead><tr><th>Data</th><th>Horário</th><th>Compromisso</th><th>Local</th><th>Tipo</th></tr></thead>
            <tbody>
              ${rows.map((r) => {
                const dt = new Date(r.data_hora);
                return `<tr>
                  <td>${dt.toLocaleDateString("pt-BR")}</td>
                  <td>${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>${r.titulo}</td>
                  <td>${r.local || "—"}</td>
                  <td>${r.tipo}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>`;
        abrirJanela("Agenda de Compromissos", conteudo, casal);
      }
    } finally {
      setExportando(null);
    }
  }

  const EXPORTS = [
    {
      icon: <Users size={24} className="text-[#d4a017]" />,
      titulo: "Lista de Convidados",
      descricao: "Nomes, contatos, prioridades e status de confirmação",
      tipo: "convidados" as ExportTipo,
    },
    {
      icon: <CheckSquare size={24} className="text-[#d4a017]" />,
      titulo: "Cronograma de Tarefas",
      descricao: "Todas as tarefas organizadas por fase com status",
      tipo: "tarefas" as ExportTipo,
    },
    {
      icon: <DollarSign size={24} className="text-[#d4a017]" />,
      titulo: "Orçamento Detalhado",
      descricao: "Categorias, valores sugeridos, gastos e saldo",
      tipo: "orcamento" as ExportTipo,
    },
    {
      icon: <Calendar size={24} className="text-[#d4a017]" />,
      titulo: "Agenda de Compromissos",
      descricao: "Todos os compromissos com data, horário e local",
      tipo: "agenda" as ExportTipo,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "var(--font-playfair)" }}>
          Exportar
        </h1>
        <p className="text-sm text-[#9a6e0a] mt-0.5">
          Baixe seus dados em PDF com cabeçalho personalizado do casamento.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {EXPORTS.map((e) => (
          <div key={e.tipo} className="bg-white rounded-2xl border border-[#f9efcc] p-5 flex flex-col gap-4 hover:border-[#eac85a] hover:shadow-sm transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#fdf9ee] flex items-center justify-center">
              {e.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#1a1208] text-sm mb-1">{e.titulo}</p>
              <p className="text-xs text-[#9a6e0a] leading-relaxed">{e.descricao}</p>
            </div>
            <button
              onClick={() => exportar(e.tipo)}
              disabled={!casal || exportando === e.tipo}
              className="flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-50 text-white font-bold rounded-xl px-5 py-2.5 transition-all text-sm"
            >
              {exportando === e.tipo
                ? <><Loader2 size={14} className="animate-spin" /> Gerando...</>
                : <><FileDown size={14} /> Exportar PDF</>
              }
            </button>
          </div>
        ))}
      </div>

      {/* Backup status */}
      <div className="bg-white rounded-2xl border border-[#f9efcc] p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#fdf9ee] flex items-center justify-center flex-shrink-0">
            <Cloud size={22} className="text-[#d4a017]" />
          </div>
          <div>
            <h2 className="font-bold text-[#1a1208] mb-1">Backup automático na nuvem</h2>
            <p className="text-xs text-[#9a6e0a] leading-relaxed">
              Todos os dados são sincronizados em tempo real no Supabase. Troque de dispositivo à vontade — nada se perde.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 font-semibold">Backup ativo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

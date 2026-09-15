import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { noivo1, noivo2, cidade, orcamento, convidados, diasRestantes, estilo, tempoJuntos, tarefasConcluidas, tarefasTotal, temLocal, temFornecedor } = await req.json();

  const estiloLabel: Record<string, string> = {
    classico: "clássico", romantico: "romântico", rustico: "rústico/boho",
    moderno: "moderno", luxo: "luxo", praia: "praia",
  };

  const contexto = [
    temLocal && "Já têm um espaço pesquisado",
    temFornecedor && "Já buscaram fornecedores",
    tarefasTotal > 0 && `${tarefasConcluidas} de ${tarefasTotal} tarefas concluídas`,
  ].filter(Boolean).join(". ");

  const fase =
    diasRestantes > 365 ? "inicial (mais de 1 ano)" :
    diasRestantes > 180 ? "planejamento (6–12 meses)" :
    diasRestantes > 90  ? "execução (3–6 meses)" :
    diasRestantes > 30  ? "reta final (menos de 3 meses)" :
    "últimas semanas";

  const prompt = `Você é o assistente de planejamento de casamento do app Nosso Sim.
Dê UMA dica prática e personalizada para o casal ${noivo1} & ${noivo2}, que planejam um casamento estilo ${estiloLabel[estilo] ?? estilo} em ${cidade}, com ${diasRestantes} dias até o grande dia, orçamento de R$ ${Number(orcamento).toLocaleString("pt-BR")} e ${convidados} convidados.
${tempoJuntos ? `Estão juntos há ${tempoJuntos}.` : ""}
${contexto ? `Contexto atual: ${contexto}.` : ""}
Fase do planejamento: ${fase}.

Regras:
- 2 a 3 frases, tom caloroso e motivador
- Dica concreta: diga exatamente O QUE fazer agora
- Considere a fase atual para a urgência da dica
- Em português brasileiro natural
- Não comece com "Olá" ou "Parabéns"
- Não mencione o nome do app

Responda SOMENTE com a dica, sem aspas, sem introdução.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const dica = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ dica });
  } catch (err) {
    console.error("Erro API dica:", err);
    return NextResponse.json({ error: "Erro ao gerar dica" }, { status: 500 });
  }
}

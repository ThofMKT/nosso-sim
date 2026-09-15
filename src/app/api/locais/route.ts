import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { cidade, orcamento, convidados } = await req.json();

  const orcamentoLabel: Record<string, string> = {
    "15000": "até R$ 15 mil",
    "30000": "R$ 15–30 mil",
    "60000": "R$ 30–60 mil",
    "100000": "R$ 60–100 mil",
    "150000": "acima de R$ 100 mil",
  };

  const prompt = `Você é um assistente especialista em casamentos no Brasil.
Sugira 6 opções reais de espaços para festa de casamento em "${cidade}" para ${convidados} convidados com orçamento ${orcamentoLabel[orcamento] ?? orcamento}.

Responda SOMENTE com JSON válido, sem markdown, no seguinte formato:
[
  {
    "nome": "Nome do Espaço",
    "tipo": "Salão" | "Fazenda" | "Jardim" | "Clube" | "Hotel" | "Haras",
    "bairro": "Bairro ou região",
    "capacidade": "até 200 pessoas",
    "faixaPreco": "R$ 8.000 – R$ 15.000",
    "destaque": "Uma frase curta de destaque",
    "adequado": true
  }
]

Se não souber espaços exatos da cidade, crie sugestões realistas e típicas da região.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    const locais = JSON.parse(text);
    return NextResponse.json({ locais });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar locais" }, { status: 500 });
  }
}

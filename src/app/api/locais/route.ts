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

  const prompt = `Você é especialista em casamentos no Brasil. Sugira 6 espaços para festa de casamento em "${cidade}" para ${convidados} convidados com orçamento ${orcamentoLabel[orcamento] ?? orcamento}.

Use nomes reais e conhecidos de espaços da cidade quando souber. Inclua dados de contato realistas e típicos da região.

Responda SOMENTE com JSON válido (array), sem markdown, sem texto adicional, exatamente neste formato:
[
  {
    "nome": "Nome do Espaço",
    "tipo": "Salão",
    "bairro": "Bairro ou região",
    "endereco": "Rua e número ou referência de localização",
    "capacidade": "até 200 pessoas",
    "faixaPreco": "R$ 8.000 – R$ 15.000",
    "destaque": "Uma frase curta sobre o diferencial do espaço",
    "telefone": "(11) 99999-9999",
    "whatsapp": "5511999999999",
    "instagram": "@nomeDoEspaco",
    "site": "https://nomeespaco.com.br",
    "adequado": true
  }
]

Tipos válidos: "Salão", "Fazenda", "Jardim", "Clube", "Hotel", "Haras".
Para telefone/whatsapp/instagram/site: use null se não souber dados reais da cidade.
Garanta que o JSON seja válido e parseável.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    // Extrai JSON mesmo que venha com texto extra
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("JSON não encontrado na resposta");

    const locais = JSON.parse(match[0]);
    return NextResponse.json({ locais });
  } catch (err) {
    console.error("Erro API locais:", err);
    return NextResponse.json(
      { error: "Não consegui buscar espaços agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}

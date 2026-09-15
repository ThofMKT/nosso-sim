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

REGRA IMPORTANTE: NÃO invente telefones, WhatsApp, Instagram ou sites. Deixe todos como null. Apenas informe nome, tipo, bairro, endereço aproximado, capacidade, faixa de preço e destaque.

Prefira nomes reais e conhecidos da cidade quando tiver certeza. Se não tiver certeza sobre um nome específico, use nomes genéricos típicos da região.

Responda SOMENTE com JSON válido (array), sem markdown, sem texto adicional:
[
  {
    "nome": "Nome do Espaço",
    "tipo": "Salão",
    "bairro": "Bairro ou região",
    "endereco": "Referência de localização (bairro, via principal ou ponto de referência)",
    "capacidade": "até 200 pessoas",
    "faixaPreco": "R$ 8.000 – R$ 15.000",
    "destaque": "Uma frase curta sobre o diferencial do espaço",
    "telefone": null,
    "whatsapp": null,
    "instagram": null,
    "site": null,
    "adequado": true
  }
]

Tipos válidos: "Salão", "Fazenda", "Jardim", "Clube", "Hotel", "Haras".
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

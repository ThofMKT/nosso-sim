import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { categoria, cidade, orcamento, convidados } = await req.json();

  const orcamentoLabel: Record<string, string> = {
    "15000": "até R$ 15 mil",
    "30000": "R$ 15–30 mil",
    "60000": "R$ 30–60 mil",
    "100000": "R$ 60–100 mil",
    "150000": "acima de R$ 100 mil",
  };

  const prompt = `Você é especialista em fornecedores de casamento no Brasil.
Sugira 6 fornecedores da categoria "${categoria}" em "${cidade}" para um casamento com ${convidados} convidados e orçamento ${orcamentoLabel[orcamento] ?? orcamento}.

REGRA IMPORTANTE: NÃO invente telefones, WhatsApp, Instagram ou sites. Deixe todos como null. Os contatos reais serão buscados pelo usuário via Google.

Prefira nomes reais e conhecidos da região quando tiver certeza. Se não tiver certeza sobre um nome específico, use nomes genéricos típicos da categoria e região.

Responda SOMENTE com JSON válido (array), sem markdown:
[
  {
    "nome": "Nome do Fornecedor",
    "especialidade": "Descrição curta da especialidade",
    "bairro": "Bairro ou região onde atua",
    "descricao": "Uma frase de destaque ou diferencial",
    "precoMin": 3000,
    "precoMax": 8000,
    "avaliacao": 4.8,
    "telefone": null,
    "whatsapp": null,
    "instagram": null,
    "site": null,
    "adequado": true
  }
]

Para precoMin/precoMax use números inteiros sem R$.
Garanta JSON válido e parseável.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("JSON não encontrado na resposta");

    const fornecedores = JSON.parse(match[0]);
    return NextResponse.json({ fornecedores });
  } catch (err) {
    console.error("Erro API fornecedores:", err);
    return NextResponse.json(
      { error: "Não consegui buscar fornecedores agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { imagemBase64, mediaType, orcamento, convidados, tema } = await req.json();

  const orcamentoLabel: Record<string, string> = {
    "15000": "até R$ 15 mil",
    "30000": "R$ 15–30 mil",
    "60000": "R$ 30–60 mil",
    "100000": "R$ 60–100 mil",
    "150000": "acima de R$ 100 mil",
  };

  const prompt = `Você é um decorador de casamentos especialista brasileiro. Analise este espaço e crie uma proposta de decoração objetiva.

Contexto do casal:
- Orçamento total: ${orcamentoLabel[orcamento] ?? orcamento}
- Número de convidados: ${convidados}
- Tema preferido: ${tema ?? "Clássico"}

Responda SOMENTE com JSON válido, sem markdown, neste formato exato:
{
  "estilo": "Nome do estilo sugerido (ex: Romântico Contemporâneo)",
  "descricao": "2 frases descrevendo a decoração ideal para este espaço específico",
  "cores": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "nomes_cores": ["Nome da cor 1", "Nome da cor 2", "Nome da cor 3", "Nome da cor 4"],
  "elementos": [
    "Elemento decorativo 1 específico para este espaço",
    "Elemento decorativo 2",
    "Elemento decorativo 3",
    "Elemento decorativo 4",
    "Elemento decorativo 5"
  ],
  "orcamento_decoracao": "Faixa de preço estimada só para decoração (ex: R$ 8.000 – R$ 15.000)",
  "dica_principal": "Uma dica prática e específica para este espaço que fará diferença visual",
  "pontos_positivos": ["Ponto positivo do espaço 1", "Ponto positivo 2"],
  "atencao": "Um ponto de atenção ou desafio decorativo deste espaço"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
                data: imagemBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    const sugestao = JSON.parse(text);
    return NextResponse.json({ sugestao });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao analisar imagem" }, { status: 500 });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Fornecedor = {
  nome: string;
  especialidade: string;
  bairro: string;
  descricao: string;
  precoMin: number;
  precoMax: number;
  avaliacao: number;
  telefone: string | null;
  whatsapp: string | null;
  instagram: null;
  site: string | null;
  adequado: boolean;
  reviewCount: number | null;
};

// ─── 1. Google Custom Search ──────────────────────────────────────────────────

function limparNome(titulo: string): string {
  return titulo.replace(/\s*[\-|–|·|•]\s*.{0,50}$/, "").trim().slice(0, 60);
}

async function buscarGoogle(categoria: string, cidade: string): Promise<Fornecedor[]> {
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) return [];

  const query = `${CATEGORIA_QUERIES[categoria] ?? categoria} ${cidade}`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}&gl=br&hl=pt-BR&num=8`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const data = await res.json();
  const items: { title: string; link: string; snippet: string }[] = data.items ?? [];

  return items
    .filter(item => item.link && !item.link.includes("youtube") && !item.link.includes("facebook"))
    .slice(0, 6)
    .map(item => ({
      nome: limparNome(item.title),
      especialidade: categoria,
      bairro: cidade,
      descricao: item.snippet.slice(0, 120),
      precoMin: 0,
      precoMax: 0,
      avaliacao: 0,
      telefone: null,
      whatsapp: null,
      instagram: null,
      site: item.link,
      adequado: true,
      reviewCount: null,
    }));
}

// Tags do OSM por categoria
const CATEGORIA_OSM: Record<string, string[]> = {
  Fotografia: ['["craft"="photographer"]', '["shop"="photographer"]'],
  Buffet: ['["amenity"="restaurant"]["catering"="yes"]', '["shop"="catering"]', '["amenity"="catering"]'],
  Decoração: ['["shop"="florist"]', '["craft"="florist"]'],
  Música: ['["amenity"="music_school"]', '["shop"="musical_instrument"]'],
  Bolo: ['["shop"="confectionery"]', '["shop"="bakery"]', '["craft"="confectionery"]'],
  Cerimonialista: ['["office"="event_organiser"]', '["office"="wedding_planner"]'],
  Beleza: ['["shop"="beauty"]', '["shop"="hairdresser"]'],
  Transporte: ['["amenity"="car_rental"]'],
};

const CATEGORIA_QUERIES: Record<string, string> = {
  Fotografia: "fotógrafo filmagem casamento",
  Buffet: "buffet gastronomia casamento",
  Decoração: "decoração floricultura casamento",
  Música: "DJ banda ao vivo casamento",
  Bolo: "confeitaria bolo casamento noiva",
  Cerimonialista: "cerimonialista assessoria casamento",
  Beleza: "maquiagem cabelo penteado noiva",
  Transporte: "carro noiva transporte casamento",
};

function formatPhone(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return phone;
}

function formatWhatsApp(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.startsWith("55") ? digits : "55" + digits;
}

async function buscarOverpass(lat: number, lng: number, categoria: string): Promise<Fornecedor[]> {
  const tagsFiltros = CATEGORIA_OSM[categoria];
  if (!tagsFiltros) return [];

  const raio = 20000;
  const blocos = tagsFiltros.map(f => [
    `node${f}(around:${raio},${lat},${lng});`,
    `way${f}(around:${raio},${lat},${lng});`,
  ].join("\n")).join("\n");

  const query = `[out:json][timeout:20];\n(\n${blocos}\n);\nout body center 15;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(22000),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const elementos: { tags: Record<string, string> }[] = data.elements ?? [];

  return elementos
    .filter(e => e.tags?.name)
    .slice(0, 8)
    .map(e => {
      const tags = e.tags;
      const phone = tags["phone"] ?? tags["contact:phone"] ?? tags["contact:mobile"];
      const website = tags["website"] ?? tags["contact:website"];
      const bairro = tags["addr:suburb"] ?? tags["addr:district"] ?? tags["addr:city"] ?? "";

      return {
        nome: tags.name,
        especialidade: tags["description"] ?? categoria,
        bairro,
        descricao: tags["note"] ?? `Especialista em ${categoria.toLowerCase()} para casamentos`,
        precoMin: 0,
        precoMax: 0,
        avaliacao: 0,
        telefone: formatPhone(phone),
        whatsapp: formatWhatsApp(phone),
        instagram: null,
        site: website ?? null,
        adequado: true,
        reviewCount: null,
      };
    });
}

async function buscarClaude(categoria: string, cidade: string): Promise<Fornecedor[]> {
  const prompt = `Você é especialista em fornecedores de casamento no Brasil.
Sugira 6 fornecedores da categoria "${categoria}" em "${cidade}".

REGRAS:
- Prefira nomes reais e conhecidos; se não souber, use nomes genéricos plausíveis da região
- NÃO invente telefones, instagram, whatsapp ou sites — deixe null
- Preço: estimativas realistas em números inteiros (sem R$)

JSON válido (array), sem markdown:
[{"nome":"...","especialidade":"...","bairro":"...","descricao":"...","precoMin":2000,"precoMax":8000,"avaliacao":4.5,"telefone":null,"whatsapp":null,"instagram":null,"site":null,"adequado":true,"reviewCount":null}]`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("JSON inválido");
  return JSON.parse(match[0]) as Fornecedor[];
}

export async function POST(req: NextRequest) {
  const { categoria, cidade, lat, lng } = await req.json();

  // 1. Google Custom Search (resultados reais)
  try {
    const google = await buscarGoogle(categoria, cidade);
    if (google.length >= 3) return NextResponse.json({ fornecedores: google, fonte: "google" });
  } catch (e) { console.warn("Google CSE falhou para fornecedores:", e); }

  // 2. OpenStreetMap Overpass (gratuito, sem chave)
  if (lat && lng) {
    try {
      const osm = await buscarOverpass(lat, lng, categoria);
      if (osm.length >= 3) return NextResponse.json({ fornecedores: osm, fonte: "openstreetmap" });
    } catch (err) {
      console.warn("Overpass falhou para fornecedores:", err);
    }
  }

  // 3. Claude (sugestões sem inventar contatos)
  try {
    const fornecedores = await buscarClaude(categoria, cidade);
    return NextResponse.json({ fornecedores, fonte: "ia" });
  } catch (err) {
    console.error("Erro API fornecedores:", err);
    return NextResponse.json(
      { error: "Não consegui buscar fornecedores agora. Tente novamente." },
      { status: 500 }
    );
  }
}

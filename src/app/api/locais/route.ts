import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Local = {
  nome: string;
  tipo: string;
  bairro: string;
  endereco: string | null;
  capacidade: string;
  faixaPreco: string;
  destaque: string;
  telefone: string | null;
  whatsapp: string | null;
  instagram: null;
  site: string | null;
  adequado: boolean;
  rating: number | null;
  reviewCount: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferirTipo(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes("fazenda") || t.includes("chácara") || t.includes("sítio")) return "Fazenda";
  if (t.includes("haras")) return "Haras";
  if (t.includes("jardim") || t.includes("garden")) return "Jardim";
  if (t.includes("clube") || t.includes("club")) return "Clube";
  if (t.includes("hotel") || t.includes("resort")) return "Hotel";
  return "Salão";
}

function limparNome(titulo: string): string {
  // Remove sufixos comuns de sites: "Nome | Casamentos", "Nome - Site Oficial", etc.
  return titulo.replace(/\s*[\-|–|·|•]\s*.{0,50}$/, "").trim().slice(0, 60);
}

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

// ─── 1. Google Custom Search (gratuito, 100/dia) ──────────────────────────────

async function buscarGoogle(cidade: string, convidados: string): Promise<Local[]> {
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) return [];

  const query = `espaço para casamento ${cidade} salão festa evento`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}&gl=br&hl=pt-BR&num=8`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const data = await res.json();
  const items: { title: string; link: string; snippet: string; pagemap?: Record<string, unknown> }[] = data.items ?? [];

  return items
    .filter(item => item.link && !item.link.includes("youtube") && !item.link.includes("facebook"))
    .slice(0, 6)
    .map(item => {
      const nome = limparNome(item.title);
      return {
        nome,
        tipo: inferirTipo(nome + " " + item.snippet),
        bairro: cidade,
        endereco: null,
        capacidade: "Consultar",
        faixaPreco: "A consultar",
        destaque: item.snippet.slice(0, 120),
        telefone: null,
        whatsapp: null,
        instagram: null,
        site: item.link,
        adequado: true,
        rating: null,
        reviewCount: null,
      };
    });
}

// ─── 2. Overpass / OpenStreetMap (gratuito, sem chave) ────────────────────────

async function buscarOverpass(lat: number, lng: number): Promise<Local[]> {
  const raio = 30000;
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"="event_venue"](around:${raio},${lat},${lng});
      way["amenity"="event_venue"](around:${raio},${lat},${lng});
      node["amenity"="banquet_hall"](around:${raio},${lat},${lng});
      way["amenity"="banquet_hall"](around:${raio},${lat},${lng});
      node["wedding"="venue"](around:${raio},${lat},${lng});
      way["wedding"="venue"](around:${raio},${lat},${lng});
      node["leisure"="resort"]["name"](around:${raio},${lat},${lng});
      way["leisure"="resort"]["name"](around:${raio},${lat},${lng});
    );
    out body center 20;
  `;

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
      const partes = [tags["addr:street"] && tags["addr:housenumber"] ? `${tags["addr:street"]}, ${tags["addr:housenumber"]}` : null, tags["addr:suburb"], tags["addr:city"]].filter(Boolean);
      return {
        nome: tags.name,
        tipo: inferirTipo(tags.name + " " + (tags.amenity ?? "")),
        bairro: tags["addr:suburb"] ?? tags["addr:city"] ?? "",
        endereco: partes.join(" — ") || null,
        capacidade: tags["capacity"] ? `até ${tags["capacity"]} pessoas` : "Consultar",
        faixaPreco: "A consultar",
        destaque: tags["description"] ?? `Espaço para eventos em ${tags["addr:city"] ?? "sua cidade"}`,
        telefone: formatPhone(phone),
        whatsapp: formatWhatsApp(phone),
        instagram: null,
        site: website ?? null,
        adequado: true,
        rating: null,
        reviewCount: null,
      };
    });
}

// ─── 3. Claude fallback (com prompt rigoroso, sem inventar) ──────────────────

async function buscarClaude(cidade: string, convidados: string, orcamento: string): Promise<Local[]> {
  const orcLabel: Record<string, string> = {
    "15000": "até R$15mil", "30000": "R$15–30mil", "60000": "R$30–60mil",
    "100000": "R$60–100mil", "150000": "acima de R$100mil",
  };

  const prompt = `Você é especialista em casamentos no Brasil com conhecimento de espaços por cidade.

Sugira 6 espaços para casamento em "${cidade}" para ${convidados} convidados, orçamento ${orcLabel[orcamento] ?? orcamento}.

REGRAS ABSOLUTAS:
1. APENAS salões, fazendas, haras, jardins, clubes — NUNCA hotéis ou restaurantes
2. Se souber nomes REAIS e conhecidos da cidade, use-os. Se não souber, diga "Salão [Estilo] [Bairro típico de ${cidade}]"
3. NUNCA invente telefone, whatsapp, instagram ou site — sempre null
4. Capacidade e preço devem ser estimativas realistas para a região

Responda APENAS JSON válido (sem markdown):
[{"nome":"...","tipo":"Salão","bairro":"...","endereco":null,"capacidade":"até 200 pessoas","faixaPreco":"R$8.000–15.000","destaque":"...","telefone":null,"whatsapp":null,"instagram":null,"site":null,"adequado":true,"rating":null,"reviewCount":null}]`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("JSON inválido");
  return JSON.parse(match[0]) as Local[];
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { cidade, orcamento, convidados, lat, lng } = await req.json();

  // Tentativa 1: Google Custom Search (dados reais do Google)
  try {
    const google = await buscarGoogle(cidade, convidados);
    if (google.length >= 3) return NextResponse.json({ locais: google, fonte: "google" });
  } catch (e) { console.warn("Google CSE falhou:", e); }

  // Tentativa 2: OpenStreetMap Overpass (dados reais, gratuito)
  if (lat && lng) {
    try {
      const osm = await buscarOverpass(lat, lng);
      if (osm.length >= 3) return NextResponse.json({ locais: osm, fonte: "openstreetmap" });
    } catch (e) { console.warn("Overpass falhou:", e); }
  }

  // Tentativa 3: Claude (sugestões inteligentes sem inventar contatos)
  try {
    const ia = await buscarClaude(cidade, convidados, orcamento);
    return NextResponse.json({ locais: ia, fonte: "ia" });
  } catch (e) {
    console.error("Todas as fontes falharam:", e);
    return NextResponse.json({ error: "Não consegui buscar espaços agora. Tente novamente." }, { status: 500 });
  }
}

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Tipos ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function inferirTipo(tags: Record<string, string>): string {
  const texto = JSON.stringify(tags).toLowerCase();
  if (texto.includes("fazenda") || texto.includes("farm") || texto.includes("chácara") || texto.includes("sítio")) return "Fazenda";
  if (texto.includes("haras") || texto.includes("ranch")) return "Haras";
  if (texto.includes("hotel") || texto.includes("resort")) return "Hotel";
  if (texto.includes("jardim") || texto.includes("garden")) return "Jardim";
  if (texto.includes("clube") || texto.includes("club")) return "Clube";
  return "Salão";
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

function montarEndereco(tags: Record<string, string>): string | null {
  const rua = tags["addr:street"];
  const num = tags["addr:housenumber"];
  const bairro = tags["addr:suburb"] ?? tags["addr:district"];
  const cidade = tags["addr:city"];
  const partes = [rua && num ? `${rua}, ${num}` : rua, bairro, cidade].filter(Boolean);
  return partes.length > 0 ? partes.join(" — ") : null;
}

// ── Overpass API (gratuita, sem chave) ───────────────────────────────────────

async function buscarOverpass(lat: number, lng: number): Promise<Local[]> {
  const raio = 30000; // 30km
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
      node["tourism"="resort"]["name"](around:${raio},${lat},${lng});
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
  const elementos: { tags: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number } }[] = data.elements ?? [];

  return elementos
    .filter(e => e.tags?.name)
    .slice(0, 8)
    .map(e => {
      const tags = e.tags;
      const phone = tags["phone"] ?? tags["contact:phone"] ?? tags["contact:mobile"];
      const website = tags["website"] ?? tags["contact:website"];
      const bairro = tags["addr:suburb"] ?? tags["addr:district"] ?? tags["addr:city"] ?? "";
      const destaque = tags["description"] ?? tags["note"] ?? `${inferirTipo(tags)} para eventos em ${tags["addr:city"] ?? "sua cidade"}`;

      return {
        nome: tags.name,
        tipo: inferirTipo(tags),
        bairro,
        endereco: montarEndereco(tags),
        capacidade: tags["capacity"] ? `até ${tags["capacity"]} pessoas` : "Consultar",
        faixaPreco: "A consultar",
        destaque,
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

// ── Claude como fallback ─────────────────────────────────────────────────────

async function buscarClaude(cidade: string, convidados: string, orcamento: string): Promise<Local[]> {
  const orcamentoLabel: Record<string, string> = {
    "15000": "até R$ 15 mil", "30000": "R$ 15–30 mil",
    "60000": "R$ 30–60 mil", "100000": "R$ 60–100 mil", "150000": "acima de R$ 100 mil",
  };

  const prompt = `Você é especialista em casamentos no Brasil.
Sugira 6 espaços DEDICADOS a casamentos em "${cidade}" para ${convidados} convidados com orçamento ${orcamentoLabel[orcamento] ?? orcamento}.

REGRAS:
- APENAS salões de festa, fazendas, haras, jardins, clubes — NÃO hotéis ou restaurantes comuns
- Prefira espaços conhecidos; se não souber nomes reais, use nomes genéricos plausíveis da região
- NÃO invente telefones, instagram, whatsapp ou sites — deixe null
- Capacidade e faixa de preço podem ser estimativas realistas

JSON válido (array), sem markdown:
[{"nome":"...","tipo":"Salão","bairro":"...","endereco":null,"capacidade":"até 200 pessoas","faixaPreco":"R$ 8.000–15.000","destaque":"...","telefone":null,"whatsapp":null,"instagram":null,"site":null,"adequado":true,"rating":null,"reviewCount":null}]`;

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

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { cidade, orcamento, convidados, lat, lng } = await req.json();

  // 1. Tenta Overpass (dados reais do OpenStreetMap — gratuito)
  if (lat && lng) {
    try {
      const locais = await buscarOverpass(lat, lng);
      if (locais.length >= 3) {
        return NextResponse.json({ locais, fonte: "openstreetmap" });
      }
    } catch (err) {
      console.warn("Overpass falhou, usando Claude:", err);
    }
  }

  // 2. Fallback: Claude com prompt melhorado
  try {
    const locais = await buscarClaude(cidade, convidados, orcamento);
    return NextResponse.json({ locais, fonte: "ia" });
  } catch (err) {
    console.error("Claude também falhou:", err);
    return NextResponse.json(
      { error: "Não consegui buscar espaços agora. Tente novamente." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

type SerperPlace = {
  title: string;
  address?: string;
  rating?: number;
  ratingCount?: number;
  category?: string;
  phoneNumber?: string;
  website?: string;
  description?: string;
};

const TIPO_MAP: [string, string][] = [
  ["fazenda", "Fazenda"],
  ["farm", "Fazenda"],
  ["haras", "Haras"],
  ["ranch", "Haras"],
  ["hotel", "Hotel"],
  ["resort", "Hotel"],
  ["jardim", "Jardim"],
  ["garden", "Jardim"],
  ["clube", "Clube"],
  ["country club", "Clube"],
  ["chácara", "Fazenda"],
  ["sítio", "Fazenda"],
];

function inferirTipo(category?: string, nome?: string): string {
  const texto = `${(category ?? "")} ${(nome ?? "")}`.toLowerCase();
  for (const [key, val] of TIPO_MAP) {
    if (texto.includes(key)) return val;
  }
  return "Salão";
}

function formatPhone(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Formata como (XX) XXXXX-XXXX
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0,2)}) ${local.slice(2,7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0,2)}) ${local.slice(2,6)}-${local.slice(6)}`;
  return phone;
}

function formatWhatsApp(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("55")) return digits;
  return "55" + digits;
}

function extrairBairro(address?: string, cidade?: string): string {
  if (!address) return cidade ?? "";
  const partes = address.split(",").map(s => s.trim());
  // Pega a segunda parte (geralmente bairro)
  if (partes.length >= 2) return partes[1];
  return partes[0];
}

export async function POST(req: NextRequest) {
  const { cidade, convidados } = await req.json();

  if (!process.env.SERPER_API_KEY) {
    return NextResponse.json(
      { error: "Chave de busca não configurada no servidor. Contate o administrador." },
      { status: 500 }
    );
  }

  try {
    const query = `espaço para casamento ${cidade} ${convidados} pessoas`;

    const res = await fetch("https://google.serper.dev/places", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, gl: "br", hl: "pt-br", num: 10 }),
    });

    if (!res.ok) throw new Error(`Serper error: ${res.status}`);

    const data = await res.json();
    const places: SerperPlace[] = data.places ?? [];

    if (places.length === 0) {
      return NextResponse.json(
        { error: `Nenhum espaço encontrado para "${cidade}". Tente uma cidade maior ou diferente.` },
        { status: 404 }
      );
    }

    const locais = places.slice(0, 8).map((p) => ({
      nome: p.title,
      tipo: inferirTipo(p.category, p.title),
      bairro: extrairBairro(p.address, cidade),
      endereco: p.address ?? null,
      capacidade: "Consultar",
      faixaPreco: "A consultar",
      destaque: p.description ?? `${p.category ?? "Espaço para eventos"} em ${cidade}`,
      telefone: formatPhone(p.phoneNumber),
      whatsapp: formatWhatsApp(p.phoneNumber),
      instagram: null,
      site: p.website ?? null,
      adequado: (p.rating ?? 0) >= 4.3,
      rating: p.rating ?? null,
      reviewCount: p.ratingCount ?? null,
    }));

    return NextResponse.json({ locais });
  } catch (err) {
    console.error("Erro API locais:", err);
    return NextResponse.json(
      { error: "Não consegui buscar espaços agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}

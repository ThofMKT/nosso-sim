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
  if (partes.length >= 2) return partes[1];
  return partes[0];
}

export async function POST(req: NextRequest) {
  const { categoria, cidade } = await req.json();

  if (!process.env.SERPER_API_KEY) {
    return NextResponse.json(
      { error: "Chave de busca não configurada no servidor. Contate o administrador." },
      { status: 500 }
    );
  }

  const queryBase = CATEGORIA_QUERIES[categoria] ?? `${categoria} casamento`;
  const query = `${queryBase} ${cidade}`;

  try {
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
        { error: `Nenhum fornecedor de ${categoria} encontrado em "${cidade}". Tente buscar em uma cidade maior próxima.` },
        { status: 404 }
      );
    }

    const fornecedores = places.slice(0, 8).map((p) => ({
      nome: p.title,
      especialidade: p.category ?? categoria,
      bairro: extrairBairro(p.address, cidade),
      descricao: p.description ?? `${p.category ?? categoria} em ${cidade}`,
      precoMin: 0,
      precoMax: 0,
      avaliacao: p.rating ?? 0,
      telefone: formatPhone(p.phoneNumber),
      whatsapp: formatWhatsApp(p.phoneNumber),
      instagram: null,
      site: p.website ?? null,
      adequado: (p.rating ?? 0) >= 4.3,
      reviewCount: p.ratingCount ?? null,
    }));

    return NextResponse.json({ fornecedores });
  } catch (err) {
    console.error("Erro API fornecedores:", err);
    return NextResponse.json(
      { error: "Não consegui buscar fornecedores agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Users,
  Calendar,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/dashboard/tarefas", label: "Tarefas", icon: CheckSquare },
  { href: "/dashboard/orcamento", label: "Orçamento", icon: DollarSign },
  { href: "/dashboard/convidados", label: "Convidados", icon: Users },
  { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#fdf9ee] flex flex-col">
      <nav className="bg-white border-b border-[#f2dc93] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/dashboard">
            <Image
              src="/logo.png"
              alt="Nosso Sim"
              width={1230}
              height={1278}
              className="h-9 w-auto object-contain"
            />
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#9a6e0a] hover:text-[#d4a017] transition-colors hidden sm:block"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>
      </nav>

      <main className="flex-1 pb-20 sm:pb-0">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f2dc93] z-40 sm:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                  active ? "text-[#d4a017]" : "text-[#9a6e0a]"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

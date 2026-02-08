"use client";

import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LayoutDashboard, LogOut, ArrowLeftRight, ReceiptText, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Painel' },
    { href: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
    { href: '/accounts-payable', icon: ReceiptText, label: 'Contas a Pagar' },
  ];

  return (
    <aside className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-30 border-r bg-card/50 backdrop-blur-xl p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/30">
            <Landmark className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">FinTrack</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} passHref legacyBehavior>
              <a
                className={cn(
                  "flex items-center justify-between group rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5", isActive ? "" : "text-muted-foreground group-hover:text-accent-foreground")} />
                  {item.label}
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t">
        <div className="flex items-center gap-3 p-2 bg-accent/50 rounded-2xl">
          <Avatar className="h-10 w-10 ring-2 ring-white">
            <AvatarImage src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${user?.email}`} />
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
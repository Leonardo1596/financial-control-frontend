"use client";

import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LayoutDashboard, LogOut, ArrowLeftRight } from "lucide-react";
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
  ];

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary p-2 rounded-lg">
            <Landmark className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold font-headline">FinTrack</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} passHref legacyBehavior>
            <a
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${user?.email}`} />
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <p className="font-semibold truncate">{user?.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Landmark, LogOut, LayoutDashboard, ArrowLeftRight, ReceiptText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const getInitials = (name?: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
};

export function MobileHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Painel' },
    { href: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
    { href: '/accounts-payable', icon: ReceiptText, label: 'Contas a Pagar' },
  ];

  return (
    <header className="flex h-16 items-center border-b bg-card px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <div className="flex items-center gap-3 p-4 border-b">
             <div className="bg-primary p-2 rounded-lg">
                <Landmark className="h-6 w-6 text-primary-foreground" />
             </div>
             <h1 className="text-xl font-bold font-headline">FinTrack</h1>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-4">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} passHref legacyBehavior>
                <a
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t">
            <div className="flex items-center gap-3 p-4">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/8.x/adventurer/svg?seed=${user?.email}`} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="font-semibold truncate">{user?.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <div className="p-4 pt-0">
                <Button variant="outline" className="w-full justify-center" onClick={() => { logout(); setOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-3 ml-4">
        <Link href="/" className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
                <Landmark className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold font-headline sm:block">FinTrack</h1>
        </Link>
      </div>
    </header>
  );
}

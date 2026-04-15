"use client";

import { useState, useEffect } from "react";
import { Bell, AlertCircle, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { API_BASE_URL } from "@/lib/api";
import type { AccountPayable } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AccountPayable[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchAlerts() {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data: AccountPayable[] = await response.json();

          const alerts = data.filter((acc) => {
            if (acc.status === "paga") return false;
            if (acc.status === "atrasada") return true;

            const dueDate = parseISO(acc.dueDate);
            const diff = dueDate.getTime() - new Date().getTime();
            const daysToDue = diff / (1000 * 60 * 60 * 24);

            return daysToDue <= 10;
          });

          setNotifications(alerts.slice(0, 5));
          setUnreadCount(alerts.length);
        }
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000 * 5);
    return () => clearInterval(interval);
  }, [token]);

  // 👇 limpa quando abre
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "+9" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 rounded-2xl border-none shadow-2xl"
        align="end"
      >
        <div className="p-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-900">Alertas Financeiros</h3>
          <p className="text-xs text-slate-500">
            Acompanhe seus vencimentos
          </p>
        </div>

        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-20" />
              <p className="text-sm font-medium text-slate-400">
                Tudo em dia por aqui!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notif) => {
                const date = parseISO(notif.dueDate);
                const isAtrasada = notif.status === "atrasada";

                return (
                  <Link
                    key={notif._id}
                    href="/accounts-payable"
                    className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        isAtrasada
                          ? "bg-rose-50 text-rose-500"
                          : "bg-amber-50 text-amber-500"
                      )}
                    >
                      {isAtrasada ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-800 truncate">
                        {notif.description}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Vence em{" "}
                        {format(date, "dd/MM", { locale: ptBR })} • R${" "}
                        {notif.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-50 bg-slate-50/50">
          <Link href="/accounts-payable">
            <Button
              variant="ghost"
              className="w-full h-9 text-xs font-bold text-primary hover:text-primary hover:bg-white rounded-lg"
            >
              Ver Todas as Contas
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
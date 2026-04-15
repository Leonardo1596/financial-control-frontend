"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function PendingHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handlePending() {
      const id = localStorage.getItem("pendingTransactionId");

      if (!id) return;

      console.log("Global Pending Handler detectado:", id);

      // Se não estivermos na página de transações, navegamos usando o roteador do Next.js
      if (pathname !== "/transactions") {
        router.push("/transactions");
      }
    }

    // Verifica ao montar o componente
    handlePending();

    // Listener para quando o app volta do background (Capacitor Resume)
    const handleResume = () => {
      console.log("App resumido, verificando pendências...");
      handlePending();
    };

    document.addEventListener("resume", handleResume);

    return () => {
      document.removeEventListener("resume", handleResume);
    };
  }, [pathname, router]);

  return null;
}

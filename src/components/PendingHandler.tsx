"use client";

import { useEffect } from "react";

export function PendingHandler() {
  useEffect(() => {
    function handlePending() {
      const id = localStorage.getItem("pendingTransactionId");

      if (!id) return;

      console.log("GLOBAL Pending:", id);

      if (window.location.pathname !== "/transactions") {
        window.location.href = "/transactions";
        return;
      }
    }

    handlePending();

    document.addEventListener("resume", handlePending);

    return () => {
      document.removeEventListener("resume", handlePending);
    };
  }, []);

  return null;
}
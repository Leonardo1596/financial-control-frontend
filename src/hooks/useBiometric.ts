"use client";

import { useEffect, useRef, useState } from "react";
import { isBiometricAvailable, authenticateWithBiometric } from "../services/biometric";

export function useBiometricAuth() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const runAuth = async () => {
      try {
        const stored = localStorage.getItem("fintrack_user");
        const token = stored ? JSON.parse(stored).token : null;

        if (!token) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const hasBiometric = await isBiometricAvailable();

        if (!hasBiometric) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        const success = await authenticateWithBiometric();

        if (success) {
          setAuthorized(true);
        } else {
          localStorage.removeItem("fintrack_user");
          setAuthorized(false);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setAuthorized(false);
        setLoading(false);
      }
    };

    runAuth();
  }, []);

  return { authorized, loading };
}
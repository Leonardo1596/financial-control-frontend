"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBiometricAuth } from "../../hooks/useBiometric";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { authorized, loading } = useBiometricAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !authorized) {
            router.replace("/login");
        }
    }, [authorized, loading, router]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white">
                <img
                    src="/images/fintrack.png"
                    alt="Fintrack Logo"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain animate-pulse"
                />
            </div>
        );
    }

    if (!authorized) return null;

    return <>{children}</>;
}
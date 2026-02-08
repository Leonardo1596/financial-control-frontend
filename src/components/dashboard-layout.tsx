"use client";

import { AuthProvider, useRequireAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen w-full bg-background flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col md:pl-64">
          <MobileHeader />
          <main className="flex-1 w-full max-w-7xl mx-auto p-6 sm:p-8 lg:p-12 xl:p-16 transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthenticatedLayout>{children}</AuthenticatedLayout>
        </AuthProvider>
    )
}

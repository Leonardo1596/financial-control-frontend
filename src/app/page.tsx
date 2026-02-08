import DashboardLayout from "@/components/dashboard-layout";
import Summary from "@/components/dashboard/summary";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-6xl mx-auto">
        <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight">Visão Geral</h1>
            <p className="text-muted-foreground text-lg">Bem-vindo ao seu centro de controle financeiro.</p>
        </div>
        <Summary />
      </div>
    </DashboardLayout>
  );
}
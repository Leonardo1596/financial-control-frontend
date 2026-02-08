import DashboardLayout from "@/components/dashboard-layout";
import Summary from "@/components/dashboard/summary";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-12">
        <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Visão Geral</h1>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
              Bem-vindo ao seu centro de controle financeiro. Acompanhe seu desempenho e tome decisões mais inteligentes.
            </p>
        </div>
        <Summary />
      </div>
    </DashboardLayout>
  );
}

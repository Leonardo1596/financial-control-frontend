import DashboardLayout from "@/components/dashboard-layout";
import GoalsClient from "@/components/goals/client";

export default function GoalsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-headline">Objetivos e Sonhos</h1>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
              Defina suas metas financeiras, acompanhe seu progresso e realize seus sonhos com planejamento.
            </p>
        </div>
        <GoalsClient />
      </div>
    </DashboardLayout>
  );
}

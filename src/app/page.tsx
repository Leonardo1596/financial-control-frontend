import DashboardLayout from "@/components/dashboard-layout";
import Summary from "@/components/dashboard/summary";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Painel</h1>
        </div>
        <Summary />
      </div>
    </DashboardLayout>
  );
}

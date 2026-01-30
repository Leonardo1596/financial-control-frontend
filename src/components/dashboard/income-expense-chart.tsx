"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Summary } from "@/lib/types"

interface IncomeExpenseChartProps {
  summary: Summary;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const chartConfig = {
  amount: {
    label: "Valor",
  },
  income: {
    label: "Renda",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Despesa",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function IncomeExpenseChart({ summary }: IncomeExpenseChartProps) {
  const chartData = [
    { type: "Renda", amount: summary.income, fill: "var(--color-income)" },
    { type: "Despesa", amount: summary.expense, fill: "var(--color-expense)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Renda vs. Despesa</CardTitle>
        <CardDescription>Comparativo entre receitas e despesas do mês selecionado.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="type"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value as number)}
              tickLine={false}
              axisLine={false}
              stroke="hsl(var(--muted-foreground))"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
            />
            <Bar dataKey="amount" radius={8}>
                {chartData.map((entry) => (
                    <Cell key={entry.type} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

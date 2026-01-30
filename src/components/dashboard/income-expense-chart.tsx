"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Summary } from "@/lib/types"

interface IncomeExpenseChartProps {
  summary: Summary
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

const chartConfig = {
  amount: { label: "Valor" },
  income: { label: "Renda", color: "hsl(var(--chart-1))" },
  expense: { label: "Despesa", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

export default function IncomeExpenseChart({ summary }: IncomeExpenseChartProps) {
  const chartData = [
    { type: "Renda", amount: summary.income, fill: "var(--color-income)" },
    { type: "Despesa", amount: summary.expense, fill: "var(--color-expense)" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Renda vs. Despesa</CardTitle>
        <CardDescription>
          Comparativo entre receitas e despesas do mês.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="type"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              width={80}
              tickFormatter={(value) => formatCurrency(value as number)}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    formatCurrency(value as number)
                  }
                />
              }
            />

            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

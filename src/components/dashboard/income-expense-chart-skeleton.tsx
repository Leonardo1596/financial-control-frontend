import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function IncomeExpenseChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent className="h-[250px] w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
            </CardContent>
        </Card>
    )
}

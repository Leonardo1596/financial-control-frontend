"use client";

import { Goal } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Calendar, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalsListProps {
  goals: Goal[];
  loading: boolean;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onAddValue: (goal: Goal) => void;
  onRemoveValue: (goal: Goal) => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function GoalsList({ goals, loading, onEdit, onDelete, onAddValue, onRemoveValue }: GoalsListProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
        <Target className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium">Você ainda não definiu nenhum objetivo.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => {
        const currentAmount = goal.accumulated?.total || 0;
        const progress = Math.min(100, Math.round((currentAmount / goal.targetAmount) * 100));
        const deadlineDate = goal.deadline ? parseISO(goal.deadline) : null;
        const adjustedDeadline = deadlineDate ? new Date(deadlineDate.getTime() + deadlineDate.getTimezoneOffset() * 60000) : null;

        return (
          <Card key={goal._id} className="group relative overflow-hidden border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-xl transition-all">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Target className="h-6 w-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(goal)} className="h-9 w-9 rounded-lg text-slate-400 hover:text-primary">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(goal._id)} className="h-9 w-9 rounded-lg text-slate-400 hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 truncate">{goal.name}</h3>
                  {adjustedDeadline && (
                    <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {format(adjustedDeadline, 'dd MMM yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Atual</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(currentAmount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta</span>
                      <p className="font-bold text-slate-600">{formatCurrency(goal.targetAmount)}</p>
                    </div>
                  </div>

                  <div className="relative pt-2">
                    <Progress value={progress} className="h-3 rounded-full bg-slate-100" />
                    <span className="absolute top-0 right-0 -mt-1 text-[10px] font-black text-primary bg-white px-1.5 rounded-full border border-primary/20">
                      {progress}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button 
                    onClick={() => onAddValue(goal)}
                    className="h-11 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-200"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onRemoveValue(goal)}
                    className="h-11 rounded-xl font-bold border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Retirar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

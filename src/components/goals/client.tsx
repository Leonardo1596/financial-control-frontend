"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Goal } from '@/lib/types';
import GoalsList from './list';
import GoalsForm from './form';
import ContributionForm from './contribution-form';
import WithdrawalForm from './withdrawal-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Target } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function GoalsClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar objetivos');
      const data = await response.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenForm = (goal: Goal | null = null) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleOpenContribution = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsContributionOpen(true);
  };

  const handleOpenWithdraw = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsWithdrawOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este objetivo?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/goal/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar objetivo');
      toast({ title: 'Sucesso', description: 'Objetivo removido.' });
      fetchGoals();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  return (
    <div className="flex flex-col w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Suas Metas</h2>
            <p className="text-sm text-slate-500">Acompanhe seu progresso real.</p>
          </div>
        </div>

        <Button 
          onClick={() => handleOpenForm()} 
          className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Novo Objetivo
        </Button>
      </div>

      <GoalsList
        goals={goals}
        loading={loading}
        onEdit={handleOpenForm}
        onDelete={handleDelete}
        onAddValue={handleOpenContribution}
        onRemoveValue={handleOpenWithdraw}
      />

      <GoalsForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchGoals}
        goalToEdit={editingGoal}
      />

      <ContributionForm
        isOpen={isContributionOpen}
        onClose={() => setIsContributionOpen(false)}
        onSuccess={fetchGoals}
        goal={selectedGoal}
      />

      <WithdrawalForm
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={fetchGoals}
        goal={selectedGoal}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Landmark, Loader2, ArrowRight, UserPlus } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Preferences } from '@capacitor/preferences';

const formSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

async function loginUser(data: z.infer<typeof formSchema>) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Falha no login.' }));
    throw new Error(errorData.message || 'Falha no login');
  }
  return response.json();
}

function LoginPageContent() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

async function onSubmit(values: z.infer<typeof formSchema>) {
  setIsLoading(true);
  try {
    const data = await loginUser(values);

    // Busca contas
    const accountsResponse = await fetch(
      `${API_BASE_URL}/list-accounts?month=${month}&year=${year}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
      }
    );

    let accountsData: any[] = [];
    try {
      accountsData = await accountsResponse.json();
      console.log('Contas recebidas:', accountsData);
    } catch {
      accountsData = [];
    }

    if (!accountsResponse.ok && accountsData.length === 0) {
      throw new Error("Falha ao buscar contas");
    }

    // Salva auth
    await Preferences.set({ key: "userToken", value: data.token });
    await Preferences.set({ key: "userId", value: data.user.id });

    // Salva contas (PADRÃO QUE O ANDROID PRECISA USAR IGUAL)
    if (Array.isArray(accountsData)) {
      for (const acc of accountsData) {
        const key = `account_${data.user.id}_${acc.name
          .toLowerCase()
          .trim()}`;

        await Preferences.set({
          key,
          value: acc._id,
        });
      }
    }
    login(data);

    toast({
      title: "Login bem-sucedido",
      description: `Bem-vindo de volta, ${data.user.name}!`,
    });

    router.replace("/");
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Erro",
      description:
        error instanceof Error ? error.message : "Erro desconhecido.",
    });
  } finally {
    setIsLoading(false);
  }
}

  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen bg-background">
      {/* Lado Esquerdo - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">FinTrack</span>
        </div>
        <div>
          <h1 className="text-5xl font-bold leading-tight mb-6">Controle suas finanças com inteligência.</h1>
          <p className="text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
            A ferramenta definitiva para gestão de contas, transações e planejamento financeiro pessoal de alto nível.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60 font-medium">
          © 2024 FinTrack. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Entrar na sua conta</h2>
            <p className="text-slate-500">Gestão financeira ao seu alcance.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="nome@exemplo.com" className="h-12 rounded-xl border-slate-200 focus:ring-primary/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-semibold text-slate-700">Senha</FormLabel>
                      <Button variant="link" className="px-0 font-bold text-xs uppercase tracking-wider text-primary" type="button">Esqueceu?</Button>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-slate-200 focus:ring-primary/20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20 rounded-xl transition-all hover:scale-[1.01]" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Entrar Agora <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
            </form>
          </Form>

          <div className="text-center pt-4">
            <p className="text-sm text-slate-500">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                <UserPlus className="h-4 w-4" /> Cadastre-se grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (<AuthProvider><LoginPageContent /></AuthProvider>)
}
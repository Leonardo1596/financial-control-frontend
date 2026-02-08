"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Landmark, Loader2, ArrowRight } from "lucide-react";

async function loginUser(data: z.infer<typeof formSchema>) {
  const response = await fetch("https://financial-control-9s01.onrender.com/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Falha no login devido a erro no servidor.' }));
    throw new Error(errorData.message || 'Falha no login');
  }
  return response.json();
}

const formSchema = z.object({
  email: z.string().email({ message: "Endereço de e-mail inválido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

function LoginPageContent() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
      login(data);
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo de volta, ${data.user.name}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (loading || user) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-background">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <main className="flex min-h-screen">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">FinTrack</span>
        </div>
        <div>
          <h1 className="text-5xl font-bold leading-tight mb-6">Controle suas finanças com inteligência.</h1>
          <p className="text-xl text-primary-foreground/80 max-w-lg">
            A ferramenta definitiva para gestão de contas, transações e planejamento financeiro pessoal.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © 2024 FinTrack. Todos os direitos reservados.
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Entrar na sua conta</h2>
            <p className="text-muted-foreground mt-2">Gestão financeira ao seu alcance.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="nome@exemplo.com" className="h-12" {...field} />
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
                        <FormLabel>Senha</FormLabel>
                        <Button variant="link" className="px-0 font-normal text-sm" type="button">Esqueceu a senha?</Button>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Entrar <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
    return (
        <AuthProvider>
            <LoginPageContent />
        </AuthProvider>
    )
}
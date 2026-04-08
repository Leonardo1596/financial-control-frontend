"use client";

import { useState } from "react";
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
import { Landmark, Loader2, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

function RegisterPageContent() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha no cadastro.' }));
        throw new Error(errorData.message || 'Falha no cadastro');
      }

      toast({ title: "Conta criada!", description: "Agora você pode entrar no sistema." });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error instanceof Error ? error.message : "Erro desconhecido.",
      });
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-5xl font-bold leading-tight mb-6">Comece sua jornada financeira hoje.</h1>
          <p className="text-xl text-primary-foreground/80 max-w-lg">
            Junte-se a milhares de pessoas que já transformaram sua relação com o dinheiro usando o FinTrack.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © 2024 FinTrack. Todos os direitos reservados.
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Criar nova conta</h2>
            <p className="text-muted-foreground mt-2">Preencha os dados para começar sua gestão.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="nome@exemplo.com" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Confirmar</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 mt-4" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>Criar conta <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
            </form>
          </Form>
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
    return (<AuthProvider><RegisterPageContent /></AuthProvider>)
}

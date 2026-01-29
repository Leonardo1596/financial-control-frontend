"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, File as FileIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      if (files[0].type === 'text/csv') {
        setFile(files[0]);
      } else {
        toast({ variant: 'destructive', title: 'Tipo de Arquivo Inválido', description: 'Por favor, faça o upload de um arquivo CSV.' });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Nenhum Arquivo Selecionado', description: 'Por favor, selecione um arquivo para fazer o upload.' });
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://financial-control-9s01.onrender.com/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error('Falha no upload do arquivo');
      toast({ title: 'Sucesso', description: 'Transações importadas com sucesso.' });
      onUploadSuccess();
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar de CSV</CardTitle>
        <CardDescription>Faça o upload de um arquivo CSV para adicionar várias transações de uma vez.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="csv-file">Arquivo CSV</Label>
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
        </div>
        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md bg-accent/20">
            <FileIcon className="h-4 w-4" />
            <span>{file.name}</span>
          </div>
        )}
        <Button onClick={handleUpload} disabled={isLoading || !file} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          Enviar Arquivo
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, File as FileIcon, CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
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
    if (!startDate || !endDate) {
      toast({ variant: 'destructive', title: 'Período não selecionado', description: 'Por favor, selecione as datas de início e fim.' });
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startDate', format(startDate, 'yyyy-MM-dd'));
    formData.append('endDate', format(endDate, 'yyyy-MM-dd'));

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
      setStartDate(undefined);
      setEndDate(undefined);
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
        
        <div className="grid grid-cols-2 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Data de início</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Data de fim</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) =>
                  startDate ? date < startDate : false
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md bg-accent/20">
            <FileIcon className="h-4 w-4" />
            <span>{file.name}</span>
          </div>
        )}
        <Button onClick={handleUpload} disabled={isLoading || !file || !startDate || !endDate} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          Enviar Arquivo
        </Button>
      </CardContent>
    </Card>
  );
}

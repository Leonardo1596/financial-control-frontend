"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, File as FileIcon, CalendarIcon, FileSpreadsheet } from 'lucide-react';
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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
        setFile(files[0]);
      } else {
        toast({ variant: 'destructive', title: 'Arquivo Inválido', description: 'Por favor, selecione apenas arquivos CSV.' });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Sem arquivo', description: 'Selecione um arquivo CSV para continuar.' });
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (startDate) {
      formData.append('startDate', format(startDate, 'yyyy-MM-dd'));
    }
    if (endDate) {
      formData.append('endDate', format(endDate, 'yyyy-MM-dd'));
    }

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

  const isButtonDisabled = isLoading || !file;

  return (
    <Card className="border-none bg-slate-50/50 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          Importar CSV
        </CardTitle>
        <CardDescription>Envie múltiplos registros de uma vez.</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="csv-file" className="text-xs font-bold uppercase tracking-wider text-slate-500">Arquivo CSV</Label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all cursor-pointer group"
          >
            <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-slate-600">Clique para selecionar</span>
            <Input id="csv-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full bg-white rounded-xl border-slate-100 h-11 text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                  {startDate ? format(startDate, "dd/MM", { locale: ptBR }) : <span>Selecione</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="rounded-2xl" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full bg-white rounded-xl border-slate-100 h-11 text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                  {endDate ? format(endDate, "dd/MM", { locale: ptBR }) : <span>Selecione</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => startDate ? date < startDate : false} initialFocus className="rounded-2xl" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <FileIcon className="h-4 w-4" />
            </div>
            <span className="truncate flex-1">{file.name}</span>
          </div>
        )}
        <Button onClick={handleUpload} disabled={isButtonDisabled} className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          Importar Agora
        </Button>
      </CardContent>
    </Card>
  );
}
